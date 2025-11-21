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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { courseId, userId } = await req.json()

    console.log('Creating checkout for:', { courseId, userId })

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      console.error('Course not found:', courseError)
      throw new Error('Course not found')
    }

    console.log('Course found:', course.title, 'Price:', course.price)

    // Check for ANY existing subscription (active or pending webhook)
    const { data: existingSubscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .in('status', ['active'])

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      console.log('User already has active subscription(s):', existingSubscriptions.length)

      // If multiple active subscriptions exist, cancel all but the oldest in Stripe
      if (existingSubscriptions.length > 1) {
        console.log('Multiple active subscriptions found, cleaning up duplicates in Stripe')
        const sortedSubs = existingSubscriptions.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        // Cancel all except the first (oldest) subscription in Stripe
        for (let i = 1; i < sortedSubs.length; i++) {
          try {
            await stripe.subscriptions.cancel(sortedSubs[i].stripe_subscription_id)
            console.log('Cancelled duplicate subscription:', sortedSubs[i].stripe_subscription_id)

            // Update status in database
            await supabase
              .from('subscriptions')
              .update({ status: 'cancelled' })
              .eq('id', sortedSubs[i].id)
          } catch (cancelError) {
            console.error('Error cancelling duplicate:', cancelError)
          }
        }
      }

      throw new Error('You already have an active subscription to this course')
    }

    // CRITICAL: Create atomic lock to prevent race condition
    // This prevents multiple simultaneous enrollment requests from creating duplicate subscriptions
    console.log('Creating pending enrollment lock...')
    const { error: pendingError } = await supabase
      .from('pending_enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
      })

    // If unique constraint violation (23505), enrollment already in progress
    if (pendingError) {
      console.error('Failed to create pending enrollment:', pendingError)

      if (pendingError.code === '23505') {
        throw new Error('Enrollment already in progress. Please wait a moment and try again.')
      }

      throw new Error('Failed to initiate enrollment. Please try again.')
    }

    console.log('Pending enrollment lock created successfully')

    // Create Stripe Checkout Session
    let session
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: course.title,
                description: course.description,
                images: course.thumbnail_url ? [course.thumbnail_url] : [],
              },
              unit_amount: course.price, // Price in cents
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${req.headers.get('origin')}/checkout/success?course_id=${courseId}`,
        cancel_url: `${req.headers.get('origin')}/checkout/cancel?course_id=${courseId}`,
        metadata: {
          user_id: userId,
          course_id: courseId,
          billing_cycle: 'monthly',
        },
      })

      console.log('Checkout session created:', session.id)
    } catch (stripeError) {
      // Clean up pending enrollment if Stripe fails
      console.error('Stripe checkout creation failed, cleaning up pending enrollment:', stripeError)
      await supabase
        .from('pending_enrollments')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId)

      throw stripeError
    }

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating checkout:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
