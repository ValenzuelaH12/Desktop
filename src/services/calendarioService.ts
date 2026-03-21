import { supabase } from '../lib/supabase';

export interface CalendarEvent {
  id: string;
  hotel_id: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  tipo: string;
  color: string;
  creado_por: string;
  created_at?: string;
}

export const calendarioService = {
  async getEvents(hotelId: string, monthStart: string, monthEnd: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendario_eventos')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('fecha', monthStart)
      .lte('fecha', monthEnd)
      .order('fecha', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createEvent(event: Omit<CalendarEvent, 'id' | 'created_at'>): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('calendario_eventos')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('calendario_eventos')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  }
};
