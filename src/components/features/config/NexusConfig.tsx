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
    <div className="animate-fade-in space-y-6">
      <div className="bg-slate-900/40 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-md">
        {/* Header Section: Solid & Structured */}
        <div className="bg-indigo-600 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-xl backdrop-blur-sm">
                <Smartphone size={28} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">V-Nexus</h3>
                <p className="text-[10px] md:text-xs font-bold text-indigo-100 uppercase tracking-[0.2em] opacity-80 mt-1">Portal Digital de Activos</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button 
                onClick={handleTestNotification}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all active:scale-95"
              >
                <RefreshCw size={16} />
                <span>Probar</span>
              </button>
              <button 
                onClick={handleSubscribe}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95
                  ${pushSubscription 
                    ? 'bg-success text-white shadow-lg shadow-success/20 cursor-default' 
                    : 'bg-white text-indigo-600 shadow-xl hover:translate-y-[-2px]'}
                `}
              >
                <Bell size={16} className={pushSubscription ? '' : 'animate-bounce'} />
                <span>{pushSubscription ? 'V-Push Activo' : 'Activar V-Push'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar: Full width on mobile */}
        <div className="p-4 md:p-6 bg-slate-800/50 border-b border-white/5">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:max-w-md">
              <input 
                type="text" 
                placeholder="Buscar habitación por nombre o número..." 
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-muted"
                value={nexusSearchQuery}
                onChange={e => setNexusSearchQuery(e.target.value)}
              />
            </div>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
              <DoorOpen size={16} className="text-indigo-400" />
              <span className="text-sm font-bold text-white">{rooms.length} <span className="text-muted font-normal">Puntos de Acceso</span></span>
            </div>
          </div>
        </div>

        {/* Token Section (If active) */}
        {pushSubscription && (
          <div className="px-6 py-4 bg-indigo-500/5 border-b border-white/5 flex flex-col items-center justify-between gap-4 animate-fade-in sm:flex-row">
            <div className="flex items-center gap-4 w-full min-w-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Share2 size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Token V-Push Guardado</span>
                <span className="text-[10px] text-muted font-mono break-all line-clamp-2 mt-0.5">
                  {JSON.stringify(pushSubscription)}
                </span>
              </div>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(pushSubscription));
                toast.info('Token copiado al portapapeles');
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase hover:bg-indigo-500/20 transition-all"
            >
              <Copy size={14} /> Copiar
            </button>
          </div>
        )}

        {/* Floor Navigation: Improved scrolling */}
        <div className="bg-slate-900/60 p-5 border-b border-white/5 overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <span className="text-[10px] font-black uppercase text-muted tracking-[0.2em] whitespace-nowrap mb-1 md:mb-0">Plantas</span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 w-full">
              {floors.map(floor => (
                <button 
                  key={floor}
                  onClick={() => { setActiveFloor(floor); setSelectedNexusZona('all'); }}
                  className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tighter whitespace-nowrap transition-all
                    ${activeFloor === floor 
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'}
                  `}
                >
                  Planta {floor}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Zone Filter: Chips structured */}
        <div className="bg-slate-900/80 p-5 md:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">
              <MapPin size={12} />
              <span>Zonas</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 w-full flex-nowrap md:flex-wrap">
              <button 
                onClick={() => setSelectedNexusZona('all')}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all border whitespace-nowrap
                  ${selectedNexusZona === 'all' 
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                    : 'bg-white/5 border-transparent text-muted hover:bg-white/10'}
                `}
              >
                Todas las Zonas
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
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all border whitespace-nowrap
                    ${selectedNexusZona === z.id 
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                      : 'bg-white/5 border-transparent text-muted hover:bg-white/10'}
                  `}
                >
                  {z.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredRooms.map((h: any) => {
          const zonaName = zones.find((z: any) => z.id === h.zona_id)?.nombre || 'General';
          const portalUrl = `${window.location.origin}/guest/${activeHotelId || 'default'}/${h.nombre}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(portalUrl)}`;
          
          return (
            <div key={h.id} className="bg-slate-900/60 border border-white/10 rounded-3xl p-5 flex flex-col gap-4 group hover:bg-slate-900/80 transition-all shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-500/30">
              <div className="flex justify-between items-start">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">Portal Activo</span>
                  </div>
                  <h4 className="text-xl font-black text-white tracking-tighter">HAB. {h.nombre}</h4>
                  <div className="mt-2 py-1 px-3 bg-white/5 rounded-lg border border-white/5 w-fit">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">{zonaName}</span>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(qrUrl, '_blank')}
                  className="w-16 h-16 bg-white rounded-2xl p-1.5 shadow-2xl hover:scale-110 transition-transform active:scale-95 flex-shrink-0"
                >
                  <img src={qrUrl} alt={`QR ${h.nombre}`} className="w-full h-full rounded-xl" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button 
                  className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold text-white uppercase tracking-tighter hover:bg-white/10 transition-all active:scale-95"
                  onClick={() => { 
                    navigator.clipboard.writeText(portalUrl); 
                    toast.success('URL copiada al portapapeles'); 
                  }}
                >
                  <Copy size={16} className="text-muted" /> <span>Copiar Link</span>
                </button>
                <a 
                  href={qrUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center justify-center gap-2 h-10 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <BookOpen size={16} /> <span>Ver QR</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
