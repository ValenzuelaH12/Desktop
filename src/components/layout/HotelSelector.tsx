import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, ChevronDown, Check } from 'lucide-react';

export const HotelSelector: React.FC = () => {
  const { availableHotels, activeHotelId, setActiveHotelId, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al clickear afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Solo mostrar si es super_admin y hay más de 1 hotel
  if (!profile || profile.rol !== 'super_admin' || !availableHotels || availableHotels.length <= 1) {
    return null;
  }

  const currentHotel = availableHotels.find(h => h.id === activeHotelId) || availableHotels[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
      >
        <div className="bg-accent/20 p-1 rounded">
          <Building2 className="w-4 h-4 text-accent" />
        </div>
        <span className="text-sm font-medium text-white max-w-[150px] truncate">
          {currentHotel?.nombre || 'Hotel Principal'}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full lg:left-0 right-0 mt-2 w-64 bg-[#111128] border border-white/10 rounded-xl shadow-lg shadow-black/50 overflow-hidden z-50 origin-top-right lg:origin-top-left animate-fade-in">
          <div className="p-2 border-b border-white/5">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider px-2 py-1">
              Hoteles Gestionados ({availableHotels.length})
            </h4>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {availableHotels.map(hotel => (
              <button
                key={hotel.id}
                onClick={() => {
                  setActiveHotelId(hotel.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  activeHotelId === hotel.id
                    ? 'bg-accent/20 text-accent font-medium'
                    : 'text-secondary hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`w-2 h-2 rounded-full ${hotel.estado === 'activo' ? 'bg-success' : 'bg-danger/50'}`} />
                  <span className="truncate">{hotel.nombre}</span>
                </div>
                {activeHotelId === hotel.id && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
