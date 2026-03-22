import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import Stripe from "https://esm.sh/stripe@11.16.0?target=deno"
// Deployment trigger: STRIPE_READY

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    })
  }

  try {
    const { hotelId, plan: planIncoming, cycle: cycleIncoming } = await req.json()

    // Manejar tanto formato separado como combinado (p.ej. starter_monthly)
    let finalPlan = planIncoming
    let finalCycle = cycleIncoming

    if (planIncoming && planIncoming.includes('_') && !cycleIncoming) {
      const parts = planIncoming.split('_')
      finalPlan = parts[0]
      finalCycle = parts[1]
    }

    // 1. Obtener info del hotel
    const { data: hotel, error: hotelError } = await supabase
      .from('hoteles')
      .select('nombre, stripe_customer_id')
      .eq('id', hotelId)
      .single()

    if (hotelError) throw hotelError

    // 2. Mapear plan a Price ID de Stripe
    const piceMap: Record<string, string> = {
      'starter_monthly': 'price_1TDpAtKHOMjetV18uXxwnNsd',
      'starter_yearly': 'price_1TDpAtKHOMjetV18uXxwnNsd',
      'pro_monthly': 'price_1TDpBsKHOMjetV18aiL78eRx',
      'pro_yearly': 'price_1TDpBsKHOMjetV18aiL78eRx',
      'enterprise_monthly': 'price_1TDpCsKHOMjetV18iwnNsdeUDprice_1TDpCsKHOMjetV18ivHLmeUD
      'enterprise_yearly': 'price_1TDpCsKHOMjetV18iwnNsdeUD',
    }

    const priceId = priceMap[`${finalPlan}_${finalCycle}`]
    if (!priceId) throw new Error(`Plan o Ciclo no válido: ${finalPlan}_${finalCycle}`)

    // 3. Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: hotel.stripe_customer_id || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/billing?success=true`,
      cancel_url: `${req.headers.get('origin')}/billing?canceled=true`,
      metadata: {
        hotelId,
        plan: finalPlan,
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    const err = error as Error;
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
