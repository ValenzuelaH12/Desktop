-- CORRECCIÓN DE POLÍTICAS RLS PARA SISTEMA PREVENTIVO (V8)
-- Habilita INSERT, UPDATE, DELETE para usuarios autorizados por hotel_id

-- 1. Limpiar políticas antiguas para evitar duplicados
DROP POLICY IF EXISTS "Users can view their hotel's preventive templates" ON preventivo_plantillas;
DROP POLICY IF EXISTS "Users can view their hotel's preventive assignments" ON preventivo_asignaciones;
DROP POLICY IF EXISTS "Users can view their hotel's preventive revisions" ON preventivo_revisiones;
DROP POLICY IF EXISTS "Users can view results of revisions from their hotel" ON preventivo_resultados;

-- 2. preventivo_plantillas: Acceso total por hotel_id
CREATE POLICY "Full access to preventive templates by hotel_id" ON preventivo_plantillas
  FOR ALL USING (hotel_id = (auth.jwt() ->> 'hotel_id')::UUID);

-- 3. preventivo_asignaciones: Acceso total por hotel_id
CREATE POLICY "Full access to preventive assignments by hotel_id" ON preventivo_asignaciones
  FOR ALL USING (hotel_id = (auth.jwt() ->> 'hotel_id')::UUID);

-- 4. preventivo_categorias: Acceso basado en la plantilla padre
CREATE POLICY "Full access to preventive categories by template parent" ON preventivo_categorias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM preventivo_plantillas p 
      WHERE p.id = plantilla_id 
      AND p.hotel_id = (auth.jwt() ->> 'hotel_id')::UUID
    )
  );

-- 5. preventivo_items: Acceso basado en la categoría y plantilla
CREATE POLICY "Full access to preventive items by category parent" ON preventivo_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM preventivo_categorias c
      JOIN preventivo_plantillas p ON c.plantilla_id = p.id
      WHERE c.id = categoria_id
      AND p.hotel_id = (auth.jwt() ->> 'hotel_id')::UUID
    )
  );

-- 6. preventivo_revisiones: Acceso total por hotel_id
CREATE POLICY "Full access to preventive revisions by hotel_id" ON preventivo_revisiones
  FOR ALL USING (hotel_id = (auth.jwt() ->> 'hotel_id')::UUID);

-- 7. preventivo_resultados: Acceso total por revisión padre
CREATE POLICY "Full access to preventive results by revision parent" ON preventivo_resultados
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM preventivo_revisiones r
      WHERE r.id = revision_id
      AND r.hotel_id = (auth.jwt() ->> 'hotel_id')::UUID
    )
  );
