import { useState, useRef, useEffect } from "react";
import { Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/types/course";

interface EditableLessonItemProps {
  lesson: Lesson;
  index: number;
  isActive: boolean;
  canEdit: boolean;
  onClick: () => void;
  onTitleUpdate: (lessonId: string, newTitle: string) => void;
}

export default function EditableLessonItem({
  lesson,
  index,
  isActive,
  canEdit,
  onClick,
  onTitleUpdate,
}: EditableLessonItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(lesson.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditedTitle(lesson.title);
  };

  const handleSave = () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== lesson.title) {
      onTitleUpdate(lesson.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(lesson.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div
      className={cn(
        "w-full rounded-md transition-colors text-sm group relative",
        isActive
          ? "bg-accent text-accent-foreground font-medium border-l-2 border-primary"
          : "text-muted-foreground hover:bg-accent/50"
      )}
    >
      {isEditing ? (
        // Edit mode - matches view mode structure exactly
        <div className="flex items-start gap-3 px-4 py-3">
          <span className="text-xs mt-0.5 shrink-0">{index + 1}.</span>
          <input
            ref={inputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-b border-border px-0 py-0 text-sm focus:outline-none focus:border-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleSave}
              className="p-1 hover:bg-accent/50 rounded cursor-pointer transition-colors"
              aria-label="Save"
            >
              <Check className="w-3 h-3 text-green-500" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-accent/50 rounded cursor-pointer transition-colors"
              aria-label="Cancel"
            >
              <X className="w-3 h-3 text-red-500" />
            </button>
          </div>
        </div>
      ) : (
        // View mode
        <div
          onClick={onClick}
          className="w-full text-left px-4 py-3 cursor-pointer flex items-start gap-3"
        >
          <span className="text-xs mt-0.5 shrink-0">{index + 1}.</span>
          <span className="truncate flex-1">{lesson.title}</span>
          {canEdit && isActive && (
            <button
              onClick={handleStartEdit}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent/50 rounded cursor-pointer"
              aria-label="Edit lesson title"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
