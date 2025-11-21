import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Subscription } from "@/types/course";

/**
 * Check if the current user has an active subscription to a specific course
 */
export const useSubscription = (courseId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription", courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;

      return data as Subscription | null;
    },
    enabled: !!user && !!courseId,
  });
};

/**
 * Get all active subscriptions for the current user
 */
export const useSubscriptions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscriptions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          course:courses(*)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("enrolled_at", { ascending: false });

      if (error) throw error;

      return data as (Subscription & { course: any })[];
    },
    enabled: !!user,
  });
};

/**
 * Cancel a subscription
 * This creates an Edge Function call to cancel the Stripe subscription
 */
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      if (!user) throw new Error("User not authenticated");

      // Get the subscription details
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .eq("user_id", user.id)
        .single();

      if (subError) throw subError;
      if (!subscription) throw new Error("Subscription not found");

      // Get session for authorization
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("No active session");

      // Call Edge Function to cancel in Stripe
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clever-function`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            stripeSubscriptionId: subscription.stripe_subscription_id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
};

/**
 * Reactivate a cancelled subscription
 * This creates an Edge Function call to undo the cancellation in Stripe
 */
export const useReactivateSubscription = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      if (!user) throw new Error("User not authenticated");

      // Get the subscription details
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .eq("user_id", user.id)
        .single();

      if (subError) throw subError;
      if (!subscription) throw new Error("Subscription not found");

      // Get session for authorization
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("No active session");

      // Call Edge Function to reactivate in Stripe
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reactivate-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            subscriptionId: subscription.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reactivate subscription");
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
};
