import { supabase } from '../lib/supabase';

export interface SubscriptionInfo {
  plan: 'trial' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing';
  current_period_end: string | null;
}

export const paymentService = {
  /**
   * Obtiene la información de suscripción del hotel
   */
  async getSubscriptionInfo(hotelId: string): Promise<SubscriptionInfo> {
    const { data, error } = await supabase
      .from('hoteles')
      .select('plan, subscription_status, current_period_end')
      .eq('id', hotelId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }

    return data;
  },

  /**
   * Crea una sesión de pago en Stripe (Vía Supabase Edge Function)
   */
  async createCheckoutSession(hotelId: string, plan: string) {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { hotelId, plan }
      });

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // Para desarrollo/demo: Simular éxito si no hay función desplegada
      // return 'https://checkout.stripe.com/test_session_...';
      throw error;
    }
  },

  /**
   * Obtiene el historial de pagos del hotel
   */
  async getBillingHistory(hotelId: string) {
    const { data, error } = await supabase
      .from('suscripciones_log')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
