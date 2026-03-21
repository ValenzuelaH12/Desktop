import { supabase } from '../lib/supabase';
import { 
  PreventiveTemplate, 
  PreventiveCategory, 
  PreventiveItem, 
  PreventiveAssignment, 
  PreventiveRevision, 
  PreventiveResult 
} from '../types';

export const preventivoService = {
  // --- GESTIÓN DE PLANTILLAS ---
  
  async getTemplates(hotelId: string): Promise<PreventiveTemplate[]> {
    const { data, error } = await supabase
      .from('preventivo_plantillas')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('nombre');
    if (error) throw error;
    return data || [];
  },

  async getTemplateDetail(templateId: string) {
    const { data, error } = await supabase
      .from('preventivo_plantillas')
      .select(`
        *,
        preventivo_categorias (
          *,
          preventivo_items (
            *
          )
        )
      `)
      .eq('id', templateId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createTemplate(template: Partial<PreventiveTemplate>, categories: any[]) {
    // 1. Crear plantilla
    const { data: newTemplate, error: tError } = await supabase
      .from('preventivo_plantillas')
      .insert([template])
      .select()
      .single();
    
    if (tError) throw tError;

    // 2. Crear categorías e ítems secuencialmente (para mantener orden)
    for (const cat of categories) {
      const { data: newCat, error: cError } = await supabase
        .from('preventivo_categorias')
        .insert([{ 
          plantilla_id: newTemplate.id, 
          nombre: cat.nombre, 
          orden: cat.orden 
        }])
        .select()
        .single();
      
      if (cError) throw cError;

      if (cat.items && cat.items.length > 0) {
        const itemsToInsert = cat.items.map((item: any) => ({
          categoria_id: newCat.id,
          texto: item.texto,
          tipo_respuesta: item.tipo_respuesta,
          criticidad: item.criticidad,
          orden: item.orden
        }));

        const { error: iError } = await supabase
          .from('preventivo_items')
          .insert(itemsToInsert);
        
        if (iError) throw iError;
      }
    }

    return newTemplate;
  },

  // --- EJECUCIÓN DE REVISIONES ---

  async startRevision(revisionId: string, userId: string) {
    const { error } = await supabase
      .from('preventivo_revisiones')
      .update({ 
        estado: 'en_proceso',
        ejecutado_por: userId 
      })
      .eq('id', revisionId);
    
    if (error) throw error;
  },

  async submitResults(revisionId: string, results: Partial<PreventiveResult>[]) {
    // 1. Insertar resultados detalle
    const { error: rError } = await supabase
      .from('preventivo_resultados')
      .insert(results.map(r => ({ ...r, revision_id: revisionId })));
    
    if (rError) throw rError;

    // 2. Determinar si hay algún fallo (NOK)
    const hasFailures = results.some(r => r.valor === 'nok' || r.valor === 'no');

    // 3. Finalizar la revisión
    const { error: revError } = await supabase
      .from('preventivo_revisiones')
      .update({ 
        estado: hasFailures ? 'fallida' : 'completada',
        completado_el: new Date().toISOString()
      })
      .eq('id', revisionId);
    
    if (revError) throw revError;

    return { hasFailures };
  },

  // --- ASIGNACIONES ---

  async saveAssignments(templateId: string, hotelId: string, assignments: Partial<PreventiveAssignment>[]) {
    // 1. Limpiar asignaciones previas
    await supabase
      .from('preventivo_asignaciones')
      .delete()
      .eq('plantilla_id', templateId);

    // 2. Insertar nuevas
    const { error } = await supabase
      .from('preventivo_asignaciones')
      .insert(assignments.map(a => ({ ...a, plantilla_id: templateId, hotel_id: hotelId })));
    
    if (error) throw error;
  },

  // --- MOTOR DE GENERACIÓN (AUTOMATIZACIÓN) ---
  
  _isReconciling: false,

  async reconcileRevisions(hotelId: string) {
    if ((this as any)._isReconciling) return;
    (this as any)._isReconciling = true;

    try {
      // 1. Obtener todas las plantillas y sus asignaciones
      const { data: templates, error: tError } = await supabase
        .from('preventivo_plantillas')
        .select('*, preventivo_asignaciones(*)')
        .eq('hotel_id', hotelId);
      
      if (tError) throw tError;

      // 2. Obtener TODAS las revisiones de HOY para este hotel
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      const { data: allRevisions, error: rError } = await supabase
        .from('preventivo_revisiones')
        .select('plantilla_id, entidad_id, created_at')
        .eq('hotel_id', hotelId);
      
      if (rError) throw rError;

      // Sets para búsqueda rápida
      const existingTodaySet = new Set();
      const existingHistorySet = new Set();

      (allRevisions || []).forEach(r => {
        const key = `${r.plantilla_id}-${r.entidad_id}`;
        existingHistorySet.add(key);
        if (r.created_at >= todayISO) {
          existingTodaySet.add(key);
        }
      });

      const now = new Date();
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
      const dayOfMonth = now.getDate();
      const month = now.getMonth();

      const revisionsToInsert: any[] = [];

      for (const template of (templates || [])) {
        if (template.frecuencia === 'checkout' || template.frecuencia === 'evento') continue;

        let isCronDue = false;
        if (template.frecuencia === 'diaria') isCronDue = true;
        else if (template.frecuencia === 'semanal' && dayOfWeek === 1) isCronDue = true;
        else if (template.frecuencia === 'mensual' && dayOfMonth === 1) isCronDue = true;
        else if (template.frecuencia === 'trimestral' && dayOfMonth === 1 && (month % 3 === 0)) isCronDue = true;
        else if (template.frecuencia === 'anual' && dayOfMonth === 1 && month === 0) isCronDue = true;

        const asigs = template.preventivo_asignaciones || [];

        for (const asig of asigs) {
          const key = `${template.id}-${asig.entidad_id}`;
          
          // Si ya existe hoy, saltar siempre
          if (existingTodaySet.has(key)) continue;

          // Generar si toca por cron O si es una asignación virgen (sin ninguna revisión previa)
          const isNewAssignment = !existingHistorySet.has(key);

          if (isCronDue || isNewAssignment) {
            let ubicacionNombre = 'Ubicación';
            if (asig.entidad_tipo === 'habitacion') {
              const { data } = await supabase.from('habitaciones').select('nombre').eq('id', asig.entidad_id).single();
              ubicacionNombre = data?.nombre || 'Hab';
            } else if (asig.entidad_tipo === 'zona') {
              const { data } = await supabase.from('zonas').select('nombre').eq('id', asig.entidad_id).single();
              ubicacionNombre = data?.nombre || 'Zona';
            } else if (asig.entidad_tipo === 'activo') {
              const { data } = await supabase.from('activos').select('nombre').eq('id', asig.entidad_id).single();
              ubicacionNombre = data?.nombre || 'Activo';
            }

            revisionsToInsert.push({
              hotel_id: hotelId,
              plantilla_id: template.id,
              entidad_tipo: asig.entidad_tipo,
              entidad_id: asig.entidad_id,
              ubicacion_nombre: ubicacionNombre,
              estado: 'pendiente'
            });

            // IMPORTANTE: Registrar que ya hemos planificado esta revisión para hoy
            // para evitar duplicados si hay asignaciones redundantes en la misma plantilla
            existingTodaySet.add(key);
          }
        }
      }

      if (revisionsToInsert.length > 0) {
        const { error: insError } = await supabase
          .from('preventivo_revisiones')
          .insert(revisionsToInsert);
        if (insError) throw insError;
      }

    } catch (err) {
      console.error('CRITICAL: Error in reconcileRevisions:', err);
    } finally {
      (this as any)._isReconciling = false;
    }
  },

  async getPendingRevisions(hotelId: string): Promise<PreventiveRevision[]> {
    const { data, error } = await supabase
      .from('preventivo_revisiones')
      .select(`
        *,
        plantilla:plantilla_id (
          nombre,
          frecuencia
        )
      `)
      .eq('hotel_id', hotelId)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getRecentRevisions(hotelId: string): Promise<PreventiveRevision[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('preventivo_revisiones')
      .select(`
        *,
        plantilla:plantilla_id (
          nombre,
          frecuencia
        )
      `)
      .eq('hotel_id', hotelId)
      .neq('estado', 'pendiente')
      .gte('created_at', todayStart.toISOString())
      .order('completado_el', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getAllCompletedRevisions(hotelId: string): Promise<PreventiveRevision[]> {
    const { data, error } = await supabase
      .from('preventivo_revisiones')
      .select(`
        *,
        plantilla:plantilla_id (
          nombre,
          frecuencia
        ),
        ejecutor:ejecutado_por (
          nombre
        )
      `)
      .eq('hotel_id', hotelId)
      .neq('estado', 'pendiente')
      .order('completado_el', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getGroupedHistory(hotelId: string) {
    const revisions = await this.getAllCompletedRevisions(hotelId);
    const groups: Record<string, any> = {};

    revisions.forEach(rev => {
      // Usar la fecha local de creacion para agrupar (identidad del ciclo)
      const dateKey = new Date(rev.created_at).toLocaleDateString();
      const planKey = rev.plantilla_id;
      const groupKey = `${planKey}_${dateKey}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          plantilla_id: rev.plantilla_id,
          plantilla_nombre: rev.plantilla?.nombre || 'Plan Eliminado',
          fecha_ciclo: rev.created_at,
          ultima_fecha_completado: rev.completado_el,
          total_tareas: 0,
          tareas_ok: 0,
          tareas_fallidas: 0,
          revision_ids: [],
          ejecutores: new Set()
        };
      }

      const group = groups[groupKey];
      group.total_tareas++;
      if (rev.estado === 'fallida') group.tareas_fallidas++;
      else group.tareas_ok++;
      
      group.revision_ids.push(rev.id);
      if (rev.ejecutor?.nombre) group.ejecutores.add(rev.ejecutor.nombre);
      
      if (new Date(rev.completado_el) > new Date(group.ultima_fecha_completado)) {
        group.ultima_fecha_completado = rev.completado_el;
      }
    });

    return Object.values(groups).sort((a, b) => 
      new Date(b.ultima_fecha_completado).getTime() - new Date(a.ultima_fecha_completado).getTime()
    );
  },

  async getRevisionBulkFullDetail(revisionIds: string[]) {
    if (!revisionIds || revisionIds.length === 0) return [];
    
    const { data: revisions, error } = await supabase
      .from('preventivo_revisiones')
      .select(`
        *,
        plantilla:plantilla_id (
          nombre,
          frecuencia,
          preventivo_categorias (
            *,
            preventivo_items (
              *
            )
          )
        ),
        resultados:preventivo_resultados (
          *
        ),
        ejecutor:ejecutado_por (
          nombre
        )
      `)
      .in('id', revisionIds);
    
    if (error) throw error;
    return revisions;
  },


  async getRevisionFullDetail(revisionId: string) {
    const { data: revision, error: rError } = await supabase
      .from('preventivo_revisiones')
      .select(`
        *,
        plantilla:plantilla_id (
          nombre,
          frecuencia,
          preventivo_categorias (
            *,
            preventivo_items (
              *
            )
          )
        ),
        resultados:preventivo_resultados (
          *
        ),
        ejecutor:ejecutado_por (
          nombre
        )
      `)
      .eq('id', revisionId)
      .single();
    
    if (rError) throw rError;
    return revision;
  },

  async deleteTemplate(templateId: string) {
    const { error } = await supabase
      .from('preventivo_plantillas')
      .delete()
      .eq('id', templateId);
    
    if (error) throw error;
  },

  async updateTemplate(templateId: string, template: Partial<PreventiveTemplate>, categories: any[]) {
    const { error: tError } = await supabase
      .from('preventivo_plantillas')
      .update(template)
      .eq('id', templateId);
    
    if (tError) throw tError;

    const { error: dError } = await supabase
      .from('preventivo_categorias')
      .delete()
      .eq('plantilla_id', templateId);
    
    if (dError) throw dError;

    for (const cat of categories) {
      const { data: newCat, error: cError } = await supabase
        .from('preventivo_categorias')
        .insert([{ 
          plantilla_id: templateId, 
          nombre: cat.nombre, 
          orden: cat.orden 
        }])
        .select()
        .single();
      
      if (cError) throw cError;

      if (cat.items && cat.items.length > 0) {
        const itemsToInsert = cat.items.map((item: any) => ({
          categoria_id: newCat.id,
          texto: item.texto,
          tipo_respuesta: item.tipo_respuesta,
          criticidad: item.criticidad,
          orden: item.orden
        }));

        const { error: iError } = await supabase
          .from('preventivo_items')
          .insert(itemsToInsert);
        
        if (iError) throw iError;
      }
    }
  },
};
