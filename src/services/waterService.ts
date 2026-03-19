import { supabase } from '../lib/supabase';
import { db } from '../lib/db';

export interface WaterControlRecord {
  id?: string;
  hotel_id: string;
  fecha: string;
  registrado_por?: string;
  punto_muestreo: string;
  cloro_libre?: number;
  cloro_total?: number;
  ph?: number;
  turbidez?: number;
  temperatura?: number;
  bromo?: number;
  acido_isocianurico?: number;
  notas?: string;
  created_at?: string;
  is_offline?: boolean; // Flag para UI
}

export const waterService = {
  async getAll(hotelId: string) {
    // Intentar obtener de Supabase
    try {
      let query = supabase
        .from('controles_agua')
        .select(`
          *,
          registrador:perfiles!registrado_por(nombre)
        `)
        .order('fecha', { ascending: false });

      if (hotelId && hotelId !== '00000000-0000-0000-0000-000000000000') {
        query = query.eq('hotel_id', hotelId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Cachear localmente para consulta offline rápida
      if (data) {
        await db.offline_cache.bulkPut(data.map(d => ({
          id: d.id,
          table: 'controles_agua',
          data: d,
          hotel_id: hotelId,
          timestamp: new Date().toISOString()
        })));
      }

      return data;
    } catch (err) {
      console.warn('Offline: Cargando desde caché local');
      const cached = await db.offline_cache
        .where('table').equals('controles_agua')
        .and(item => item.hotel_id === hotelId)
        .toArray();
      return cached.map(c => ({ ...c.data, is_offline: true }));
    }
  },

  async create(record: WaterControlRecord) {
    // Si estamos offline, encolar en Dexie
    if (!navigator.onLine) {
      console.log('📶 App Offline: Guardando en cola local');
      await db.offline_mutations.add({
        action: 'insert',
        table: 'controles_agua',
        data: record,
        hotel_id: record.hotel_id,
        timestamp: new Date().toISOString()
      });
      return { ...record, is_offline: true };
    }

    // Si estamos online, intentar Supabase
    const { data, error } = await supabase
      .from('controles_agua')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async syncOfflineData() {
    if (!navigator.onLine) return;

    const pending = await db.offline_mutations
      .where('table').equals('controles_agua')
      .toArray();

    console.log(`🔄 Sincronizando ${pending.length} registros de agua...`);

    for (const mutation of pending) {
      try {
        const { error } = await supabase
          .from('controles_agua')
          .insert([mutation.data]);
        
        if (!error) {
          await db.offline_mutations.delete(mutation.id!);
        }
      } catch (err) {
        console.error('Error sincronizando:', err);
      }
    }
  },

  async delete(id: string) {
    if (!navigator.onLine) {
       // Opcional: manejar borrado offline si se desea
       alert('No se puede borrar registros en modo offline.');
       return false;
    }

    const { error } = await supabase
      .from('controles_agua')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
