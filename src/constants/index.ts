import { 
  LayoutDashboard, 
  AlertTriangle, 
  Activity, 
  MessageSquare, 
  Calendar, 
  Package, 
  Settings 
} from 'lucide-react';

export const AVAILABLE_MODULES = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, desc: 'Vista general y estadísticas' },
  { id: 'incidencias', name: 'Incidencias', icon: AlertTriangle, desc: 'Gestión de reportes y averías' },
  { id: 'lecturas', name: 'Lecturas', icon: Activity, desc: 'Control de suministros' },
  { id: 'chat', name: 'Chat', icon: MessageSquare, desc: 'Comunicación interna' },
  { id: 'planificacion', name: 'Planificación', icon: Calendar, desc: 'Mantenimiento preventivo' },
  { id: 'inventario', name: 'Inventario', icon: Package, desc: 'Control de stock y suministros' },
  { id: 'configuracion', name: 'Configuración', icon: Settings, desc: 'Ajustes del sistema' }
];
