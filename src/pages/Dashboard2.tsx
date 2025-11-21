import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  // CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/Header";
import { useCourses } from "@/hooks/useCourses";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import CourseCard from "@/components/CourseCard";
import { Plus, BookOpen, GraduationCap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

function Dashboard2() {
  const { data: allCourses } = useCourses();
  const { user } = useAuth();
  const { data: subscriptions } = useSubscriptions();

  // Filter courses created by the current user (exclude archived)
  const createdCourses = allCourses?.filter(
    (course) => course.owner_id === user?.id && !course.archived_at
  );

  // Get enrolled courses from active subscriptions
  const enrolledCourses = subscriptions?.map((sub) => sub.course) || [];

  // Calculate stats for created courses
  const totalRevenue = createdCourses?.reduce(
    (sum, course) => sum + course.price * course.total_members,
    0
  );
  const totalStudents = createdCourses?.reduce(
    (sum, course) => sum + course.total_members,
    0
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="container max-w-7xl mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your learning journey and created courses
          </p>
        </div>

        {/* Stats Overview - Only show if user has created courses */}
        {createdCourses && createdCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${((totalRevenue || 0) / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {createdCourses.length} course
                  {createdCourses.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Students
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all your courses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Courses Created
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {createdCourses.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Published and draft
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* My Created Courses Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">My Created Courses</h2>
              <p className="text-sm text-muted-foreground">
                Courses you've created and published
              </p>
            </div>
            <Button asChild>
              <Link to="/courses/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Link>
            </Button>
          </div>

          {!createdCourses || createdCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No courses created yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                  Share your knowledge by creating your first course
                </p>
                <Button asChild>
                  <Link to="/courses/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdCourses.map((course) => (
                <div key={course.id} className="relative">
                  <Link to={`/courses/${course.id}`}>
                    <CourseCard course={course} />
                    {course.status === "draft" && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Draft
                        </span>
                      </div>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Learning Section */}
        <section className="my-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">My Learning</h2>
              <p className="text-sm text-muted-foreground">
                Courses you're enrolled in
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/discover">Browse Courses</Link>
            </Button>
          </div>

          {enrolledCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No enrolled courses yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                  Start your learning journey by browsing our course catalog
                </p>
                <Button asChild>
                  <Link to="/discover">Explore Courses</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <Link key={course.id} to={`/courses/${course.id}`}>
                  <CourseCard course={course} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard2;
