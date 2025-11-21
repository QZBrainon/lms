import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Edit, Plus } from "lucide-react";
import EditableLessonItem from "@/components/EditableLessonItem";
import type { Course, Lesson } from "@/types/course";

interface CourseSidebarProps {
  course: Course;
  lessons: Lesson[] | undefined;
  currentLessonId?: string;
  onLessonClick: (lessonId: string) => void;
  onEditClick: () => void;
  onNewLessonClick: () => void;
  onLessonTitleUpdate: (lessonId: string, newTitle: string) => void;
  canEdit: boolean;
}

export default function CourseSidebar({
  course,
  lessons,
  currentLessonId,
  onLessonClick,
  onEditClick,
  onNewLessonClick,
  onLessonTitleUpdate,
  canEdit,
}: CourseSidebarProps) {
  return (
    <aside className="w-80 bg-[#171717] border-r border-border flex flex-col">
      {/* Course Header */}
      <div className="p-6 flex items-start justify-between gap-2">
        <h2 className="text-xl font-semibold line-clamp-2 flex-1">
          {course.title}
        </h2>
        {canEdit && (
          <button
            onClick={onEditClick}
            className="text-muted-foreground py-1.5 hover:text-foreground transition-colors cursor-pointer shrink-0"
            aria-label="Edit course"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
      </div>

      <Separator />

      {/* New Lesson Button */}
      {canEdit && (
        <div className="p-4">
          <button
            onClick={onNewLessonClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Lesson
          </button>
        </div>
      )}

      {/* Lessons List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {!lessons || lessons.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No lessons yet
            </div>
          ) : (
            lessons.map((lesson, index) => (
              <EditableLessonItem
                key={lesson.id}
                lesson={lesson}
                index={index}
                isActive={currentLessonId === lesson.id}
                canEdit={canEdit}
                onClick={() => onLessonClick(lesson.id)}
                onTitleUpdate={onLessonTitleUpdate}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
