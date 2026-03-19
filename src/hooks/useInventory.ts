import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventoryService';
import { InventoryItem } from '../types';

export const useInventory = (hotelId: string | null) => {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory', hotelId],
    queryFn: () => inventoryService.getAll(hotelId),
    enabled: !!hotelId,
  });
};

export const useLowStockAlerts = (hotelId: string | null) => {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory', 'low-stock', hotelId],
    queryFn: async () => {
      const items = await inventoryService.getAll(hotelId);
      return items.filter(i => i.stock_actual <= i.stock_minimo);
    },
    enabled: !!hotelId,
  });
};
