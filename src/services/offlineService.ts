import { waterService } from './waterService';

class OfflineService {
  private syncInterval: any = null;

  init() {
    window.addEventListener('online', () => {
      console.log('🌐 Conexión restaurada. Iniciando sincronización...');
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      console.log('📶 Conexión perdida. Modo offline activado.');
    });

    // También intentar sincronizar al inicio si estamos online
    if (navigator.onLine) {
      this.syncAll();
    }
  }

  async syncAll() {
    try {
      await waterService.syncOfflineData();
      // Aquí se añadirán otros servicios (incidencias, etc.) a medida que se refactoricen
      console.log('✅ Sincronización completada con éxito.');
    } catch (error) {
      console.error('❌ Error durante la sincronización masiva:', error);
    }
  }
}

export const offlineService = new OfflineService();
