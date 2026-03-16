import { supabase } from '../lib/supabase';
import { InventoryItem } from '../types';

export const inventoryService = {
  async getAll(hotelId?: string | null): Promise<InventoryItem[]> {
    let query = supabase.from('inventario').select('*').order('nombre', { ascending: true });
    if (hotelId) query = query.eq('hotel_id', hotelId);
    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async updateStock(id: string, newStock: number, profileId: string): Promise<void> {
    const { error } = await supabase
      .from('inventario')
      .update({ 
        stock_actual: newStock,
        ultima_actualizacion: new Date().toISOString(),
        actualizado_por: profileId
      })
      .eq('id', id);

    if (error) throw error;
  },

  async create(item: Partial<InventoryItem>, profileId: string, hotelId?: string | null): Promise<InventoryItem> {
    const payload = {
      ...item,
      actualizado_por: profileId
    };
    if (hotelId) {
      (payload as any).hotel_id = hotelId;
    }

    const { data, error } = await supabase
      .from('inventario')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<InventoryItem>, profileId: string): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventario')
      .update({
        ...updates,
        actualizado_por: profileId,
        ultima_actualizacion: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventario')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
