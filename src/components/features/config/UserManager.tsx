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
  onMessage: (msg: { type: 'success' | 'error', text: string }) => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ 
  currentUserProfile,
  onMessage 
}) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    nombre: '',
    rol: 'recepcion' as UserRole,
    hotel: currentUserProfile?.hotel || 'Hotel Central',
    permisos: ['dashboard', 'incidencias', 'chat'] as string[]
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await configService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      onMessage({ type: 'error', text: 'Error al cargar usuarios' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
            hotel: newUser.hotel,
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
        hotel: currentUserProfile?.hotel || 'Hotel Central', 
        permisos: ['dashboard', 'incidencias', 'chat'] 
      });
      fetchUsers();
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
        hotel: editingUser.hotel,
        permisos: editingUser.permisos
      });
      
      onMessage({ type: 'success', text: 'Usuario actualizado correctamente.' });
      setIsEditingUser(false);
      fetchUsers();
    } catch (error: any) {
      onMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteUser = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${nombre}?`)) return;
    
    try {
      await configService.delete('perfiles', id);
      onMessage({ type: 'success', text: 'Usuario eliminado correctamente.' });
      fetchUsers();
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
                  <td className="text-muted">{u.hotel}</td>
                  <td className="text-xs text-muted font-mono">
                    {u.id.substring(0, 8)}...
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
        <div className="input-group mb-md">
          <label className="input-label">Nombre</label>
          <input 
            type="text" 
            className="input" 
            value={newUser.nombre} 
            onChange={e => setNewUser({...newUser, nombre: e.target.value})} 
            required 
          />
        </div>
        <div className="grid grid-cols-2 gap-md mb-md">
          <div className="input-group">
            <label className="input-label">Email</label>
            <input 
              type="email" 
              className="input" 
              value={newUser.email} 
              onChange={e => setNewUser({...newUser, email: e.target.value})} 
              required 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input" 
              value={newUser.password} 
              onChange={e => setNewUser({...newUser, password: e.target.value})} 
              required 
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div className="input-group">
            <label className="input-label">Rol</label>
            <select 
              className="select" 
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
          <div className="input-group">
            <label className="input-label">Hotel</label>
            <input 
              type="text" 
              className="input" 
              value={newUser.hotel} 
              onChange={e => setNewUser({...newUser, hotel: e.target.value})} 
            />
          </div>
        </div>
        
        <div className="input-group mt-md">
          <label className="input-label mb-md">Gestión de Accesos (Permisos)</label>
          <div className="permissions-grid">
            {AVAILABLE_MODULES.map(module => {
              const Icon = module.icon;
              const isActive = newUser.permisos?.includes(module.id);
              return (
                <div 
                  key={module.id} 
                  className={`permission-card ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    const perms = isActive 
                      ? (newUser.permisos || []).filter(p => p !== module.id)
                      : [...(newUser.permisos || []), module.id];
                    setNewUser({...newUser, permisos: perms});
                  }}
                >
                  <div className="permission-icon">
                    <Icon size={20} />
                  </div>
                  <div className="permission-info">
                    <span className="permission-name">{module.name}</span>
                    <span className="permission-desc">{module.desc}</span>
                  </div>
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
        maxWidth="600px"
        footer={
          <Button onClick={handleUpdateUser}>Guardar Cambios</Button>
        }
      >
        {editingUser && (
          <>
            <div className="input-group mb-md">
              <label className="input-label">Nombre</label>
              <input 
                type="text" 
                className="input" 
                value={editingUser.nombre} 
                onChange={e => setEditingUser({...editingUser, nombre: e.target.value})} 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-md mb-md">
              <div className="input-group">
                <label className="input-label">Rol</label>
                <select 
                  className="select" 
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
              <div className="input-group">
                <label className="input-label">Hotel</label>
                <input 
                  type="text" 
                  className="input" 
                  value={editingUser.hotel} 
                  onChange={e => setEditingUser({...editingUser, hotel: e.target.value})} 
                />
              </div>
            </div>
            <div className="input-group mt-md">
              <label className="input-label mb-md">Gestión de Accesos (Permisos)</label>
              <div className="permissions-grid">
                {AVAILABLE_MODULES.map(module => {
                  const Icon = module.icon;
                  const isActive = editingUser.permisos?.includes(module.id);
                  return (
                    <div 
                      key={module.id} 
                      className={`permission-card ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        const perms = isActive 
                          ? (editingUser.permisos || []).filter(p => p !== module.id)
                          : [...(editingUser.permisos || []), module.id];
                        setEditingUser({...editingUser, permisos: perms});
                      }}
                    >
                      <div className="permission-icon">
                        <Icon size={20} />
                      </div>
                      <div className="permission-info">
                        <span className="permission-name">{module.name}</span>
                        <span className="permission-desc">{module.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </Modal>

      <style>{`
        .permissions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: var(--spacing-sm);
        }
        .permission-card {
          padding: var(--spacing-sm);
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        .permission-card.active {
          border-color: var(--color-accent);
          background: var(--color-accent-light);
        }
        .permission-name {
          font-weight: 600;
          font-size: var(--font-size-sm);
          display: block;
        }
        .permission-desc {
          font-size: 10px;
          color: var(--color-text-muted);
          display: block;
        }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: 1fr 1fr; }
      `}</style>
    </Card>
  );
};
