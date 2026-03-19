import { supabase } from '../lib/supabase';
import { Zone, Room, Asset, Counter, Profile, IncidentType } from '../types';

export const configService = {
  // Profiles
  async getUsers(hotelId?: string | null): Promise<Profile[]> {
    let query = supabase.from('perfiles').select('*').neq('id', '00000000-0000-0000-0000-000000000000').order('nombre');
    if (hotelId) query = query.eq('hotel_id', hotelId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Zones & Rooms
  async getZones(hotelId?: string | null): Promise<Zone[]> {
    let query = supabase.from('zonas').select('*').order('nombre');
    if (hotelId) query = query.eq('hotel_id', hotelId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getRooms(hotelId?: string | null): Promise<Room[]> {
    let query = supabase.from('habitaciones').select('*').order('nombre');
    if (hotelId) query = query.eq('hotel_id', hotelId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Assets
  async getAssets(hotelId?: string | null): Promise<Asset[]> {
    let query = supabase.from('activos').select('*').order('nombre');
    if (hotelId) query = query.eq('hotel_id', hotelId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Counters
  async getCounters(hotelId?: string | null): Promise<Counter[]> {
    let query = supabase.from('contadores').select('*').neq('id', '00000000-0000-0000-0000-000000000000').order('nombre');
    if (hotelId) query = query.eq('hotel_id', hotelId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Incident Types
  async getIncidentTypes(hotelId?: string | null): Promise<IncidentType[]> {
    let query = supabase.from('tipos_problemas').select('*').order('nombre');
    
    // Filtro: Globales (null) O del hotel específico
    if (hotelId) {
      query = query.or(`hotel_id.is.null,hotel_id.eq.${hotelId}`);
    } else {
      query = query.is('hotel_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createGlobalIncidentType(entry: Partial<IncidentType>): Promise<IncidentType> {
    const { data, error } = await supabase
      .from('tipos_problemas')
      .insert([{ ...entry, hotel_id: null }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Generic Create/Update/Delete (can be expanded)
  async create(table: string, entry: any, hotelId?: string | null): Promise<any> {
    const payload = hotelId ? { ...entry, hotel_id: hotelId } : entry;
    const { data, error } = await supabase
      .from(table)
      .insert([payload])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(table: string, id: string, entry: any): Promise<any> {
    const { data, error } = await supabase
      .from(table)
      .update(entry)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(table: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
