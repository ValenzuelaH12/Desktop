import React, { useState, useEffect } from 'react';
import { Users, UserPlus, RefreshCw, Trash2, X } from 'lucide-react';
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
    <Card className="table-panel">
      <div className="panel-header border-b">
        <div className="flex items-center gap-md">
          <Users size={20} className="text-accent" />
          <h3 className="text-lg font-semibold">Equipo y Usuarios</h3>
        </div>
        <Button size="sm" onClick={() => setIsAddingUser(true)} icon={UserPlus}>
          Agregar
        </Button>
      </div>
      
      <div className="panel-body p-none">
        <div className="table-responsive">
          <table className="config-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Hotel</th>
                <th>ID</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-sm">
                      <div className="avatar avatar-sm avatar-gradient">
                        {u.nombre?.charAt(0)}
                      </div>
                      {u.nombre}
                    </div>
                  </td>
                  <td>
                    <Badge variant="accent">
                      {u.rol?.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="text-muted text-xs">
                    {u.hotel_id === '00000000-0000-0000-0000-000000000000' ? 'Hotel Principal' : u.hotel_id?.substring(0, 8)}
                  </td>
                  <td>
                    <div className="flex gap-sm">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setEditingUser(u); setIsEditingUser(true); }}
                        icon={RefreshCw}
                        title="Editar"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-danger"
                        onClick={() => handleDeleteUser(u.id, u.nombre)}
                        icon={Trash2}
                        title="Eliminar"
                      />
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
        <div className="grid grid-cols-2 gap-sm mb-sm">
          <div className="input-group">
            <label className="input-label text-[10px] mb-xs">Nombre Completo</label>
            <input 
              type="text" 
              className="input py-1.5 text-xs" 
              value={newUser.nombre} 
              onChange={e => setNewUser({...newUser, nombre: e.target.value})} 
              required 
            />
          </div>
          <div className="input-group">
            <label className="input-label text-[10px] mb-xs">Email</label>
            <input 
              type="email" 
              className="input py-1.5 text-xs" 
              value={newUser.email} 
              onChange={e => setNewUser({...newUser, email: e.target.value})} 
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-sm items-end mb-sm">
          <div className="input-group">
            <label className="input-label text-[10px] mb-xs">Contraseña</label>
            <input 
              type="password" 
              className="input py-1.5 text-xs" 
              value={newUser.password} 
              onChange={e => setNewUser({...newUser, password: e.target.value})} 
              required 
            />
          </div>
          <div className="input-group">
            <label className="input-label text-[10px] mb-xs">Rol del Usuario</label>
            <select 
              className="select py-1.5 text-xs" 
              value={newUser.rol} 
              onChange={e => setNewUser({...newUser, rol: e.target.value as UserRole})}
            >
              <option value="recepcion">Recepción</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="limpieza">Limpieza</option>
              <option value="gobernanta">Gobernanta</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        <div className="input-group mb-sm">
          <div className="flex justify-between items-center mb-xs">
            <label className="input-label text-[10px]">Permisos de Acceso</label>
            <span className="text-[9px] text-muted">Haz clic para activar/desactivar</span>
          </div>
          <div className="permissions-grid-compact">
            {AVAILABLE_MODULES.map(module => {
              const Icon = module.icon;
              const isActive = newUser.permisos?.includes(module.id);
              return (
                <div 
                  key={module.id} 
                  className={`perm-tag ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    const perms = isActive 
                      ? (newUser.permisos || []).filter(p => p !== module.id)
                      : [...(newUser.permisos || []), module.id];
                    setNewUser({...newUser, permisos: perms});
                  }}
                >
                  <Icon size={12} />
                  <span>{module.name}</span>
                </div>
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
          <div className="space-y-sm">
            <div className="grid grid-cols-2 gap-sm">
              <div className="input-group">
                <label className="input-label text-[10px] mb-xs">Nombre</label>
                <input 
                  type="text" 
                  className="input py-1.5 text-xs" 
                  value={editingUser.nombre} 
                  onChange={e => setEditingUser({...editingUser, nombre: e.target.value})} 
                  required 
                />
              </div>
              <div className="input-group">
                <label className="input-label text-[10px] mb-xs">Rol</label>
                <select 
                  className="select py-1.5 text-xs" 
                  value={editingUser.rol} 
                  onChange={e => setEditingUser({...editingUser, rol: e.target.value as UserRole})}
                >
                  <option value="recepcion">Recepción</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="limpieza">Limpieza</option>
                  <option value="gobernanta">Gobernanta</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            
            <div className="input-group">
              <label className="input-label text-[10px] mb-xs">Permisos de Acceso</label>
              <div className="permissions-grid-compact">
                {AVAILABLE_MODULES.map(module => {
                  const Icon = module.icon;
                  const isActive = editingUser.permisos?.includes(module.id);
                  return (
                    <div 
                      key={module.id} 
                      className={`perm-tag ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        const perms = isActive 
                          ? (editingUser.permisos || []).filter(p => p !== module.id)
                          : [...(editingUser.permisos || []), module.id];
                        setEditingUser({...editingUser, permisos: perms});
                      }}
                    >
                      <Icon size={12} />
                      <span>{module.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
      <style>{`
        .permissions-grid-compact {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 4px;
        }
        .perm-tag {
          padding: 4px 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 500;
          height: 32px;
        }
        .perm-tag.active {
          border-color: var(--color-accent);
          background: var(--color-accent-light);
          color: white;
        }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: 1fr 1fr; }
        .grid-cols-3 { grid-template-columns: 1fr 1fr 1fr; }
        .items-end { align-items: end; }
        .mb-none { margin-bottom: 0; }
        .mb-sm { margin-bottom: var(--spacing-sm); }
        .mb-xs { margin-bottom: var(--spacing-xs); }
        .gap-sm { gap: var(--spacing-sm); }
        .py-1.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
        .text-xs { font-size: 0.75rem; }
      `}</style>
    </Card>
  );
};
