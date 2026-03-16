export type UserRole = 'admin' | 'direccion' | 'mantenimiento' | 'recepcion' | 'limpieza' | 'gobernanta';

export interface Profile {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  hotel: string;
  avatar_url?: string;
  permisos: string[];
}

export type IncidentStatus = 'pending' | 'in-progress' | 'resolved' | 'cancelled';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Incident {
  id: string;
  title: string;
  description?: string;
  location: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  created_at: string;
  created_by?: string;
  assigned_to?: string;
  image_url?: string;
  zona_id?: string;
  habitacion_id?: string;
  category?: string;
  asset_id?: string;
}

export interface InventoryItem {
  id: string;
  nombre: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  unidad: string;
  ultima_actualizacion?: string;
  actualizado_por?: string;
}

export interface Zone {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Room {
  id: string;
  nombre: string;
  zona_id: string;
}

export interface Asset {
  id: string;
  nombre: string;
  tipo: string;
  zona_id: string;
  habitacion_id?: string;
  manual_url?: string;
  especificaciones?: any;
}

export interface Reading {
  id: string;
  contador_id: string;
  valor: number;
  fecha: string;
  registrado_por?: string;
}

export interface Counter {
  id: string;
  nombre: string;
  tipo: 'luz' | 'agua' | 'gas' | 'otros';
}

export interface ActivityLogEvent {
  id: string;
  usuario_id: string;
  accion: string;
  detalles: any;
  created_at: string;
  perfiles?: {
    nombre: string;
    rol: string;
  };
}

export interface GlobalSettings {
  hotel_name: string;
  currency: string;
  timezone: string;
  logo_url?: string | null;
  welcome_message: string;
}
