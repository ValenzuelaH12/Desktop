import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planService, PlanConfig } from '../services/planService';

export const usePlanes = () => {
  const queryClient = useQueryClient();

  // 1. Fetch de todos los planes
  const { data: planes = [], isLoading, error } = useQuery({
    queryKey: ['planes'],
    queryFn: () => planService.getPlanes(),
    staleTime: 1000 * 60, // 1 minuto de caché
  });

  // 2. Mutación para actualizar un plan
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<PlanConfig> }) => 
      planService.updatePlan(id, updates),
    onSuccess: () => {
      // Invalidar la caché para que todos los componentes se actualicen
      queryClient.invalidateQueries({ queryKey: ['planes'] });
    },
  });

  return {
    planes,
    isLoading,
    error,
    updatePlan: updatePlanMutation.mutateAsync,
    isUpdating: updatePlanMutation.isPending
  };
};
