import { GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function EmptyCourse() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <GraduationCap />
        </EmptyMedia>
        <EmptyTitle>No Courses Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any course yet. Get started by creating your
          first course.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button>Create Course</Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
