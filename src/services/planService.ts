import { supabase } from '../lib/supabase'

export interface PlanConfig {
  id: string;
  nombre: string;
  precio_mensual: number;
  precio_anual: number;
  descripcion: string;
  icon: string;
  color: string;
  features: string[];
  destacado: boolean;
  orden: number;
}

export const planService = {
  async getPlanes(): Promise<PlanConfig[]> {
    const { data, error } = await supabase
      .from('configuracion_planes')
      .select('*')
      .order('orden', { ascending: true })

    if (error) throw error
    return data || []
  },

  async updatePlan(id: string, updates: Partial<PlanConfig>) {
    // Eliminar el id del payload de actualización para evitar errores de clave primaria
    const { id: _, ...updateData } = updates as any;
    
    const { data, error } = await supabase
      .from('configuracion_planes')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0]
  },

  async createPlan(plan: Omit<PlanConfig, 'updated_at' | 'created_at'>) {
    const { data, error } = await supabase
      .from('configuracion_planes')
      .insert(plan)
      .select()

    if (error) throw error
    return data?.[0]
  },

  async deletePlan(id: string) {
    const { error } = await supabase
      .from('configuracion_planes')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
