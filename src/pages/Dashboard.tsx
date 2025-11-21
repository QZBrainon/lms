// import { Button } from "@/components/ui/button";
// import { Link } from "react-router-dom";
import {
  Card,
  // CardContent,
  // CardDescription,
  // CardHeader,
  // CardTitle,
} from "@/components/ui/card";
import Header from "@/components/Header";
import { EmptyCourse } from "@/components/EmptyCourse";
import { useCourses } from "@/hooks/useCourses";
import CourseCard from "@/components/CourseCard";

function Dashboard() {
  const { data: courses } = useCourses();
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            View your courses, track your progress, and manage your learning
            journey
          </p>
        </div>

        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> */}
        {/* <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>
                Courses you're currently enrolled in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <Button asChild className="mt-4 cursor-pointer">
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
              <CardDescription>Your overall completion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0%</p>
              <div className="w-full bg-muted rounded-full h-2 mt-4">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: "0%" }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certificates</CardTitle>
              <CardDescription>Completed course certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <Button asChild variant="outline" className="mt-4 cursor-pointer">
                <Link to="/certificates">View All</Link>
              </Button>
            </CardContent>
          </Card>
        </div> */}
        {courses?.length === 0 ? (
          <Card className="mt-4">
            <EmptyCourse />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses?.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
