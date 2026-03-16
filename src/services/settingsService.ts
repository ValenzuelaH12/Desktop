import { supabase } from '../lib/supabase';
import { GlobalSettings, ActivityLogEvent } from '../types';

export const settingsService = {
  // Configuración General
  async getSettings(hotelId?: string | null): Promise<GlobalSettings | null> {
    let query = supabase.from('hotel_settings').select('value').eq('key', 'general_config');
    if (hotelId) query = query.eq('hotel_id', hotelId);
    
    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
      throw error;
    }
    
    return data?.value as GlobalSettings || null;
  },

  async updateSettings(settings: Partial<GlobalSettings>, userId: string, hotelId?: string | null): Promise<void> {
    // Current settings
    const currentSettings = await this.getSettings(hotelId) || {};
    const newSettings = { ...currentSettings, ...settings };

    const payload = {
      key: 'general_config',
      value: newSettings,
      updated_at: new Date().toISOString(),
      updated_by: userId
    };
    if (hotelId) {
      (payload as any).hotel_id = hotelId;
    }

    const { error } = await supabase
      .from('hotel_settings')
      .upsert(payload, { onConflict: 'key, hotel_id' });

    if (error) throw error;
    
    // Registrar auditoría
    await this.logActivity(userId, 'ACTUALIZAR_AJUSTES', { changes: settings });
  },

  // Auditoría (Activity Log)
  async logActivity(userId: string, action: string, details: any = {}, hotelId?: string | null): Promise<void> {
    const payload = {
      usuario_id: userId,
      accion: action,
      detalles: details
    };
    if (hotelId) {
      (payload as any).hotel_id = hotelId;
    }

    const { error } = await supabase
      .from('activity_log')
      .insert(payload);

    if (error) console.error('Error logging activity:', error);
  },

  async getActivityLogs(limit = 100, hotelId?: string | null): Promise<ActivityLogEvent[]> {
    let query = supabase
      .from('activity_log')
      .select(`*, perfiles:usuario_id (nombre, rol)`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (hotelId) query = query.eq('hotel_id', hotelId);
    
    const { data, error } = await query;

    if (error) throw error;
    return data as ActivityLogEvent[];
  }
};
