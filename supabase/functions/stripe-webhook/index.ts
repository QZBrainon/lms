import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'stripe-signature',
}

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )

    console.log('Webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object

        console.log('Processing subscription for:', {
          userId: session.metadata?.user_id,
          courseId: session.metadata?.course_id,
          subscriptionId: session.subscription,
        })

        // Fetch the subscription details from Stripe to get the current_period_end
        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        console.log('Stripe subscription details:', {
          id: stripeSubscription.id,
          current_period_end: stripeSubscription.current_period_end,
        })

        // Convert Unix timestamp to ISO string
        const endsAt = new Date(stripeSubscription.current_period_end * 1000).toISOString()

        // Check if subscription already exists (idempotency check)
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', session.subscription as string)
          .maybeSingle()

        if (existingSubscription) {
          console.log('Subscription already exists, skipping insert (idempotent)')
        } else {
          // Create subscription record
          const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: session.metadata?.user_id,
              course_id: session.metadata?.course_id,
              status: 'active',
              stripe_subscription_id: session.subscription as string,
              enrolled_at: new Date().toISOString(),
              ends_at: endsAt,
              billing_cycle: session.metadata?.billing_cycle || 'monthly',
            })

          if (insertError) {
            console.error('Error inserting subscription:', insertError)
            throw insertError
          }

          console.log('Subscription created successfully with end date:', endsAt)

          // Only increment course members if this is a new subscription
          const { error: rpcError } = await supabase.rpc('increment_course_members', {
            p_course_id: session.metadata?.course_id,
          })

          if (rpcError) {
            console.error('Error incrementing members:', rpcError)
          } else {
            console.log('Course members incremented')
          }

          // Clean up pending enrollment (atomic lock no longer needed)
          const { error: cleanupError } = await supabase
            .from('pending_enrollments')
            .delete()
            .eq('user_id', session.metadata?.user_id)
            .eq('course_id', session.metadata?.course_id)

          if (cleanupError) {
            console.error('Error cleaning up pending enrollment:', cleanupError)
          } else {
            console.log('Pending enrollment cleaned up successfully')
          }
        }

        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object

        console.log('Invoice paid:', invoice.id)
        console.log('Billing reason:', invoice.billing_reason)
        console.log('Subscription:', invoice.subscription)

        // Only handle subscription renewals (not initial payment)
        if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
          console.log('Processing subscription renewal')

          // Fetch updated subscription from Stripe to get new period end
          const stripeSubscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )

          const newEndsAt = new Date(
            stripeSubscription.current_period_end * 1000
          ).toISOString()

          console.log('New period end:', newEndsAt)

          // Update subscription with new end date and ensure status is active
          const { error } = await supabase
            .from('subscriptions')
            .update({
              ends_at: newEndsAt,
              status: 'active', // Ensure status is active after successful renewal
            })
            .eq('stripe_subscription_id', invoice.subscription as string)

          if (error) {
            console.error('Error updating subscription renewal:', error)
          } else {
            console.log('Subscription renewed successfully until:', newEndsAt)
          }
        } else {
          console.log('Not a subscription renewal, skipping')
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object

        console.log('Invoice payment failed:', invoice.id)
        console.log('Subscription:', invoice.subscription)

        // Update subscription status to indicate payment issue
        if (invoice.subscription) {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'past_due', // Indicate payment failed but still in grace period
            })
            .eq('stripe_subscription_id', invoice.subscription as string)

          if (error) {
            console.error('Error updating subscription status to past_due:', error)
          } else {
            console.log('Subscription marked as past_due due to payment failure')
            // TODO: Send email notification to user about payment failure
          }
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object

        console.log('Subscription updated:', subscription.id)
        console.log('Status:', subscription.status)
        console.log('Cancel at period end:', subscription.cancel_at_period_end)

        // Handle cancellation
        if (subscription.cancel_at_period_end) {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: true,
            })
            .eq('stripe_subscription_id', subscription.id)

          if (error) {
            console.error('Error updating subscription:', error)
          } else {
            console.log('Subscription marked for cancellation at period end')
          }
        }

        // Handle status changes (e.g., reactivation after past_due)
        if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: false,
            })
            .eq('stripe_subscription_id', subscription.id)

          if (error) {
            console.error('Error reactivating subscription:', error)
          } else {
            console.log('Subscription reactivated/updated to active status')
          }
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object

        console.log('Subscription deleted:', subscription.id)

        // Get the course_id before updating the subscription
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('course_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        // Mark subscription as cancelled (this happens when subscription actually expires)
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error cancelling subscription:', error)
        } else {
          console.log('Subscription cancelled successfully')

          // Decrement course members count
          if (subscriptionData?.course_id) {
            const { error: rpcError } = await supabase.rpc('decrement_course_members', {
              p_course_id: subscriptionData.course_id,
            })

            if (rpcError) {
              console.error('Error decrementing members:', rpcError)
            } else {
              console.log('Course members decremented')
            }
          }
        }

        break
      }

      case 'charge.refunded': {
        const charge = event.data.object

        console.log('Charge refunded:', charge.id)
        console.log('Amount refunded:', charge.amount_refunded)
        console.log('Payment intent:', charge.payment_intent)

        // Find the subscription associated with this charge
        // Charges are linked to invoices, which are linked to subscriptions
        if (charge.invoice) {
          try {
            const invoice = await stripe.invoices.retrieve(charge.invoice as string)

            if (invoice.subscription) {
              console.log('Found subscription for refund:', invoice.subscription)

              // Cancel the subscription in Stripe (access ends immediately on refund)
              try {
                await stripe.subscriptions.cancel(invoice.subscription as string)
                console.log('Cancelled Stripe subscription due to refund')
              } catch (cancelError) {
                console.error('Error cancelling Stripe subscription:', cancelError)
                // Continue to update database even if Stripe cancel fails
              }

              // Get the course_id before updating
              const { data: subscriptionData } = await supabase
                .from('subscriptions')
                .select('course_id')
                .eq('stripe_subscription_id', invoice.subscription as string)
                .single()

              // Update database: mark as cancelled and revoke access
              const { error } = await supabase
                .from('subscriptions')
                .update({
                  status: 'cancelled',
                  ends_at: new Date().toISOString(), // Access ends immediately
                })
                .eq('stripe_subscription_id', invoice.subscription as string)

              if (error) {
                console.error('Error updating subscription after refund:', error)
              } else {
                console.log('Subscription cancelled and access revoked due to refund')

                // Decrement course members count
                if (subscriptionData?.course_id) {
                  const { error: rpcError } = await supabase.rpc('decrement_course_members', {
                    p_course_id: subscriptionData.course_id,
                  })

                  if (rpcError) {
                    console.error('Error decrementing members:', rpcError)
                  } else {
                    console.log('Course members decremented after refund')
                  }
                }

                // TODO: Send email notification about refund processed
              }
            } else {
              console.log('No subscription found on invoice (one-time payment?)')
            }
          } catch (invoiceError) {
            console.error('Error retrieving invoice:', invoiceError)
          }
        } else {
          console.log('Charge has no associated invoice')
        }

        break
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object

        console.log('Dispute created:', dispute.id)
        console.log('Dispute reason:', dispute.reason)
        console.log('Dispute amount:', dispute.amount)
        console.log('Charge ID:', dispute.charge)

        // Find the subscription associated with the disputed charge
        try {
          const charge = await stripe.charges.retrieve(dispute.charge as string)

          if (charge.invoice) {
            const invoice = await stripe.invoices.retrieve(charge.invoice as string)

            if (invoice.subscription) {
              console.log('Found subscription for dispute:', invoice.subscription)

              // Get the course_id before updating
              const { data: subscriptionData } = await supabase
                .from('subscriptions')
                .select('course_id')
                .eq('stripe_subscription_id', invoice.subscription as string)
                .single()

              // Update database: mark as disputed and suspend access immediately
              const { error } = await supabase
                .from('subscriptions')
                .update({
                  status: 'disputed',
                  ends_at: new Date().toISOString(), // Suspend access immediately
                })
                .eq('stripe_subscription_id', invoice.subscription as string)

              if (error) {
                console.error('Error updating subscription after dispute:', error)
              } else {
                console.log('Subscription marked as disputed, access suspended')

                // Decrement course members count
                if (subscriptionData?.course_id) {
                  const { error: rpcError } = await supabase.rpc('decrement_course_members', {
                    p_course_id: subscriptionData.course_id,
                  })

                  if (rpcError) {
                    console.error('Error decrementing members:', rpcError)
                  } else {
                    console.log('Course members decremented after dispute')
                  }
                }

                // TODO: Alert admin about dispute (email/Slack notification)
                // TODO: Gather evidence to respond to dispute in Stripe Dashboard
              }

              // Cancel the subscription in Stripe to prevent further charges
              try {
                await stripe.subscriptions.cancel(invoice.subscription as string)
                console.log('Cancelled Stripe subscription due to dispute')
              } catch (cancelError) {
                console.error('Error cancelling Stripe subscription:', cancelError)
              }
            } else {
              console.log('No subscription found on invoice (one-time payment?)')
            }
          } else {
            console.log('Charge has no associated invoice')
          }
        } catch (chargeError) {
          console.error('Error retrieving charge for dispute:', chargeError)
        }

        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('Webhook error:', err.message)
    return new Response(`Webhook Error: ${err.message}`, {
      status: 400,
    })
  }
})
