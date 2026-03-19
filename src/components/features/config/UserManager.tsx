import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  RefreshCw, 
  Trash2, 
  X, 
  Mail, 
  Lock, 
  User, 
  Shield, 
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { configService } from '../../../services/configService';
import { Profile, UserRole } from '../../../types';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { AVAILABLE_MODULES } from '../../../constants';

interface UserManagerProps {
  currentUserProfile: Profile | null;
  onMessage: (msg: { type: 'success' | 'error' | '', text: string }) => void;
  activeHotelId: string | null;
  users: Profile[];
  onRefresh: () => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ 
  currentUserProfile, 
  onMessage,
  activeHotelId,
  users,
  onRefresh
}) => {
  const [loading, setLoading] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    nombre: '',
    rol: 'recepcion' as UserRole,
    hotel_id: activeHotelId || '00000000-0000-0000-0000-000000000000',
    permisos: ['dashboard', 'incidencias', 'chat'] as string[]
  });

  // Sync newUser.hotel_id when activeHotelId changes
  useEffect(() => {
    if (activeHotelId) {
      setNewUser(prev => ({ ...prev, hotel_id: activeHotelId }));
    }
  }, [activeHotelId]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newUser.nombre.trim().length < 2) {
      onMessage({ type: 'error', text: 'El nombre debe tener al menos 2 caracteres.' });
      return;
    }
    if (newUser.password.length < 6) {
      onMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            nombre: newUser.nombre.trim(),
            rol: newUser.rol,
            hotel_id: newUser.hotel_id,
            permisos: newUser.permisos
          }
        }
      });

      if (authError) throw authError;
      
      onMessage({ type: 'success', text: 'Usuario creado exitosamente.' });
      setIsAddingUser(false);
      setNewUser({ 
        email: '', 
        password: '', 
        nombre: '', 
        rol: 'recepcion', 
        hotel_id: currentUserProfile?.hotel_id || '00000000-0000-0000-0000-000000000000', 
        permisos: ['dashboard', 'incidencias', 'chat'] 
      });
      onRefresh();
    } catch (error: any) {
      onMessage({ type: 'error', text: error.message });
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await configService.update('perfiles', editingUser.id, {
        nombre: editingUser.nombre,
        rol: editingUser.rol,
        hotel_id: editingUser.hotel_id,
        permisos: editingUser.permisos
      });
      
      onMessage({ type: 'success', text: 'Usuario actualizado correctamente.' });
      setIsEditingUser(false);
      onRefresh();
    } catch (error: any) {
      onMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteUser = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${nombre}?`)) return;
    
    try {
      await configService.delete('perfiles', id);
      onMessage({ type: 'success', text: 'Usuario eliminado correctamente.' });
      onRefresh();
    } catch (error: any) {
      onMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="v-glass-card p-none overflow-hidden animate-fade-in">
      <div className="v-page-header border-b border-white/5 bg-white/5 py-4 px-6 mb-0">
        <div className="flex items-center gap-md">
          <div className="p-2 bg-accent/20 text-accent rounded-lg">
            <Users size={20} />
          </div>
          <h3 className="text-lg font-black text-white tracking-tight uppercase">Equipo y Usuarios</h3>
        </div>
        <Button size="sm" onClick={() => setIsAddingUser(true)} icon={UserPlus} className="bg-accent hover:bg-accent-hover text-white rounded-xl px-6 py-2 text-xs font-bold uppercase tracking-wider">
          Agregar
        </Button>
      </div>
      
      <div className="p-none">
        <div className="v-table-container">
          <table className="v-table">
            <thead>
              <tr>
                <th className="text-left font-black uppercase text-[10px] tracking-widest text-muted py-4 px-6">Nombre</th>
                <th className="text-left font-black uppercase text-[10px] tracking-widest text-muted py-4 px-6">Rol</th>
                <th className="text-left font-black uppercase text-[10px] tracking-widest text-muted py-4 px-6">Hotel</th>
                <th className="text-left font-black uppercase text-[10px] tracking-widest text-muted py-4 px-6">ID</th>
                <th className="text-right font-black uppercase text-[10px] tracking-widest text-muted py-4 px-6">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="group hover:bg-white/5 transition-all border-b border-white/5 last:border-0">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs border border-accent/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                        {u.nombre?.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-white">{u.nombre}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-tighter">
                      {u.rol?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-muted text-xs font-medium">
                    {u.hotel_id === '00000000-0000-0000-0000-000000000000' ? 'Sede Central' : u.hotel_id?.substring(0, 8)}
                  </td>
                  <td className="py-4 px-6 text-muted font-mono text-[10px] opacity-40">
                    {u.id.substring(0, 8)}...
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setEditingUser(u); setIsEditingUser(true); }}
                        className="p-2 rounded-lg bg-white/5 text-muted hover:text-accent hover:bg-accent/10 transition-all border border-white/5"
                        title="Configurar Perfil"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button 
                        className="p-2 rounded-lg bg-white/5 text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/5"
                        onClick={() => handleDeleteUser(u.id, u.nombre)}
                        title="Borrar Acceso"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal 
        isOpen={isAddingUser} 
        onClose={() => setIsAddingUser(false)}
        title="Nuevo Miembro"
        maxWidth="600px"
        footer={
          <Button onClick={handleAddUser}>Registrar</Button>
        }
      >
        <div className="space-y-6">
          {/* SECCIÓN 1: IDENTIDAD */}
          <div className="premium-section-header">
            <div className="section-icon-box">
              <User size={14} />
            </div>
            <h4 className="section-title">Información de Identidad</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="group relative">
              <label className="input-label-premium">Nombre Completo</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50 group-focus-within:text-accent transition-colors">
                  <User size={16} />
                </div>
                <input 
                  type="text" 
                  className="v-input-ultra" 
                  placeholder="Ej. Juan Pérez"
                  value={newUser.nombre} 
                  onChange={e => setNewUser({...newUser, nombre: e.target.value})} 
                  required 
                />
              </div>
            </div>
            <div className="group relative">
              <label className="input-label-premium">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50 group-focus-within:text-accent transition-colors">
                  <Mail size={16} />
                </div>
                <input 
                  type="email" 
                  className="v-input-ultra" 
                  placeholder="juan@hotel.com"
                  value={newUser.email} 
                  onChange={e => setNewUser({...newUser, email: e.target.value})} 
                  required 
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: SEGURIDAD Y ROL */}
          <div className="premium-section-header">
            <div className="section-icon-box">
              <Lock size={14} />
            </div>
            <h4 className="section-title">Seguridad y Jerarquía</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="group relative">
              <label className="input-label-premium">Contraseña Maestra</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50 group-focus-within:text-accent transition-colors">
                  <Lock size={16} />
                </div>
                <input 
                  type="password" 
                  className="v-input-ultra" 
                  placeholder="********"
                  value={newUser.password} 
                  onChange={e => setNewUser({...newUser, password: e.target.value})} 
                  required 
                />
              </div>
            </div>
            <div className="group relative">
              <label className="input-label-premium">Rol Administrativo</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50 group-focus-within:text-accent transition-colors">
                  <Shield size={16} />
                </div>
                <select 
                  className="v-input-ultra appearance-none" 
                  value={newUser.rol} 
                  onChange={e => setNewUser({...newUser, rol: e.target.value as UserRole})}
                >
                  <option value="recepcion">Recepción / V-Nexus</option>
                  <option value="mantenimiento">Técnico Mantenimiento</option>
                  <option value="limpieza">Staff de Limpieza</option>
                  <option value="gobernanta">Supervisión / Gobernanta</option>
                  <option value="admin">Administrador Suite</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: CAPACIDADES */}
          <div className="premium-section-header">
            <div className="section-icon-box">
              <Shield size={14} />
            </div>
            <h4 className="section-title">Privilegios de Módulo</h4>
            <div className="ml-auto flex items-center gap-1 text-[9px] text-accent/80 font-black uppercase bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
              <Info size={10} /> 
              Selección Inteligente
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AVAILABLE_MODULES.map(module => {
              const Icon = module.icon;
              const isActive = newUser.permisos?.includes(module.id);
              return (
                <button 
                  key={module.id} 
                  type="button"
                  className={`group relative flex flex-col items-center justify-center gap-2 p-5 rounded-[22px] border transition-all duration-500 overflow-hidden ${
                    isActive 
                      ? 'bg-accent text-white border-accent shadow-[0_8px_20px_rgba(99,102,241,0.3)] scale-[1.02]' 
                      : 'bg-white/5 border-white/5 text-muted/60 hover:border-white/20 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => {
                    const perms = isActive 
                      ? (newUser.permisos || []).filter(p => p !== module.id)
                      : [...(newUser.permisos || []), module.id];
                    setNewUser({...newUser, permisos: perms});
                  }}
                >
                  {/* Glow background when active */}
                  {isActive && <div className="absolute inset-0 bg-gradient-to-tr from-accent/40 via-transparent to-transparent opacity-50 animate-pulse" />}
                  
                  <div className={`relative p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-white/20 shadow-inner' : 'bg-black/20 group-hover:scale-110'}`}>
                    <Icon size={22} strokeWidth={2.5} />
                  </div>
                  <span className="relative text-[10px] font-black uppercase tracking-widest">{module.name}</span>
                  
                  {isActive && <div className="absolute top-2 right-2 text-white">
                    <CheckCircle2 size={12} fill="white" className="text-accent" />
                  </div>}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal 
        isOpen={isEditingUser} 
        onClose={() => setIsEditingUser(false)}
        title="Editar Miembro"
        maxWidth="550px"
        footer={
          <Button onClick={handleUpdateUser}>Guardar Cambios</Button>
        }
      >
        {editingUser && (
          <div className="space-y-6">
            {/* SECCIÓN 1: IDENTIDAD */}
            <div className="premium-section-header">
              <div className="section-icon-box">
                <User size={14} />
              </div>
              <h4 className="section-title">Información de Perfil</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group relative">
                <label className="input-label-premium">Nombre Completo</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50 group-focus-within:text-accent transition-colors">
                    <User size={16} />
                  </div>
                  <input 
                    type="text" 
                    className="v-input-ultra" 
                    value={editingUser.nombre} 
                    onChange={e => setEditingUser({...editingUser, nombre: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="group relative">
                <label className="input-label-premium">Rol de Usuario</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50 group-focus-within:text-accent transition-colors">
                    <Shield size={16} />
                  </div>
                  <select 
                    className="v-input-ultra appearance-none" 
                    value={editingUser.rol} 
                    onChange={e => setEditingUser({...editingUser, rol: e.target.value as UserRole})}
                  >
                    <option value="recepcion">Recepción / V-Nexus</option>
                    <option value="mantenimiento">Técnico Mantenimiento</option>
                    <option value="limpieza">Staff de Limpieza</option>
                    <option value="gobernanta">Supervisión / Gobernanta</option>
                    <option value="admin">Administrador Suite</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: PRIVILEGIOS */}
            <div className="premium-section-header">
              <div className="section-icon-box">
                <Lock size={14} />
              </div>
              <h4 className="section-title">Ajustes de Permisos</h4>
              <div className="ml-auto flex items-center gap-1 text-[9px] text-accent/80 font-black uppercase bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                <Info size={10} /> 
                Configuración Activa
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AVAILABLE_MODULES.map(module => {
                const Icon = module.icon;
                const isActive = editingUser.permisos?.includes(module.id);
                return (
                  <button 
                    key={module.id} 
                    type="button"
                    className={`group relative flex flex-col items-center justify-center gap-2 p-5 rounded-[22px] border transition-all duration-500 overflow-hidden ${
                      isActive 
                        ? 'bg-accent text-white border-accent shadow-[0_8px_20px_rgba(99,102,241,0.3)] scale-[1.02]' 
                        : 'bg-white/5 border-white/5 text-muted/60 hover:border-white/20 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => {
                      const perms = isActive 
                        ? (editingUser.permisos || []).filter(p => p !== module.id)
                        : [...(editingUser.permisos || []), module.id];
                      setEditingUser({...editingUser, permisos: perms});
                    }}
                  >
                    {isActive && <div className="absolute inset-0 bg-gradient-to-tr from-accent/40 via-transparent to-transparent opacity-50 animate-pulse" />}
                    
                    <div className={`relative p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-white/20 shadow-inner' : 'bg-black/20 group-hover:scale-110'}`}>
                      <Icon size={22} strokeWidth={2.5} />
                    </div>
                    <span className="relative text-[10px] font-black uppercase tracking-widest">{module.name}</span>
                    
                    {isActive && <div className="absolute top-2 right-2 text-white">
                      <CheckCircle2 size={12} fill="white" className="text-accent" />
                    </div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
      <style>{`
        .v-input-ultra {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px; 
          padding: 0.9rem 1rem 0.9rem 2.75rem; 
          color: white; 
          width: 100%; 
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          font-size: 0.9rem;
          font-weight: 500;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .v-input-ultra:focus {
          outline: none; 
          border-color: #6366f1; 
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.15), inset 0 2px 4px rgba(0,0,0,0.05);
          transform: translateY(-1px);
        }
        .v-input-ultra::placeholder { color: rgba(255,255,255,0.2); font-weight: 400; }
        .v-input-ultra option { background: #0a0a0f; color: white; padding: 10px; }

        .input-label-premium {
          display: block;
          font-size: 9px;
          font-weight: 900;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 8px;
          padding-left: 4px;
        }

        .premium-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
        }
        .section-icon-box {
          width: 28px; height: 28px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #6366f1;
        }
        .section-title {
          font-size: 11px;
          font-weight: 800;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};
