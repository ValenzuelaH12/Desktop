import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { IncidentType } from '../../../types';
import { configService } from '../../../services/configService';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

interface IncidentTypeManagerProps {
  types: IncidentType[];
  onMessage: (msg: { type: 'success' | 'error', text: string }) => void;
  onRefresh: () => void;
  activeHotelId: string | null;
}

export const IncidentTypeManager: React.FC<IncidentTypeManagerProps> = ({ 
  types, onMessage, onRefresh, activeHotelId 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: '', categoria: 'general' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!formData.nombre.trim()) return;
    setLoading(true);
    try {
      await configService.create('tipos_problemas', {
        nombre: formData.nombre,
        categoria: formData.categoria
      }, activeHotelId);
      
      onMessage({ type: 'success', text: 'Tipo de incidencia añadido' });
      setIsAdding(false);
      setFormData({ nombre: '', categoria: 'general' });
      onRefresh();
    } catch (error) {
      console.error(error);
      onMessage({ type: 'error', text: 'Error al añadir tipo' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, nombre: string) => {
    if (!nombre.trim()) return;
    setLoading(true);
    try {
      await configService.update('tipos_problemas', id, { nombre });
      onMessage({ type: 'success', text: 'Tipo actualizado' });
      setEditingId(null);
      onRefresh();
    } catch (error) {
      console.error(error);
      onMessage({ type: 'error', text: 'Error al actualizar' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este tipo? Las incidencias existentes podrían verse afectadas.')) return;
    setLoading(true);
    try {
      await configService.delete('tipos_problemas', id);
      onMessage({ type: 'success', text: 'Tipo eliminado' });
      onRefresh();
    } catch (error) {
      console.error(error);
      onMessage({ type: 'error', text: 'Error al eliminar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-lg animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Tipos de Incidencias</h2>
          <p className="text-sm text-muted">Categorías disponibles para reportar problemas</p>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <Plus size={18} />
          <span>Añadir Tipo</span>
        </Button>
      </div>

      <div className="grid gap-md">
        {isAdding && (
          <Card className="p-md border-accent border-2 bg-accent/5 animate-slide-down">
            <div className="flex flex-col md:flex-row gap-md items-end">
              <div className="flex-1 space-y-xs">
                <label className="text-xs font-bold uppercase text-accent">Nombre del Tipo</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Ej: Fontanería, Aire Acondicionado..." 
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="flex gap-sm">
                <Button variant="secondary" onClick={() => setIsAdding(false)}>Cancelar</Button>
                <Button variant="primary" onClick={handleCreate} disabled={loading || !formData.nombre}>
                  {loading ? 'Guardando...' : 'Crear Tipo'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {types.map(type => (
            <Card key={type.id} className={`p-md group transition-all hover:border-accent/30 ${editingId === type.id ? 'border-accent ring-1 ring-accent' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {editingId === type.id ? (
                    <input 
                      type="text" 
                      className="input input-sm mb-xs" 
                      defaultValue={type.nombre}
                      onBlur={(e) => handleUpdate(type.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(type.id, (e.target as HTMLInputElement).value);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <div className="flex flex-col">
                      <h3 className="font-bold flex items-center gap-xs">
                        {type.nombre}
                        {!type.hotel_id && (
                          <span className="badge badge-info text-[9px] py-0 px-xs h-fit uppercase">Global</span>
                        )}
                      </h3>
                      <span className="text-[10px] text-muted uppercase font-semibold">{type.categoria}</span>
                    </div>
                  )}
                </div>
                
                {/* Solo permitir editar/borrar si no es un tipo global (a menos que seas super_admin, pero aquí simplificamos por hotel) */}
                {(type.hotel_id || activeHotelId === null) && (
                  <div className="flex gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingId(type.id)}
                      className="p-xs hover:bg-white/10 rounded text-muted hover:text-white"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(type.id)}
                      className="p-xs hover:bg-danger/20 rounded text-muted hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {types.length === 0 && !isAdding && (
            <div className="col-span-full py-xl text-center glass rounded-xl border-2 border-dashed border-white/5">
              <AlertCircle size={32} className="mx-auto text-muted mb-md opacity-20" />
              <p className="text-muted">No se han encontrado tipos de incidencias.</p>
              <Button variant="ghost" className="mt-md" onClick={() => setIsAdding(true)}>Crear el primero</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
