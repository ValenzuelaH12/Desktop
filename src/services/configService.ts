import { supabase } from '../lib/supabase';
import { Zone, Room, Asset, Counter, Profile } from '../types';

export const configService = {
  // Profiles
  async getUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .order('nombre');
    
    if (error) throw error;
    return data || [];
  },

  // Zones & Rooms
  async getZones(): Promise<Zone[]> {
    const { data, error } = await supabase
      .from('zonas')
      .select('*')
      .order('nombre');
    
    if (error) throw error;
    return data || [];
  },

  async getRooms(): Promise<Room[]> {
    const { data, error } = await supabase
      .from('habitaciones')
      .select('*')
      .order('nombre');
    
    if (error) throw error;
    return data || [];
  },

  // Assets
  async getAssets(): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('activos')
      .select('*')
      .order('nombre');
    
    if (error) throw error;
    return data || [];
  },

  // Counters
  async getCounters(): Promise<Counter[]> {
    const { data, error } = await supabase
      .from('contadores')
      .select('*')
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .order('nombre');
    
    if (error) throw error;
    return data || [];
  },

  // Generic Create/Update/Delete (can be expanded)
  async create(table: string, entry: any): Promise<any> {
    const { data, error } = await supabase
      .from(table)
      .insert([entry])
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
