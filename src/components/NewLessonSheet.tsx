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
import { useCreateLesson } from "@/hooks/useLessons";
import { toast } from "sonner";
import type { Lesson } from "@/types/course";

interface NewLessonSheetProps {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingLessons: Lesson[] | undefined;
  onLessonCreated?: (lesson: Lesson) => void;
}

export default function NewLessonSheet({
  courseId,
  open,
  onOpenChange,
  existingLessons,
  onLessonCreated,
}: NewLessonSheetProps) {
  const [title, setTitle] = useState("");

  const { mutate: createLesson, isPending } = useCreateLesson(courseId);

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setTitle("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a lesson title");
      return;
    }

    // Calculate the next order number
    const nextOrder = existingLessons ? existingLessons.length + 1 : 1;

    createLesson(
      {
        title: title.trim(),
        content: [], // Empty content initially
        order: nextOrder,
      },
      {
        onSuccess: (newLesson) => {
          toast.success("Lesson created successfully!");
          onOpenChange(false);
          if (onLessonCreated) {
            onLessonCreated(newLesson);
          }
        },
        onError: (error) => {
          toast.error(`Failed to create lesson: ${error.message}`);
        },
      }
    );
  };

  const handleCancel = () => {
    if (title.trim() && confirm("Discard new lesson?")) {
      onOpenChange(false);
    } else if (!title.trim()) {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Lesson</SheetTitle>
          <SheetDescription>
            Create a new lesson for this course. You can edit the content after creation.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6 px-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Lesson Title</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lesson title"
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Lesson #{existingLessons ? existingLessons.length + 1 : 1}
            </p>
          </div>

          <SheetFooter className="flex flex-row justify-between gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="cursor-pointer">
              {isPending ? "Creating..." : "Create Lesson"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
