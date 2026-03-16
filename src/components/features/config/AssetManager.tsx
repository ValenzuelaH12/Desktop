import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { configService } from '../../../services/configService';
import { Asset, Zone } from '../../../types';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Badge } from '../../ui/Badge';

interface AssetManagerProps {
  zones: Zone[];
  onMessage: (msg: { type: 'success' | 'error', text: string }) => void;
}

export const AssetManager: React.FC<AssetManagerProps> = ({ 
  zones,
  onMessage 
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  
  const [newAsset, setNewAsset] = useState({
    nombre: '',
    tipo: 'maquinaria',
    zona_id: '',
    manual_url: '',
    especificaciones: {}
  });

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await configService.getAssets();
      setAssets(data);
    } catch (error) {
      console.error(error);
      onMessage({ type: 'error', text: 'Error al cargar activos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.zona_id) {
      onMessage({ type: 'error', text: 'Debes seleccionar una zona para el activo.' });
      return;
    }

    try {
      await configService.create('activos', newAsset);
      onMessage({ type: 'success', text: 'Activo registrado correctamente.' });
      setIsAddingAsset(false);
      setNewAsset({ nombre: '', tipo: 'maquinaria', zona_id: '', manual_url: '', especificaciones: {} });
      fetchAssets();
    } catch (error: any) {
      onMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteAsset = async (id: string, nombre: string) => {
    if (!confirm(`¿Confirmar borrado de ${nombre}?`)) return;
    
    try {
      await configService.delete('activos', id);
      onMessage({ type: 'success', text: 'Activo eliminado correctamente.' });
      fetchAssets();
    } catch (error: any) {
      onMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <Card className="table-panel">
      <div className="panel-header border-b">
        <div className="flex items-center gap-md">
          <Package size={20} className="text-accent" />
          <h3 className="text-lg font-semibold">Gestión de Activos y Equipos</h3>
        </div>
        <Button size="sm" onClick={() => setIsAddingAsset(true)} icon={Plus}>
          Registrar Activo
        </Button>
      </div>

      <div className="panel-body p-none">
        <div className="table-responsive">
          <table className="config-table">
            <thead>
              <tr>
                <th>Activo</th>
                <th>Zona</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>QR Portal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(a => {
                const portalUrl = `${window.location.origin}/asset/${a.id}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(portalUrl)}`;
                
                return (
                  <tr key={a.id}>
                    <td>
                      <div className="flex items-center gap-sm">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                          {a.nombre[0]}
                        </div>
                        <span className="font-medium">{a.nombre}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-xs text-muted">
                        <MapPin size={14} />
                        {zones.find(z => z.id === a.zona_id)?.nombre || 'General'}
                      </div>
                    </td>
                    <td>
                      <Badge variant="neutral">{a.tipo?.toUpperCase()}</Badge>
                    </td>
                    <td>
                      {/* Note: Estado might be dynamic based on incidents, but using fallback here */}
                      <div className="flex items-center gap-xs">
                        <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="text-xs font-bold text-success">OPERATIVO</span>
                      </div>
                    </td>
                    <td>
                      <a href={qrUrl} target="_blank" rel="noreferrer" className="inline-block p-1 bg-white rounded-lg shadow-sm">
                        <img src={qrUrl} alt={`QR ${a.nombre}`} width="40" height="40" className="rounded" />
                      </a>
                    </td>
                    <td>
                      <div className="flex gap-sm">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => window.open(portalUrl, '_blank')}
                          icon={ExternalLink}
                          title="Ver Portal"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-danger"
                          onClick={() => handleDeleteAsset(a.id, a.nombre)}
                          icon={Trash2}
                          title="Eliminar"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      <Modal
        isOpen={isAddingAsset}
        onClose={() => setIsAddingAsset(false)}
        title="Registrar Nuevo Activo"
        footer={<Button onClick={handleAddAsset}>Registrar Activo</Button>}
      >
        <div className="input-group mb-md">
          <label className="input-label">Nombre del Activo / Equipo</label>
          <input 
            type="text" 
            className="input" 
            placeholder="Ej. Caldera Central A, Aire Planta 1..." 
            value={newAsset.nombre} 
            onChange={e => setNewAsset({...newAsset, nombre: e.target.value})} 
            required 
          />
        </div>
        <div className="grid grid-cols-2 gap-md mb-md">
          <div className="input-group">
            <label className="input-label">Tipo de Activo</label>
            <select 
              className="select" 
              value={newAsset.tipo} 
              onChange={e => setNewAsset({...newAsset, tipo: e.target.value})}
            >
              <option value="maquinaria">Maquinaria</option>
              <option value="climatizacion">Climatización</option>
              <option value="fontaneria">Fontanería</option>
              <option value="electricidad">Electricidad</option>
              <option value="elevacion">Elevación</option>
              <option value="otros">Otros</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Ubicación (Zona)</label>
            <select 
              className="select" 
              value={newAsset.zona_id} 
              onChange={e => setNewAsset({...newAsset, zona_id: e.target.value})}
              required
            >
              <option value="">Seleccionar Zona...</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">URL del Manual Técnico (PDF/Web)</label>
          <input 
            type="url" 
            className="input" 
            placeholder="https://ejemplo.com/manual.pdf" 
            value={newAsset.manual_url} 
            onChange={e => setNewAsset({...newAsset, manual_url: e.target.value})} 
          />
        </div>
      </Modal>

      <style>{`
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: 1fr 1fr; }
      `}</style>
    </Card>
  );
};
