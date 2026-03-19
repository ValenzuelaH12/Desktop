import Dexie, { Table } from 'dexie';

export interface OfflineMutation {
  id?: number;
  action: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  hotel_id: string;
  timestamp: string;
}

export interface OfflineCache {
  id: string; // Puede ser el uuid de Supabase o uno temporal
  table: string;
  data: any;
  hotel_id: string;
  timestamp: string;
}

export class AppDatabase extends Dexie {
  offline_mutations!: Table<OfflineMutation>;
  offline_cache!: Table<OfflineCache>;

  constructor() {
    super('HotelOpsOfflineDB');
    this.version(1).stores({
      offline_mutations: '++id, table, hotel_id, timestamp',
      offline_cache: 'id, table, hotel_id, timestamp'
    });
  }
}

export const db = new AppDatabase();

// Compatibilidad con SyncManager existente
export const dbService = {
  async getSyncQueue(): Promise<OfflineMutation[]> {
    return await db.offline_mutations.toArray();
  },
  async removeFromSyncQueue(id: number) {
    await db.offline_mutations.delete(id);
  }
};

export type { OfflineMutation as OfflineSync };
