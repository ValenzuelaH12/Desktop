import React, { useState, useEffect } from 'react';
import { Settings, Shield, Bell, Type, Save, Image as ImageIcon } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { settingsService } from '../../../services/settingsService';
import { GlobalSettings, ActivityLogEvent } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface SettingsManagerProps {
  onMessage: (msg: { type: 'success' | 'error', text: string }) => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ onMessage }) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'perfil' | 'notificaciones' | 'textos' | 'auditoria'>('perfil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GlobalSettings>({
    hotel_name: '',
    currency: 'EUR',
    timezone: 'Europe/Madrid',
    logo_url: null,
    welcome_message: ''
  });
  const [logs, setLogs] = useState<ActivityLogEvent[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'auditoria') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      if (data) setSettings(data);
    } catch (error) {
      console.error(error);
      onMessage({ type: 'error', text: 'Error al cargar los ajustes globales.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await settingsService.getActivityLogs(50);
      setLogs(data);
    } catch (error) {
      console.error(error);
      onMessage({ type: 'error', text: 'Error al cargar la auditoría.' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    try {
      await settingsService.updateSettings(settings, profile.id);
      onMessage({ type: 'success', text: 'Ajustes guardados correctamente.' });
    } catch (error) {
      onMessage({ type: 'error', text: 'Error al guardar ajustes.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-xl text-center">Cargando ajustes...</div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-lg">
      <Card className="w-full md:w-64 p-sm h-fit shrink-0">
        <nav className="flex flex-col gap-xs">
          <button 
            onClick={() => setActiveTab('perfil')}
            className={`flex items-center gap-sm p-sm rounded-lg transition-colors ${activeTab === 'perfil' ? 'bg-accent/20 text-accent' : 'hover:bg-white/5 text-muted'}`}
          >
            <Settings size={18} />
            <span className="font-medium">Perfil del Hotel</span>
          </button>
          <button 
            onClick={() => setActiveTab('notificaciones')}
            className={`flex items-center gap-sm p-sm rounded-lg transition-colors ${activeTab === 'notificaciones' ? 'bg-accent/20 text-accent' : 'hover:bg-white/5 text-muted'}`}
          >
            <Bell size={18} />
            <span className="font-medium">Notificaciones</span>
          </button>
          <button 
            onClick={() => setActiveTab('textos')}
            className={`flex items-center gap-sm p-sm rounded-lg transition-colors ${activeTab === 'textos' ? 'bg-accent/20 text-accent' : 'hover:bg-white/5 text-muted'}`}
          >
            <Type size={18} />
            <span className="font-medium">Textos V-Nexus</span>
          </button>
          <button 
            onClick={() => setActiveTab('auditoria')}
            className={`flex items-center gap-sm p-sm rounded-lg transition-colors ${activeTab === 'auditoria' ? 'bg-accent/20 text-accent' : 'hover:bg-white/5 text-muted'}`}
          >
            <Shield size={18} />
            <span className="font-medium">Auditoría (Log)</span>
          </button>
        </nav>
      </Card>

      <Card className="flex-1 p-xl">
        {activeTab === 'perfil' && (
          <form onSubmit={handleSave} className="animate-fade-in flex flex-col gap-lg">
            <h3 className="text-xl font-bold mb-md">Branding e Identidad</h3>
            
            <div className="flex gap-lg items-center mb-md pb-lg border-b border-white/10">
              <div className="w-24 h-24 rounded-2xl bg-black/30 border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-muted cursor-pointer hover:border-accent hover:text-accent transition-colors">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <>
                    <ImageIcon size={28} className="mb-2" />
                    <span className="text-xs">Subir Logo</span>
                  </>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted mb-2">Se mostrará en V-Nexus y Reportes PDF. (Ideal PNG transparente)</p>
                <input 
                  type="url" 
                  className="input text-sm" 
                  placeholder="URL de la imagen (temporal)" 
                  value={settings.logo_url || ''}
                  onChange={e => setSettings({...settings, logo_url: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="input-group">
                <label className="input-label">Nombre Comercial del Hotel</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.hotel_name} 
                  onChange={e => setSettings({...settings, hotel_name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div className="input-group">
                  <label className="input-label">Moneda ID</label>
                  <select 
                    className="select" 
                    value={settings.currency} 
                    onChange={e => setSettings({...settings, currency: e.target.value})}
                  >
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dólar ($)</option>
                    <option value="MXN">Pesos (MXN)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Zona Horaria</label>
                  <select 
                    className="select" 
                    value={settings.timezone} 
                    onChange={e => setSettings({...settings, timezone: e.target.value})}
                  >
                    <option value="Europe/Madrid">Madrid (CET)</option>
                    <option value="America/Mexico_City">México (CST)</option>
                    <option value="America/New_York">New York (EST)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-md">
              <Button type="submit" icon={Save} loading={saving}>Guardar Cambios</Button>
            </div>
          </form>
        )}

        {activeTab === 'textos' && (
          <form onSubmit={handleSave} className="animate-fade-in flex flex-col gap-lg">
            <h3 className="text-xl font-bold mb-md">Personalización de Textos</h3>
            
            <div className="input-group">
              <label className="input-label flex justify-between">
                <span>Mensaje de Bienvenida en V-Nexus</span>
                <span className="text-xs font-normal text-muted">Aparece encima de los botones</span>
              </label>
              <textarea 
                className="input min-h-[120px] resize-y" 
                value={settings.welcome_message}
                onChange={e => setSettings({...settings, welcome_message: e.target.value})}
                placeholder="Ej. Bienvenido a nuestro portal digital. ¿En qué podemos ayudarle hoy?"
              />
            </div>

            <div className="flex justify-end mt-md">
              <Button type="submit" icon={Save} loading={saving}>Guardar Textos</Button>
            </div>
          </form>
        )}

        {activeTab === 'notificaciones' && (
          <div className="animate-fade-in text-center p-xl">
            <Bell size={48} className="text-accent mx-auto mb-md opacity-50" />
            <h3 className="text-xl font-bold mb-2">Reglas de Notificaciones</h3>
            <p className="text-muted">Las notificaciones push están activadas para todos los roles relevantes. Próximamente podrás filtrar qué departamentos reciben qué tipo de avisos por zona.</p>
          </div>
        )}

        {activeTab === 'auditoria' && (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold mb-md flex items-center gap-sm">
              <Shield size={20} className="text-accent"/> Registro de Actividad
            </h3>
            <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="p-3 font-medium text-muted">Fecha y Hora</th>
                    <th className="p-3 font-medium text-muted">Usuario</th>
                    <th className="p-3 font-medium text-muted">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-muted">No hay registros recientes</td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 whitespace-nowrap text-xs text-muted">
                          {new Date(log.created_at).toLocaleString('es-ES')}
                        </td>
                        <td className="p-3">
                          <span className="font-medium">{log.perfiles?.nombre || 'Sistema'}</span>
                          <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-white/10 text-muted uppercase">
                            {log.perfiles?.rol || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-accent">{log.accion}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
