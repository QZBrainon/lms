import type { Course } from "@/types/course";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Users, DollarSign } from "lucide-react";
import { centsToDollars } from "@/lib/priceUtils";

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group pt-0">
      <div className="aspect-video w-full overflow-hidden bg-muted">
        <img
          src={course.thumbnail_url}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pt-0"
          onError={(e) => {
            e.currentTarget.src = `https://placehold.co/600x400/1e293b/94a3b8?text=${encodeURIComponent(
              course.title
            )}`;
          }}
        />
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-2">{course.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {course.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{course.total_members} members</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold">
            <DollarSign className="h-4 w-4" />
            <span>{centsToDollars(course.price)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
