/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Header from "@/components/Header";
import CourseSidebar from "@/components/CourseSidebar";
import EditCourseSheet from "@/components/EditCourseSheet";
import NewLessonSheet from "@/components/NewLessonSheet";
import { useCourse, useUpdateCourse } from "@/hooks/useCourses";
import { useLessons, useLesson } from "@/hooks/useLessons";
import { useSubscription } from "@/hooks/useSubscriptions";
import { useArchiveCourse, useDeleteCourse } from "@/hooks/useCourses";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { Check, CreditCard, Lock as LockIcon, Archive, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { centsToDollars } from "@/lib/priceUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Lesson } from "@/types/course";

export default function CourseDetails() {
  const { id: courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useCourse(courseId || "");
  const { data: lessons, isLoading: lessonsLoading } = useLessons(
    courseId || ""
  );
  const { data: currentLesson } = useLesson(lessonId || "");
  const { data: subscription, isLoading: subscriptionLoading } =
    useSubscription(courseId || "");

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isNewLessonSheetOpen, setIsNewLessonSheetOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingContentRef = useRef(false);

  // Update course mutation
  const { mutate: updateCourse, isPending: isUpdatingCourse } = useUpdateCourse(
    courseId || ""
  );

  // Archive and delete mutations
  const { mutate: archiveCourse, isPending: isArchiving } = useArchiveCourse(courseId || "");
  const { mutate: deleteCourse, isPending: isDeleting } = useDeleteCourse(courseId || "");

  // Helper function to ensure blocks have IDs
  const validateBlockContent = (content: any): any => {
    console.log("validateBlockContent input type:", typeof content);
    console.log("validateBlockContent input value:", content);

    // If content is a string (because column is TEXT not JSONB), parse it
    let parsedContent = content;
    if (typeof content === "string") {
      console.log("Content is a string, parsing JSON...");
      try {
        parsedContent = JSON.parse(content);
        console.log("Parsed content:", parsedContent);
      } catch (error) {
        console.error("Failed to parse content JSON:", error);
        return undefined;
      }
    }

    if (!Array.isArray(parsedContent)) {
      console.log("Content is not an array after parsing, returning undefined");
      return undefined;
    }

    // Ensure each block has an id
    return parsedContent.map((block: any) => {
      if (!block || typeof block !== "object") return block;

      // If block doesn't have an id, generate one
      if (!block.id) {
        return {
          ...block,
          id: crypto.randomUUID(),
        };
      }

      return block;
    });
  };

  // Create editor
  const editor = useCreateBlockNote();

  // Check if current user can edit the course
  const canEdit = useMemo(() => {
    return user?.id === course?.owner_id;
  }, [user?.id, course?.owner_id]);

  // Check if user has access to view course content
  const hasAccess = useMemo(() => {
    // Owner always has access
    if (canEdit) return true;

    // No subscription = no access
    if (!subscription) return false;

    // Cancelled or expired = no access
    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      return false;
    }

    // Active or past_due (payment issue but in grace period)
    if (subscription.status === 'active' || subscription.status === 'past_due') {
      // Check if subscription hasn't expired (with 48h grace period)
      const expirationDate = new Date(subscription.ends_at || '').getTime();
      const gracePeriod = 48 * 60 * 60 * 1000; // 48 hours
      const now = Date.now();

      return now < expirationDate + gracePeriod;
    }

    return false;
  }, [canEdit, subscription]);

  // Auto-save lesson content with debouncing
  const saveContent = useCallback(
    async (content: any) => {
      if (!lessonId || !courseId) return;

      console.log("=== SAVING CONTENT ===");
      console.log("Number of blocks:", content.length);
      console.log("Content:", JSON.stringify(content, null, 2));

      try {
        const { error } = await supabase
          .from("lessons")
          .update({ content })
          .eq("id", lessonId);

        if (error) throw error;

        console.log("Content saved successfully");

        // Update React Query cache with the new content (without refetching)
        // This ensures when we navigate away and back, we see the saved content
        queryClient.setQueryData(["lesson", lessonId], (oldData: any) => {
          if (!oldData) return oldData;
          return { ...oldData, content };
        });

        // Show saved indicator briefly
        setShowSaved(true);
        if (savedIndicatorTimeoutRef.current) {
          clearTimeout(savedIndicatorTimeoutRef.current);
        }
        savedIndicatorTimeoutRef.current = setTimeout(() => {
          setShowSaved(false);
        }, 2000);
      } catch (error) {
        console.error("Failed to save content:", error);
        toast.error("Failed to save changes");
      }
    },
    [lessonId, courseId, queryClient]
  );

  // Debounced auto-save handler
  const handleContentChange = useCallback(() => {
    if (!editor || !canEdit) return;

    // Don't trigger auto-save if we're loading content
    if (isLoadingContentRef.current) {
      console.log("Skipping auto-save during content load");
      return;
    }

    console.log("Content changed, scheduling auto-save in 2 seconds...");

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      console.log("Cleared previous auto-save timeout");
    }

    // Set new timeout to save after 2 seconds of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      console.log("Auto-save timeout reached, checking content before save...");
      const content = editor.document;

      // Check if any image or video blocks are still loading/incomplete
      const hasIncompleteMedia = content.some((block: any) => {
        // Check for incomplete images
        if (block.type === "image" && (!block.props?.url || block.props?.url === "")) {
          return true;
        }
        // Check for incomplete videos
        if (block.type === "video" && (!block.props?.url || block.props?.url === "")) {
          return true;
        }
        return false;
      });

      if (hasIncompleteMedia) {
        console.log("Found incomplete media blocks (image/video), delaying save by 1 second...");
        // Retry after 1 second if media is still loading
        saveTimeoutRef.current = setTimeout(() => {
          saveContent(editor.document);
        }, 1000);
      } else {
        saveContent(content);
      }
    }, 2000);
  }, [editor, canEdit, saveContent]);

  // Load lesson content into editor when it becomes available
  useEffect(() => {
    if (!editor || !currentLesson) return;

    console.log("Loading content for lesson:", currentLesson.id);
    console.log("Raw content from DB:", currentLesson.content);

    const validatedContent = validateBlockContent(currentLesson.content);
    console.log("Validated content:", validatedContent);
    console.log("Current editor blocks:", editor.document);

    // Set flag to prevent auto-save during loading
    isLoadingContentRef.current = true;

    // If we have content, load it; otherwise clear the editor
    if (validatedContent && validatedContent.length > 0) {
      // Replace all blocks with the lesson content
      editor.replaceBlocks(editor.document, validatedContent);
      console.log("Content loaded into editor");
    } else {
      // Clear editor for empty/new lessons
      editor.replaceBlocks(editor.document, [
        {
          type: "paragraph",
          content: "",
        },
      ]);
      console.log("Cleared editor for empty lesson");
    }

    // Clear flag after a short delay to allow the change event to fire
    setTimeout(() => {
      isLoadingContentRef.current = false;
      console.log("Content loading complete, auto-save re-enabled");
    }, 100);
  }, [editor, currentLesson]);

  // Listen to editor changes for auto-save
  useEffect(() => {
    if (!editor) return;

    const unsubscribe = editor.onChange(() => {
      handleContentChange();
    });

    return () => {
      unsubscribe();
    };
  }, [editor, handleContentChange]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }
    };
  }, []);

  // Handle lesson click
  const handleLessonClick = (newLessonId: string) => {
    navigate(`/courses/${courseId}/lessons/${newLessonId}`);
  };

  // Handle new lesson created
  const handleLessonCreated = (newLesson: Lesson) => {
    // Navigate to the newly created lesson
    navigate(`/courses/${courseId}/lessons/${newLesson.id}`);
  };

  // Handle lesson title update
  const handleLessonTitleUpdate = async (
    lessonIdToUpdate: string,
    newTitle: string
  ) => {
    if (!courseId) return;

    try {
      const { data, error } = await supabase
        .from("lessons")
        .update({ title: newTitle.trim() })
        .eq("id", lessonIdToUpdate)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Failed to update lesson");
      }

      toast.success("Lesson title updated!");

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonIdToUpdate] });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to update lesson: ${errorMessage}`);
    }
  };

  // Handle publish/unpublish toggle
  const handlePublishToggle = (checked: boolean) => {
    if (!course) return;

    // If trying to publish (checked = true), show confirmation
    if (checked && course.status === "draft") {
      setShowPublishConfirm(true);
    } else if (!checked && course.status === "published") {
      // Unpublish immediately without confirmation
      updateCourse(
        { status: "draft" },
        {
          onSuccess: () => {
            toast.success("Course unpublished successfully!");
          },
          onError: (error) => {
            toast.error(`Failed to unpublish course: ${error.message}`);
          },
        }
      );
    }
  };

  // Confirm and publish course
  const confirmPublish = () => {
    if (!course) return;

    updateCourse(
      { status: "published" },
      {
        onSuccess: () => {
          toast.success("Course published successfully!");
          setShowPublishConfirm(false);
        },
        onError: (error) => {
          toast.error(`Failed to publish course: ${error.message}`);
          setShowPublishConfirm(false);
        },
      }
    );
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (!course || !user) return;

    // Prevent multiple simultaneous checkout attempts
    if (isCheckingOut) return;

    setIsCheckingOut(true);

    try {
      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Please log in to enroll");
        setIsCheckingOut(false);
        return;
      }

      // Call Edge Function to create checkout session
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            courseId,
            userId: user.id,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout (using the URL directly)
      if (data.url) {
        // Don't reset isCheckingOut - we're leaving the page
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to initiate checkout. Please try again."
      );
      setIsCheckingOut(false);
    }
  };

  // Handle archive course
  const handleArchive = () => {
    archiveCourse(undefined, {
      onSuccess: () => {
        toast.success("Course archived successfully");
        setShowArchiveDialog(false);
      },
      onError: (error) => {
        toast.error(error.message);
        setShowArchiveDialog(false);
      },
    });
  };

  // Handle delete course
  const handleDelete = () => {
    deleteCourse(undefined, {
      onSuccess: () => {
        toast.success("Course deleted successfully");
        setShowDeleteDialog(false);
      },
      onError: (error) => {
        toast.error(error.message);
        setShowDeleteDialog(false);
      },
    });
  };

  if (!courseId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No course found</h1>
          <p className="text-muted-foreground">The course ID is missing.</p>
        </div>
      </div>
    );
  }

  if (courseLoading || lessonsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading course...</div>
        </div>
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-destructive">Error</h1>
          <p className="text-muted-foreground">{courseError.message}</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Course not found</h1>
          <p className="text-muted-foreground">This course does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Fixed Header */}
      <Header />

      {/* Main flex area: takes remaining height */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <CourseSidebar
          course={course}
          lessons={lessons}
          currentLessonId={lessonId}
          onLessonClick={handleLessonClick}
          onEditClick={() => setIsEditSheetOpen(true)}
          onNewLessonClick={() => setIsNewLessonSheetOpen(true)}
          onLessonTitleUpdate={handleLessonTitleUpdate}
          canEdit={canEdit}
        />

        {/* Main content area */}
        <main className="flex-1 flex flex-col bg-[#1F1F1F] overflow-hidden">
          {/* Course Banner - Full width */}
          {course.thumbnail_url && (
            <div className="w-full h-40 shrink-0">
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Lesson Content */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {currentLesson ? (
              <>
                {/* Top right indicators */}
                <div className="absolute top-4 right-8 z-10 flex items-center gap-3">
                  {/* Archive and Delete Buttons - Only shown to course owner */}
                  {canEdit && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowArchiveDialog(true)}
                        disabled={isArchiving}
                        className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isDeleting}
                        className="bg-destructive/80 backdrop-blur-sm hover:bg-destructive/90"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}

                  {/* Publish Toggle - Only shown to course owner */}
                  {canEdit && (
                    <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-md border border-border shadow-sm">
                      <span className="text-xs font-medium text-muted-foreground">
                        Draft
                      </span>
                      <Switch
                        checked={course.status === "published"}
                        onCheckedChange={handlePublishToggle}
                        disabled={isUpdatingCourse}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        Published
                      </span>
                    </div>
                  )}

                  {/* Saving Indicator */}
                  {canEdit && showSaved && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-border shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      <span>Saved</span>
                    </div>
                  )}
                </div>

                {/* Editor or Paywall */}
                <div className="flex-1 flex flex-col p-8 overflow-y-auto">
                  {hasAccess ? (
                    <BlockNoteView editor={editor} editable={canEdit} />
                  ) : (
                    /* Paywall */
                    <div className="flex-1 flex items-center justify-center">
                      <div className="max-w-md text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                          <LockIcon className="w-10 h-10 text-muted-foreground" />
                        </div>

                        <h2 className="text-3xl font-bold">
                          Enroll to Access This Course
                        </h2>

                        <p className="text-muted-foreground text-lg">
                          Get unlimited access to all lessons and course
                          materials with a monthly subscription.
                        </p>

                        <div className="bg-muted/50 rounded-lg p-6 space-y-2">
                          <div className="text-4xl font-bold">
                            {centsToDollars(course.price)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            per month
                          </div>
                        </div>

                        <Button
                          size="lg"
                          onClick={handleCheckout}
                          disabled={isCheckingOut || subscriptionLoading}
                          className="w-full"
                        >
                          {isCheckingOut ? (
                            <>
                              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-5 h-5 mr-2" />
                              Enroll Now
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-muted-foreground">
                          Cancel anytime. No questions asked.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  {lessons && lessons.length > 0 ? (
                    <>
                      <p className="text-lg mb-2">Select a lesson to begin</p>
                      <p className="text-sm">
                        Choose a lesson from the sidebar
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg mb-2">No lessons available</p>
                      <p className="text-sm">This course has no lessons yet</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Course Sheet */}
      {canEdit && (
        <>
          <EditCourseSheet
            course={course}
            open={isEditSheetOpen}
            onOpenChange={setIsEditSheetOpen}
          />
          <NewLessonSheet
            courseId={courseId}
            open={isNewLessonSheetOpen}
            onOpenChange={setIsNewLessonSheetOpen}
            existingLessons={lessons}
            onLessonCreated={handleLessonCreated}
          />
        </>
      )}

      {/* Publish Confirmation Dialog */}
      <AlertDialog
        open={showPublishConfirm}
        onOpenChange={setShowPublishConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make your course visible on the /discover page and
              accessible to all users. Make sure your course content is ready
              before publishing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingCourse}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPublish}
              disabled={isUpdatingCourse}
            >
              {isUpdatingCourse ? "Publishing..." : "Publish Course"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the course from the Discover page and your
              dashboard. Enrolled students will still have access to the content.
              You cannot archive a course with active subscribers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
              {isArchiving ? "Archiving..." : "Archive Course"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course permanently?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>This action cannot be undone.</strong> This will
                permanently delete the course and all its lessons.
              </p>
              <p className="text-destructive font-medium">
                You cannot delete a course with active subscribers.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
