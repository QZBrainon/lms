import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Header from "@/components/Header";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get("course_id");

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-2xl mx-auto py-16 px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <CardTitle className="text-3xl">Enrollment Successful!</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-lg">
              You've successfully enrolled in this course. Your subscription is
              now active and you have full access to all course content.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {courseId && (
                <Button
                  size="lg"
                  onClick={() => navigate(`/courses/${courseId}`)}
                >
                  Go to Course
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                View Dashboard
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              You can manage your subscription from your dashboard at any time.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
