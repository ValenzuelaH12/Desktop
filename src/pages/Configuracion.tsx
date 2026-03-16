import { useState, useEffect } from 'react';
import { 
  Users, Hotel, Settings, Package, QrCode, Smartphone, Activity, Calendar, 
  Layers, MapPin, Check, X, Bell
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UserManager } from '../components/features/config/UserManager';
import { AssetManager } from '../components/features/config/AssetManager';
import { ZoneManager } from '../components/features/config/ZoneManager';
import { MeterManager } from '../components/features/config/MeterManager';
import { MaintenanceManager } from '../components/features/config/MaintenanceManager';
import { NexusConfig } from '../components/features/config/NexusConfig';
import { configService as configApi } from '../services/configService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const TABS = [
  { id: 'usuarios', name: 'Usuarios', icon: Users },
  { id: 'zonas', name: 'Zonas y Habs', icon: Layers },
  { id: 'activos', name: 'Activos / QR', icon: Package },
  { id: 'contadores', name: 'Contadores', icon: Activity },
  { id: 'mantenimiento', name: 'Mantenimiento', icon: Calendar },
  { id: 'v-nexus', name: 'V-Nexus', icon: Smartphone },
  { id: 'ajustes', name: 'Ajustes', icon: Settings },
];

export default function Configuracion() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | '', text: string }>({ type: '', text: '' });
  
  // Centralized data state
  const [data, setData] = useState({
    users: [],
    zonas: [],
    habitaciones: [],
    activos: [],
    contadores: [],
    mantenimiento: [],
    plantillas: []
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [users, zonas, habitaciones, activos, contadores, mantenimiento, plantillas] = await Promise.all([
        configApi.getUsers(),
        configApi.getZones(),
        configApi.getRooms(),
        configApi.getAssets(),
        configApi.getCounters(),
        supabase.from('mantenimiento_preventivo').select('*').order('frecuencia'), // Fallback for specific table
        supabase.from('mantenimiento_plantillas').select('*').order('nombre')
      ]);

      setData({
        users,
        zonas,
        habitaciones,
        activos,
        contadores,
        mantenimiento: mantenimiento.data || [],
        plantillas: plantillas.data || []
      });
    } catch (error) {
      console.error(error);
      setMsg({ type: 'error', text: 'Error al sincronizar datos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const showMsg = (m: { type: 'success' | 'error', text: string }) => {
    setMsg(m);
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  if (loading && data.users.length === 0) {
    return (
      <div className="flex items-center justify-center min-height-screen">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="config-container p-md md:p-xl animate-fade-in">
      {/* Toast Notification */}
      {msg.text && (
        <div className={`toast ${msg.type === 'error' ? 'toast-danger' : 'toast-success'} animate-slide-right`}>
          <div className="flex items-center gap-sm">
            {msg.type === 'error' ? <X size={20} /> : <Check size={20} />}
            <span>{msg.text}</span>
          </div>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-xl">
        <div>
          <h1 className="page-title mb-xs">Configuración del Sistema</h1>
          <p className="text-muted text-sm">Gestión técnica y operativa de {profile?.hotel || 'el hotel'}</p>
        </div>
        <div className="flex items-center gap-sm">
           <div className="stat-card glass p-sm px-md rounded-xl border border-white/5">
             <span className="text-xs text-muted uppercase font-bold tracking-tighter">Estado Sync</span>
             <div className="flex items-center gap-xs">
               <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
               <span className="text-sm font-bold text-white uppercase">Conectado</span>
             </div>
           </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="config-layout">
        {/* Navigation Sidebar */}
        <aside className="config-sidebar glass-card p-sm h-fit sticky top-xl">
          <nav className="flex flex-col gap-xs">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`config-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{tab.name}</span>
                  {activeTab === tab.id && <div className="nav-indicator" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="config-main">
          {activeTab === 'usuarios' && (
            <UserManager currentUserProfile={profile} onMessage={showMsg} />
          )}
          
          {activeTab === 'zonas' && (
            <ZoneManager 
              zones={data.zonas} 
              rooms={data.habitaciones} 
              onMessage={showMsg} 
              onRefresh={fetchAll} 
            />
          )}

          {activeTab === 'activos' && (
            <AssetManager 
              zones={data.zonas} 
              onMessage={showMsg} 
            />
          )}

          {activeTab === 'contadores' && (
            <MeterManager 
              counters={data.contadores} 
              onMessage={showMsg} 
              onRefresh={fetchAll} 
            />
          )}

          {activeTab === 'mantenimiento' && (
            <MaintenanceManager 
              maintenance={data.mantenimiento} 
              templates={data.plantillas} 
              onMessage={showMsg} 
              onRefresh={fetchAll} 
            />
          )}

          {activeTab === 'v-nexus' && (
            <NexusConfig 
              rooms={data.habitaciones} 
              zones={data.zonas} 
            />
          )}

          {activeTab === 'ajustes' && (
            <Card className="p-xl text-center">
              <div className="bg-accent/10 w-fit p-lg rounded-full mx-auto mb-lg">
                <Settings size={48} className="text-accent" />
              </div>
              <h2 className="text-xl font-bold mb-sm">Ajustes Globales</h2>
              <p className="text-muted mb-xl">Panel de administración general del hotel y preferencias del sistema.</p>
              <Button variant="secondary" size="lg">Próximamente</Button>
            </Card>
          )}
        </main>
      </div>

      <style>{`
        .config-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: var(--spacing-xl);
          align-items: start;
        }

        .config-nav-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: 0.875rem 1.25rem;
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-weight: 500;
          transition: all var(--transition-fast);
          position: relative;
          text-align: left;
          width: 100%;
        }

        .config-nav-btn:hover {
          background: var(--color-bg-glass);
          color: var(--color-text-primary);
        }

        .config-nav-btn.active {
          background: var(--color-accent-light);
          color: var(--color-accent-hover);
        }

        .nav-indicator {
          position: absolute;
          right: 12px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-accent);
          box-shadow: 0 0 10px var(--color-accent);
        }

        @media (max-width: 1024px) {
          .config-layout {
            grid-template-columns: 1fr;
          }
          .config-sidebar {
            position: static;
            margin-bottom: var(--spacing-lg);
          }
          .config-sidebar nav {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: var(--spacing-sm);
          }
          .config-nav-btn {
            white-space: nowrap;
            padding: 0.625rem 1rem;
          }
          .nav-indicator {
            bottom: 4px;
            right: 50%;
            transform: translateX(50%);
          }
        }
      `}</style>
    </div>
  );
}
