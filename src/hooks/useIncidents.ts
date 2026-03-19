import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentService } from '../services/incidentService';
import { dbService } from '../lib/db';
import { Incident } from '../types';

export const useIncidents = (hotelId: string | null) => {
  return useQuery<Incident[]>({
    queryKey: ['incidents', hotelId],
    queryFn: () => incidentService.getAll(hotelId),
    enabled: !!hotelId,
  });
};

export const useIncidentMutation = () => {
  const queryClient = useQueryClient();

  const createIncident = useMutation({
    mutationFn: (newIncident: Partial<Incident>) => 
      incidentService.create(newIncident),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', variables.hotel_id] });
    },
    onError: async (error: any, variables) => {
      // Si el error parece ser de conexión, guardamos en la cola
      if (error?.message === 'Failed to fetch' || !navigator.onLine) {
        await dbService.addToSyncQueue({
          table: 'incidencias',
          action: 'insert',
          data: variables,
          timestamp: Date.now()
        });
        console.log('[useIncidents] Mutación guardada en cola offline.');
      }
    }
  });

  const updateIncidentStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) =>
      incidentService.updateStatus(id, status as any),
    onSuccess: () => {
      // Intentamos invalidar todas las incidencias o ser más específicos
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: async (error: any, variables) => {
      if (error?.message === 'Failed to fetch' || !navigator.onLine) {
        await dbService.addToSyncQueue({
          table: 'incidencias',
          action: 'update',
          data: { id: variables.id, status: variables.status },
          timestamp: Date.now()
        });
      }
    }
  });

  return { createIncident, updateIncidentStatus };
};
