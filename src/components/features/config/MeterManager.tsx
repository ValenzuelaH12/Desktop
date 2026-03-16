import React, { useState } from 'react';
import { Activity, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { configService } from '../../../services/configService';
import { Counter } from '../../../types';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Badge } from '../../ui/Badge';

interface MeterManagerProps {
  counters: Counter[];
  onMessage: (msg: { type: 'success' | 'error', text: string }) => void;
  onRefresh: () => void;
  activeHotelId: string | null;
}

export const MeterManager: React.FC<MeterManagerProps> = ({ 
  counters, 
  onMessage,
  onRefresh,
  activeHotelId
}) => {
  const [isAddingMeter, setIsAddingMeter] = useState(false);
  const [isEditingMeter, setIsEditingMeter] = useState(false);
  const [editingMeter, setEditingMeter] = useState<Counter | null>(null);
  
  const [newMeter, setNewMeter] = useState({
    nombre: '',
    tipo: 'luz' as Counter['tipo'],
    hotel_id: activeHotelId || ''
  });

  // Sync hotel_id when activeHotelId changes
  React.useEffect(() => {
    if (activeHotelId) {
      setNewMeter(prev => ({ ...prev, hotel_id: activeHotelId }));
    }
  }, [activeHotelId]);

  const handleAddMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await configService.create('contadores', { ...newMeter, hotel_id: activeHotelId });
      onMessage({ type: 'success', text: 'Contador creado exitosamente.' });
      setIsAddingMeter(false);
      setNewMeter({ nombre: '', tipo: 'luz', hotel_id: activeHotelId || '' });
      onRefresh();
    } catch (error: any) {
      onMessage({ type: 'error', text: `Error al crear contador: ${error.message}` });
    }
  };

  const handleUpdateMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeter) return;
    try {
      await configService.update('contadores', editingMeter.id, {
        nombre: editingMeter.nombre,
        tipo: editingMeter.tipo
      });
      onMessage({ type: 'success', text: 'Contador actualizado.' });
      setIsEditingMeter(false);
      onRefresh();
    } catch (error: any) {
      onMessage({ type: 'error', text: `Error al actualizar: ${error.message}` });
    }
  };

  const handleDeleteMeter = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el contador ${name}?`)) return;
    try {
      await configService.delete('contadores', id);
      onMessage({ type: 'success', text: 'Contador eliminado.' });
      onRefresh();
    } catch (error: any) {
      onMessage({ type: 'error', text: `Error al eliminar: ${error.message}` });
    }
  };

  return (
    <Card className="table-panel">
      <div className="panel-header border-b">
        <div className="flex items-center gap-md">
          <Activity size={20} className="text-accent" />
          <h3 className="text-lg font-semibold">Contadores y Suministros</h3>
        </div>
        <Button size="sm" onClick={() => setIsAddingMeter(true)} icon={Plus}>
          Nuevo Contador
        </Button>
      </div>

      <div className="panel-body p-none">
        <div className="table-responsive">
          <table className="config-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {counters.map(c => (
                <tr key={c.id}>
                  <td className="font-medium">{c.nombre}</td>
                  <td>
                    <Badge variant={c.tipo === 'luz' ? 'warning' : c.tipo === 'agua' ? 'info' : 'neutral'}>
                      {c.tipo?.toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex gap-sm">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setEditingMeter(c); setIsEditingMeter(true); }}
                        icon={RefreshCw}
                        title="Editar"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-danger"
                        onClick={() => handleDeleteMeter(c.id, c.nombre)}
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

      {/* Add Meter Modal */}
      <Modal isOpen={isAddingMeter} onClose={() => setIsAddingMeter(false)} title="Nuevo Contador">
        <form onSubmit={handleAddMeter}>
          <div className="input-group mb-md">
            <label className="input-label">Nombre del Contador</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Ej. General Luz, Agua Cocina..." 
              value={newMeter.nombre} 
              onChange={e => setNewMeter({ ...newMeter, nombre: e.target.value })} 
              required 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Tipo de Suministro</label>
            <select 
              className="select" 
              value={newMeter.tipo} 
              onChange={e => setNewMeter({ ...newMeter, tipo: e.target.value as Counter['tipo'] })}
            >
              <option value="luz">Luz</option>
              <option value="agua">Agua</option>
              <option value="gas">Gas</option>
              <option value="otros">Otros</option>
            </select>
          </div>
          <div className="modal-footer">
            <Button type="submit">Crear Contador</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Meter Modal */}
      <Modal isOpen={isEditingMeter} onClose={() => setIsEditingMeter(false)} title="Editar Contador">
        {editingMeter && (
          <form onSubmit={handleUpdateMeter}>
            <div className="input-group mb-md">
              <label className="input-label">Nombre del Contador</label>
              <input 
                type="text" 
                className="input" 
                value={editingMeter.nombre} 
                onChange={e => setEditingMeter({ ...editingMeter, nombre: e.target.value })} 
                required 
              />
            </div>
            <div className="input-group">
              <label className="input-label">Tipo de Suministro</label>
              <select 
                className="select" 
                value={editingMeter.tipo} 
                onChange={e => setEditingMeter({ ...editingMeter, tipo: e.target.value as Counter['tipo'] })}
              >
                <option value="luz">Luz</option>
                <option value="agua">Agua</option>
                <option value="gas">Gas</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            <div className="modal-footer">
              <Button type="submit">Guardar Cambios</Button>
            </div>
          </form>
        )}
      </Modal>
    </Card>
  );
};
