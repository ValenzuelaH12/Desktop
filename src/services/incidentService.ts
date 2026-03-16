import { supabase } from '../lib/supabase';
import { Incident, IncidentStatus } from '../types';

export const incidentService = {
  async getAll(hotelId?: string | null): Promise<Incident[]> {
    let query = supabase.from('incidencias').select('*').order('created_at', { ascending: false });
    if (hotelId) query = query.eq('hotel_id', hotelId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getActive(hotelId?: string | null): Promise<Incident[]> {
    let query = supabase.from('incidencias').select('*').in('status', ['pending', 'in-progress']).order('created_at', { ascending: false });
    if (hotelId) query = query.eq('hotel_id', hotelId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getResolvedToday(hotelId?: string | null): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    let query = supabase.from('incidencias').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('created_at', today);
    if (hotelId) query = query.eq('hotel_id', hotelId);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  async create(incident: Partial<Incident>, hotelId?: string | null): Promise<Incident> {
    const payload = hotelId ? { ...incident, hotel_id: hotelId } : incident;
    const { data, error } = await supabase
      .from('incidencias')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Incident>): Promise<Incident> {
    const { data, error } = await supabase
      .from('incidencias')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: IncidentStatus): Promise<Incident> {
    return this.update(id, { status });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('incidencias')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
