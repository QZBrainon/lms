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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { stripeSubscriptionId } = await req.json()

    console.log('Cancelling subscription:', stripeSubscriptionId)

    if (!stripeSubscriptionId) {
      throw new Error('Missing stripeSubscriptionId')
    }

    // Cancel subscription at period end (user keeps access until billing cycle completes)
    const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    console.log('Subscription marked for cancellation:', subscription.id)
    console.log('Will cancel at:', new Date(subscription.current_period_end * 1000).toISOString())

    // Update database immediately (webhook will also update, but this gives instant UI feedback)
    const { error: dbError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', stripeSubscriptionId)

    if (dbError) {
      console.error('Error updating database:', dbError)
      // Don't throw - Stripe update succeeded, webhook will fix DB later
    } else {
      console.log('Database updated with cancellation status')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription will be cancelled at period end',
        cancelsAt: new Date(subscription.current_period_end * 1000).toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
