import React, { useState, useEffect } from 'react';
import { Smartphone, Plus, DoorOpen, MapPin, QrCode, RefreshCw, BookOpen, Bell, Share2, Copy } from 'lucide-react';
import { Room, Zone } from '../../../types';
import { Card } from '../../ui/Card';
import { useNotifications } from '../../../context/NotificationContext';
import { useToast } from '../../Toast';

interface NexusConfigProps {
  rooms: Room[];
  zones: Zone[];
  activeHotelId?: string | null;
}

export const NexusConfig: React.FC<NexusConfigProps> = ({ 
  rooms, 
  zones,
  activeHotelId
}) => {
  const [activeFloor, setActiveFloor] = useState('1');
  const [selectedNexusZona, setSelectedNexusZona] = useState('all');
  const [nexusSearchQuery, setNexusSearchQuery] = useState('');
  
  const { subscribeToPush, pushSubscription, sendNotification } = useNotifications();
  const toast = useToast();

  const handleTestNotification = () => {
    sendNotification('[V-NEXUS] PRUEBA DE SISTEMA', {
      body: 'Si ves esto, las notificaciones críticas están activas y configuradas correctamente.',
      tag: 'nexus-test',
      icon: '/pwa-512x512.png',
      requireInteraction: true
    });
    toast.info('Enviando notificación de prueba...');
  };

  // Heuristic floor detection
  const floors = Array.from(new Set(rooms.map(h => {
    const match = h.nombre.match(/^\d/);
    return match ? match[0] : 'Otros';
  }))).sort();

  useEffect(() => {
    if (floors.length > 0 && !floors.includes(activeFloor)) {
      setActiveFloor(floors[0]);
    }
  }, [rooms]);

  const handleSubscribe = async () => {
    const sub = await subscribeToPush();
    if (sub) {
      toast.success('V-Push Activo: Notificaciones configuradas en este dispositivo 📱');
    } else {
      toast.error('Error al activar. Asegúrate de dar permisos de notificación.');
    }
  };

  const filteredRooms = rooms.filter(h => {
    const floorMatch = h.nombre.match(/^\d/);
    const roomFloor = floorMatch ? floorMatch[0] : 'Otros';
    const matchesFloor = roomFloor === activeFloor;
    const matchesZona = selectedNexusZona === 'all' || h.zona_id === selectedNexusZona;
    const matchesSearch = h.nombre.toLowerCase().includes(nexusSearchQuery.toLowerCase());
    return matchesFloor && matchesZona && matchesSearch;
  });

  return (
    <div className="animate-fade-in space-y-xl">
      <div className="v-glass-card p-none overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="v-page-header border-b border-white/5 bg-white/5 p-xl relative z-10 mb-0">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-white uppercase">V-Nexus: Portal Digital</h3>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Despliegue de inteligencia ambiental mediante QR</p>
              </div>
            </div>
            <div className="flex gap-md">
              <button 
                onClick={handleTestNotification}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-white/5 border border-white/10 text-muted hover:text-white hover:bg-white/10 transition-all"
              >
                <RefreshCw size={14} />
                Probar
              </button>
              <button 
                onClick={handleSubscribe}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                  ${pushSubscription 
                    ? 'bg-success/20 text-success border border-success/30 cursor-default' 
                    : 'bg-accent text-white shadow-lg shadow-accent/20 hover:scale-105 active:scale-95'}
                `}
              >
                <Bell size={14} className={pushSubscription ? '' : 'animate-bounce'} />
                {pushSubscription ? 'V-Push Activo' : 'Activar V-Push (Móvil)'}
              </button>
              <div className="nexus-search relative">
                <input 
                  type="text" 
                  placeholder="Buscar habitación..." 
                  className="nexus-search-input"
                  value={nexusSearchQuery}
                  onChange={e => setNexusSearchQuery(e.target.value)}
                />
              </div>
              <div className="stat-pill">
                <DoorOpen size={14} className="text-indigo-400" />
                <span className="font-bold">{rooms.length}</span>
                <span className="text-xs text-muted">Habitaciones</span>
              </div>
            </div>
          </div>
        </div>

        {pushSubscription && (
          <div className="p-4 bg-accent/5 border-b border-white/5 relative z-10 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <Share2 size={16} className="text-accent" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase tracking-tighter">Token de Dispositivo V-Push</span>
                <span className="text-[9px] text-muted font-mono truncate max-w-[400px]">
                  {JSON.stringify(pushSubscription)}
                </span>
              </div>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(pushSubscription));
                toast.info('Token copiado al portapapeles');
              }}
              className="btn btn-ghost p-2"
              title="Copiar Token"
            >
              <Copy size={14} />
            </button>
          </div>
        )}

        <div className="floor-nav-bar p-md bg-black/20 relative z-10 flex items-center gap-md border-b border-white/5">
          <span className="text-[10px] font-black uppercase text-muted tracking-widest pl-md">Plantas:</span>
          <div className="flex gap-sm overflow-x-auto no-scrollbar py-sm">
            {floors.map(floor => (
              <button 
                key={floor}
                onClick={() => { setActiveFloor(floor); setSelectedNexusZona('all'); }}
                className={`floor-btn ${activeFloor === floor ? 'active' : ''}`}
              >
                Planta {floor}
              </button>
            ))}
          </div>
        </div>

        <div className="zone-filter-bar p-md px-xl flex items-center gap-lg relative z-10 bg-black/10">
          <div className="flex items-center gap-2 text-xs text-indigo-300 font-bold">
            <MapPin size={12} />
            <span>Filtrar Zona:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={() => setSelectedNexusZona('all')}
              className={`filter-chip ${selectedNexusZona === 'all' ? 'active' : ''}`}
            >
              Todas
            </button>
            {zones.filter(z => 
              rooms.some(h => {
                const floorMatch = h.nombre.match(/^\d/);
                const roomFloor = floorMatch ? floorMatch[0] : 'Otros';
                return roomFloor === activeFloor && h.zona_id === z.id;
              })
            ).map(z => (
              <button 
                key={z.id}
                onClick={() => setSelectedNexusZona(z.id)}
                className={`filter-chip ${selectedNexusZona === z.id ? 'active' : ''}`}
              >
                {z.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-xl">
        {filteredRooms.map((h: any) => {
          const zonaName = zones.find((z: any) => z.id === h.zona_id)?.nombre || 'General';
          const portalUrl = `${window.location.origin}/guest/${activeHotelId || 'default'}/${h.nombre}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(portalUrl)}`;
          
          return (
            <div key={h.id} className="v-glass-card hover:border-accent/40 transition-all p-5 flex flex-col gap-4 group">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">Punto de Acceso</span>
                  <h4 className="text-xl font-black text-white tracking-tighter mt-1">HAB. {h.nombre}</h4>
                  <span className="text-[9px] font-bold text-muted bg-white/5 py-1 px-2 rounded-md w-fit mt-2 border border-white/5 uppercase tracking-tighter">{zonaName}</span>
                </div>
                <div className="w-16 h-16 bg-white rounded-xl p-1 shadow-lg hover:scale-110 transition-transform cursor-pointer" onClick={() => window.open(qrUrl, '_blank')}>
                  <img src={qrUrl} alt={`QR ${h.nombre}`} className="w-full h-full rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button 
                  className="flex items-center justify-center gap-2 h-9 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-muted uppercase tracking-tighter hover:bg-white/10 hover:text-white transition-all"
                  onClick={() => { navigator.clipboard.writeText(portalUrl); alert('URL Copiada'); }}
                >
                  <RefreshCw size={12} /> <span>Link</span>
                </button>
                <a 
                  href={qrUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center justify-center gap-2 h-9 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all"
                >
                  <BookOpen size={12} /> <span>Ver QR</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
