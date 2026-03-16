import { supabase } from '../lib/supabase';
import { GlobalSettings, ActivityLogEvent } from '../types';

export const settingsService = {
  // Configuración General
  async getSettings(): Promise<GlobalSettings | null> {
    const { data, error } = await supabase
      .from('hotel_settings')
      .select('value')
      .eq('key', 'general_config')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
      throw error;
    }
    
    return data?.value as GlobalSettings || null;
  },

  async updateSettings(settings: Partial<GlobalSettings>, userId: string): Promise<void> {
    // Current settings
    const currentSettings = await this.getSettings() || {};
    const newSettings = { ...currentSettings, ...settings };

    const { error } = await supabase
      .from('hotel_settings')
      .upsert({
        key: 'general_config',
        value: newSettings,
        updated_at: new Date().toISOString(),
        updated_by: userId
      }, { onConflict: 'key' });

    if (error) throw error;
    
    // Registrar auditoría
    await this.logActivity(userId, 'ACTUALIZAR_AJUSTES', { changes: settings });
  },

  // Auditoría (Activity Log)
  async logActivity(userId: string, action: string, details: any = {}): Promise<void> {
    const { error } = await supabase
      .from('activity_log')
      .insert({
        usuario_id: userId,
        accion: action,
        detalles: details
      });

    if (error) console.error('Error logging activity:', error);
  },

  async getActivityLogs(limit = 100): Promise<ActivityLogEvent[]> {
    const { data, error } = await supabase
      .from('activity_log')
      .select(`
        *,
        perfiles:usuario_id (nombre, rol)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ActivityLogEvent[];
  }
};
