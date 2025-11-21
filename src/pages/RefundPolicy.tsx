import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Mail, Shield, Clock } from "lucide-react";
import Header from "@/components/Header";

export default function RefundPolicy() {
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-4xl mx-auto py-16 px-4">
        <Card>
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-10 h-10 text-blue-500" />
            </div>
            <CardTitle className="text-3xl text-center">Refund Policy</CardTitle>
            <p className="text-center text-muted-foreground mt-2">
              We stand behind the quality of our courses
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* 30-Day Money-Back Guarantee */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <h2 className="text-2xl font-semibold">30-Day Money-Back Guarantee</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We offer a 30-day money-back guarantee on all course enrollments.
                If you're not satisfied with your course for any reason, you can request
                a full refund within 30 days of your initial enrollment.
              </p>
            </section>

            {/* Refund Eligibility */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <h2 className="text-2xl font-semibold">Refund Eligibility</h2>
              </div>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Refund requests must be made within 30 days of your initial enrollment</li>
                <li>Refunds are only available for the first enrollment in a course</li>
                <li>Subscription renewals are not eligible for refunds</li>
                <li>All refund requests are reviewed on a case-by-case basis</li>
              </ul>
            </section>

            {/* How to Request a Refund */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-purple-500" />
                </div>
                <h2 className="text-2xl font-semibold">How to Request a Refund</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To request a refund, please contact our support team with the following information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Your account email address</li>
                <li>The name of the course you enrolled in</li>
                <li>Your enrollment date</li>
                <li>A brief reason for the refund request (optional but helpful)</li>
              </ul>
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="text-sm font-medium">Contact Support:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Email: <a href="mailto:support@example.com" className="text-primary hover:underline">support@example.com</a>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  We typically respond within 1-2 business days.
                </p>
              </div>
            </section>

            {/* What Happens After Refund */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">What Happens After a Refund</h2>
              <p className="text-muted-foreground leading-relaxed">
                Once your refund request is approved:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Your course access will be revoked immediately</li>
                <li>Your subscription will be cancelled in Stripe</li>
                <li>The refund will be processed to your original payment method</li>
                <li>It may take 5-10 business days for the refund to appear in your account</li>
                <li>You'll receive a confirmation email once the refund is processed</li>
              </ul>
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg mt-4">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  Important Note:
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please note that Stripe processing fees (approximately 3% of the transaction)
                  are not refundable. This is a limitation of the payment processor, not our policy.
                </p>
              </div>
            </section>

            {/* Cancellation vs Refund */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">Cancellation vs Refund</h2>
              <p className="text-muted-foreground leading-relaxed">
                It's important to understand the difference between cancelling your subscription
                and requesting a refund:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Cancellation</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• No refund issued</li>
                    <li>• Keep access until period end</li>
                    <li>• No future charges</li>
                    <li>• Can be done anytime from dashboard</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Refund Request</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Full refund issued (minus fees)</li>
                    <li>• Access revoked immediately</li>
                    <li>• Must be within 30 days</li>
                    <li>• Requires contacting support</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/subscriptions")}
              >
                Manage Subscriptions
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/courses")}
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
