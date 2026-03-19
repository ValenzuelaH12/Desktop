import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Reading } from '../types';

export const useReadings = (hotelId: string | null) => {
  return useQuery<Reading[]>({
    queryKey: ['readings', hotelId],
    queryFn: async () => {
      let query = supabase.from('lecturas').select('*, contador:contador_id(nombre, tipo)').order('fecha', { ascending: false });
      if (hotelId) query = query.eq('hotel_id', hotelId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!hotelId,
  });
};

export const useReadingTrends = (hotelId: string | null) => {
  return useQuery<any>({
    queryKey: ['reading-trends', hotelId],
    queryFn: async () => {
      // 1. Obtener contadores del hotel
      let qCont = supabase.from('contadores').select('id, tipo, nombre');
      if (hotelId) qCont = qCont.eq('hotel_id', hotelId);
      const { data: allContadores, error: errorCont } = await qCont;
      if (errorCont) throw errorCont;
      
      if (!allContadores || allContadores.length === 0) return {};

      const trendData: Record<string, any[]> = {};
      
      // 2. Para cada contador, obtener lecturas recientes
      for (const c of allContadores) {
        const { data: readings } = await supabase
          .from('lecturas')
          .select('valor, fecha')
          .eq('contador_id', c.id)
          .eq('hotel_id', hotelId)
          .order('fecha', { ascending: false })
          .limit(10);
        
        if (readings && readings.length > 1) {
          const processed = readings.map((curr: any, idx: number) => {
            const prev = readings[idx + 1];
            return { fecha: curr.fecha, consumo: prev ? curr.valor - prev.valor : 0 };
          }).reverse();
          
          if (!trendData[c.tipo]) trendData[c.tipo] = [];
          trendData[c.tipo].push(...processed);
        }
      }
      return trendData;
    },
    enabled: !!hotelId,
  });
};
