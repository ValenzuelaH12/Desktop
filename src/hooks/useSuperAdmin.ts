import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Hotel, Incident, Profile } from '../types';

export const useSuperAdmin = () => {
  // 1. Fetch all hotels
  const { data: hotels = [], isLoading: hotelsLoading } = useQuery({
    queryKey: ['super-admin', 'hotels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hoteles').select('*').order('nombre');
      if (error) throw error;
      return data as Hotel[];
    }
  });

  // 2. Fetch all incidents (Aggregated)
  const { data: globalIncidents = [], isLoading: incidentsLoading } = useQuery({
    queryKey: ['super-admin', 'incidents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('incidencias').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Incident[];
    }
  });

  // 3. Fetch all staff (Aggregated)
  const { data: globalStaff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['super-admin', 'staff'],
    queryFn: async () => {
      const { data, error } = await supabase.from('perfiles').select('*').order('nombre');
      if (error) throw error;
      return data as Profile[];
    }
  });

  const isLoading = hotelsLoading || incidentsLoading || staffLoading;

  return {
    hotels,
    globalIncidents,
    globalStaff,
    isLoading
  };
};
