import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import Header from "@/components/Header";

export default function CheckoutCancel() {
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
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">Payment Cancelled</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-lg">
              Your payment was cancelled. No charges were made to your account.
            </p>

            <p className="text-muted-foreground">
              If you encountered any issues or have questions, please contact
              support.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {courseId && (
                <Button
                  size="lg"
                  onClick={() => navigate(`/courses/${courseId}`)}
                >
                  Try Again
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/discover")}
              >
                Browse Courses
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
