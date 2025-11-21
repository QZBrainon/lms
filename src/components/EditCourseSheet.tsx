import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateCourse } from "@/hooks/useCourses";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { centsToDollars } from "@/lib/priceUtils";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Course } from "@/types/course";

interface EditCourseSheetProps {
  course: Course;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditCourseSheet({
  course,
  open,
  onOpenChange,
}: EditCourseSheetProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [price, setPrice] = useState(centsToDollars(course.price).toString());

  // File upload state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(
    course.thumbnail_url
  );
  const [isUploading, setIsUploading] = useState(false);

  const { mutate: updateCourse, isPending } = useUpdateCourse(course.id);

  // Reset form when course changes or sheet opens
  useEffect(() => {
    if (open) {
      setTitle(course.title);
      setDescription(course.description);
      setPrice(centsToDollars(course.price).toString());
      setThumbnailFile(null);
      setThumbnailPreview(course.thumbnail_url);
    }
  }, [course, open]);

  // Handle file selection and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setThumbnailFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Extract file path from Supabase public URL
  const extractFilePathFromUrl = (url: string): string | null => {
    try {
      // Supabase public URL format: https://{project}.supabase.co/storage/v1/object/public/course-thumbnails/{path}
      const match = url.match(/\/course-thumbnails\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  // Delete old thumbnail from storage
  const deleteOldThumbnail = async (oldUrl: string): Promise<void> => {
    const filePath = extractFilePathFromUrl(oldUrl);

    if (!filePath) {
      console.warn("Could not extract file path from URL:", oldUrl);
      return;
    }

    try {
      const { error } = await supabase.storage
        .from("course-thumbnails")
        .remove([filePath]);

      if (error) {
        console.error("Error deleting old thumbnail:", error);
        // Don't throw - we still want to continue with the update
      } else {
        console.log("Successfully deleted old thumbnail:", filePath);
      }
    } catch (error) {
      console.error("Error deleting old thumbnail:", error);
      // Don't throw - we still want to continue with the update
    }
  };

  // Upload new thumbnail to Supabase Storage
  const uploadThumbnail = async (): Promise<string> => {
    if (!thumbnailFile || !user) {
      throw new Error("No file or user");
    }

    setIsUploading(true);

    try {
      // Generate unique filename to prevent collisions
      const fileExt = thumbnailFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("course-thumbnails")
        .upload(fileName, thumbnailFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        throw error;
      }

      // Get public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from("course-thumbnails").getPublicUrl(data.path);

      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    let toastId: string | number | undefined;

    try {
      let newThumbnailUrl = course.thumbnail_url;

      // If user selected a new image, upload it and delete the old one
      if (thumbnailFile) {
        toastId = toast.loading("Uploading new thumbnail...");

        // Upload new thumbnail
        newThumbnailUrl = await uploadThumbnail();

        // Dismiss the loading toast
        toast.dismiss(toastId);

        // Delete old thumbnail (don't await - fire and forget)
        if (course.thumbnail_url && course.thumbnail_url !== newThumbnailUrl) {
          deleteOldThumbnail(course.thumbnail_url).catch((err) =>
            console.error("Failed to delete old thumbnail:", err)
          );
        }
      }

      // Update course with new data
      updateCourse(
        {
          title,
          description,
          price: priceValue,
          thumbnail_url: newThumbnailUrl,
        },
        {
          onSuccess: () => {
            toast.success("Course updated successfully!");
            onOpenChange(false);
          },
          onError: (error) => {
            toast.error(`Failed to update course: ${error.message}`);
          },
        }
      );
    } catch (error) {
      // Dismiss loading toast if it exists
      if (toastId) {
        toast.dismiss(toastId);
      }
      console.error("Error updating course:", error);
      toast.error("Failed to upload thumbnail. Please try again.");
    }
  };

  const handleCancel = () => {
    // Check if form is dirty
    const isDirty =
      title !== course.title ||
      description !== course.description ||
      price !== centsToDollars(course.price).toString() ||
      thumbnailFile !== null;

    if (isDirty) {
      if (confirm("Discard changes?")) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Course</SheetTitle>
          <SheetDescription>
            Update your course information. Changes will be saved immediately.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6 px-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter course title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter course description"
              rows={5}
              required
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Course Banner</Label>

            {/* Preview */}
            {thumbnailPreview && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                <img
                  src={thumbnailPreview}
                  alt="Course banner preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "";
                    e.currentTarget.alt = "Invalid image";
                  }}
                />
              </div>
            )}

            {/* Upload button */}
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById("thumbnail-file")?.click()
                }
                disabled={isUploading || isPending}
                className="cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                {thumbnailFile ? "Change Image" : "Upload New Image"}
              </Button>
              {thumbnailFile && (
                <span className="text-sm text-muted-foreground truncate">
                  {thumbnailFile.name}
                </span>
              )}
            </div>

            <Input
              id="thumbnail-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 16:9 ratio, max 10MB (JPG, PNG, or WebP)
            </p>
          </div>

          <SheetFooter className="flex flex-row justify-between gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending || isUploading}
              className="cursor-pointer flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || isUploading}
              className="cursor-pointer flex-1"
            >
              {isPending || isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
