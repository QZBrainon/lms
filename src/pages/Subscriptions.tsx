import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useSubscriptions,
  useCancelSubscription,
  useReactivateSubscription
} from "@/hooks/useSubscriptions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CreditCard, Calendar, AlertCircle, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import Header from "@/components/Header";

export default function Subscriptions() {
  const navigate = useNavigate();
  const { data: subscriptions, isLoading } = useSubscriptions();
  const { mutate: cancelSubscription, isPending: isCancelling } = useCancelSubscription();
  const { mutate: reactivateSubscription, isPending: isReactivating } = useReactivateSubscription();

  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"cancel" | "reactivate" | null>(null);

  const handleCancelClick = (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId);
    setActionType("cancel");
  };

  const handleReactivateClick = (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId);
    setActionType("reactivate");
  };

  const confirmAction = () => {
    if (!selectedSubscriptionId) return;

    if (actionType === "cancel") {
      cancelSubscription(selectedSubscriptionId, {
        onSuccess: () => {
          toast.success("Subscription cancelled. You'll keep access until the end of your billing period.");
          setSelectedSubscriptionId(null);
          setActionType(null);
        },
        onError: (error) => {
          toast.error(error.message);
          setSelectedSubscriptionId(null);
          setActionType(null);
        },
      });
    } else if (actionType === "reactivate") {
      reactivateSubscription(selectedSubscriptionId, {
        onSuccess: () => {
          toast.success("Subscription reactivated! Your billing will continue as normal.");
          setSelectedSubscriptionId(null);
          setActionType(null);
        },
        onError: (error) => {
          toast.error(error.message);
          setSelectedSubscriptionId(null);
          setActionType(null);
        },
      });
    }
  };

  const selectedSubscription = subscriptions?.find(
    (sub) => sub.id === selectedSubscriptionId
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Subscriptions</h1>
        <p className="text-muted-foreground">
          Manage your course subscriptions and billing
        </p>
      </div>

      {!subscriptions || subscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No active subscriptions</h2>
            <p className="text-muted-foreground mb-6 text-center">
              You don't have any active course subscriptions yet.
            </p>
            <Button onClick={() => navigate("/")}>Browse Courses</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {subscriptions.map((subscription) => {
            const isScheduledForCancellation = subscription.cancel_at_period_end;
            const isPastDue = subscription.status === "past_due";
            const endsAt = subscription.ends_at
              ? new Date(subscription.ends_at)
              : null;

            return (
              <Card key={subscription.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">
                        {subscription.course?.title || "Course"}
                      </CardTitle>
                      <CardDescription>
                        {subscription.course?.description || ""}
                      </CardDescription>
                    </div>
                    <div className="ml-4">
                      {isPastDue ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Payment Failed
                        </Badge>
                      ) : isScheduledForCancellation ? (
                        <Badge variant="outline" className="gap-1">
                          <XCircle className="w-3 h-3" />
                          Cancelling
                        </Badge>
                      ) : (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Subscription Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">
                          ${((subscription.course?.price || 0) / 100).toFixed(2)}/month
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {isScheduledForCancellation ? "Ends on:" : "Next billing:"}
                        </span>
                        <span className="font-medium">
                          {endsAt
                            ? endsAt.toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Status Messages */}
                    {isPastDue && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                        <p className="text-destructive font-medium mb-1">
                          Payment failed
                        </p>
                        <p className="text-muted-foreground">
                          Your payment method was declined. Please update your payment
                          information. Stripe will automatically retry, and you'll keep
                          access during the grace period.
                        </p>
                      </div>
                    )}

                    {isScheduledForCancellation && !isPastDue && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-sm">
                        <p className="text-orange-600 dark:text-orange-400 font-medium mb-1">
                          Subscription will be cancelled
                        </p>
                        <p className="text-muted-foreground">
                          You'll keep full access until{" "}
                          {endsAt?.toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          . After that, you'll no longer be billed and will lose access.
                        </p>
                      </div>
                    )}

                    {!isScheduledForCancellation && !isPastDue && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm">
                        <p className="text-green-600 dark:text-green-400 font-medium mb-1">
                          Active subscription
                        </p>
                        <p className="text-muted-foreground">
                          Your subscription will automatically renew on{" "}
                          {endsAt?.toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          .
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/courses/${subscription.course_id}`)}
                        className="cursor-pointer"
                      >
                        View Course
                      </Button>

                      {isScheduledForCancellation ? (
                        <Button
                          variant="default"
                          onClick={() => handleReactivateClick(subscription.id)}
                          disabled={isReactivating || isCancelling}
                          className="gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reactivate Subscription
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          onClick={() => handleCancelClick(subscription.id)}
                          disabled={isReactivating || isCancelling}
                          className="cursor-pointer"
                        >
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={actionType === "cancel" && !!selectedSubscriptionId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSubscriptionId(null);
            setActionType(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You'll keep access to{" "}
                <strong>{selectedSubscription?.course?.title}</strong> until{" "}
                <strong>
                  {selectedSubscription?.ends_at
                    ? new Date(selectedSubscription.ends_at).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : "the end of your billing period"}
                </strong>
                .
              </p>
              <p>
                After that date, you'll no longer be billed and will lose access to
                the course content.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep Subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "Cancelling..." : "Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Confirmation Dialog */}
      <AlertDialog
        open={actionType === "reactivate" && !!selectedSubscriptionId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSubscriptionId(null);
            setActionType(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate your subscription?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Your subscription to{" "}
                <strong>{selectedSubscription?.course?.title}</strong> will
                continue and you'll be billed automatically on{" "}
                <strong>
                  {selectedSubscription?.ends_at
                    ? new Date(selectedSubscription.ends_at).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : "your next billing date"}
                </strong>
                .
              </p>
              <p>You'll keep continuous access to all course content.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isReactivating}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isReactivating ? "Reactivating..." : "Reactivate Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
