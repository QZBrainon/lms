import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client with the user's auth token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { subscriptionId } = await req.json()

    if (!subscriptionId) {
      throw new Error('Subscription ID is required')
    }

    console.log('Reactivating subscription:', { subscriptionId, userId: user.id })

    // Use service role to query the database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Verify the user owns this subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      console.error('Subscription not found or unauthorized:', subError)
      throw new Error('Subscription not found or you do not have access to it')
    }

    console.log('Subscription found:', {
      status: subscription.status,
      stripeId: subscription.stripe_subscription_id,
    })

    // Verify the subscription is eligible for reactivation
    // Must be active status (cancelled subscriptions are deleted by Stripe)
    if (subscription.status !== 'active') {
      throw new Error('Subscription cannot be reactivated. It may have already expired.')
    }

    // Get subscription details from Stripe to check cancel_at_period_end
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    )

    if (!stripeSubscription.cancel_at_period_end) {
      throw new Error('Subscription is not scheduled for cancellation')
    }

    console.log('Subscription is scheduled for cancellation, reactivating...')

    // Reactivate the subscription in Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      }
    )

    console.log('Subscription reactivated in Stripe:', updatedSubscription.id)

    // The webhook will handle updating the database when customer.subscription.updated fires
    // But we can also update it here for immediate UI feedback
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        ends_at: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: false,
      })
      .eq('id', subscriptionId)

    if (updateError) {
      console.error('Error updating subscription in database:', updateError)
      // Don't throw - Stripe update was successful, webhook will fix the DB
    } else {
      console.log('Subscription updated in database')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription reactivated successfully',
        ends_at: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
