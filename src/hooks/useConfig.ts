import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configService } from '../services/configService';
import { Zone, Room, Asset, IncidentType, Profile, Counter } from '../types';

export const useUsers = (hotelId: string | null) => {
  return useQuery<Profile[]>({
    queryKey: ['users', hotelId],
    queryFn: () => configService.getUsers(hotelId),
    enabled: !!hotelId,
  });
};

export const useZones = (hotelId: string | null) => {
  return useQuery<Zone[]>({
    queryKey: ['zones', hotelId],
    queryFn: () => configService.getZones(hotelId),
    enabled: !!hotelId,
  });
};

export const useRooms = (hotelId: string | null) => {
  return useQuery<Room[]>({
    queryKey: ['rooms', hotelId],
    queryFn: () => configService.getRooms(hotelId),
    enabled: !!hotelId,
  });
};

export const useAssets = (hotelId: string | null) => {
  return useQuery<Asset[]>({
    queryKey: ['assets', hotelId],
    queryFn: () => configService.getAssets(hotelId),
    enabled: !!hotelId,
  });
};

export const useIncidentTypes = (hotelId: string | null) => {
  return useQuery<IncidentType[]>({
    queryKey: ['incident-types', hotelId],
    queryFn: () => configService.getIncidentTypes(hotelId),
    enabled: !!hotelId,
  });
};

export const useCounters = (hotelId: string | null) => {
  return useQuery<Counter[]>({
    queryKey: ['counters', hotelId],
    queryFn: () => configService.getCounters(hotelId),
    enabled: !!hotelId,
  });
};

export const useConfigMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: ({ table, data, hotelId }: { table: string; data: any; hotelId: string | null }) => 
      configService.create(table, data, hotelId),
    onSuccess: (_, variables) => {
      // Invalida la caché relevante según la tabla modificada
      const map: Record<string, string> = {
        'zonas': 'zones',
        'habitaciones': 'rooms',
        'activos': 'assets',
        'tipos_problemas': 'incident-types',
        'perfiles': 'users'
      };
      const key = map[variables.table];
      if (key) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ table, id, data }: { table: string; id: string; data: any }) => 
      configService.update(table, id, data),
    onSuccess: (_, variables) => {
      const map: Record<string, string> = {
        'zonas': 'zones',
        'habitaciones': 'rooms',
        'activos': 'assets',
        'tipos_problemas': 'incident-types',
        'perfiles': 'users'
      };
      const key = map[variables.table];
      if (key) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ table, id }: { table: string; id: string }) => 
      configService.delete(table, id),
    onSuccess: (_, variables) => {
      const map: Record<string, string> = {
        'zonas': 'zones',
        'habitaciones': 'rooms',
        'activos': 'assets',
        'tipos_problemas': 'incident-types',
        'perfiles': 'users'
      };
      const key = map[variables.table];
      if (key) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};
