import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Wrench
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { preventivoService } from '../services/preventivoService';
import { calendarioService, CalendarEvent } from '../services/calendarioService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

// Utility para generar fechas del mes
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 is Sunday

export default function Calendario() {
  const { activeHotelId } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [preventivos, setPreventivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '',
    descripcion: '',
    color: '#3b82f6'
  });

  // Helper para cambiar mes
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  useEffect(() => {
    fetchData();
  }, [currentDate, activeHotelId]);

  const fetchData = async () => {
    if (!activeHotelId) return;
    setLoading(true);
    
    try {
      // Dia inicial y final del mes actual
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      // Fetch manual events
      try {
        const manualEvents = await calendarioService.getEvents(activeHotelId, startOfMonth, endOfMonth);
        setEvents(manualEvents);
      } catch (err) {
        console.warn('Error fetching events (maybe table missing):', err);
      }

      // Fetch preventive plans and project them onto the month
      const planes = await preventivoService.getTemplates(activeHotelId);
      const projected: any[] = [];
      
      // Proyección básica (Simplificada para demostración: diaria en todos, semanal en lunos, mensual en 1ro)
      // En una implementación real, calcularíamos en base a "ultima_ejecucion" o fecha de inicio real
      planes.forEach(plan => {
          if ((plan as any).estado && (plan as any).estado !== 'activo') return;
          
          const daysInMonth = getDaysInMonth(year, month);
          for (let i = 1; i <= daysInMonth; i++) {
              const date = new Date(year, month, i);
              const isMatch = 
                 (plan.frecuencia === 'diaria') ||
                 (plan.frecuencia === 'semanal' && date.getDay() === 1) || // Lunes
                 (plan.frecuencia === 'mensual' && date.getDate() === 1) || // Día 1
                 (plan.frecuencia === 'trimestral' && date.getDate() === 1 && (month % 3 === 0)) ||
                 (plan.frecuencia === 'semestral' && date.getDate() === 1 && (month % 6 === 0)) ||
                 (plan.frecuencia === 'anual' && date.getDate() === 1 && month === 0);
              
              if (isMatch) {
                  projected.push({
                      id: `prev_${plan.id}_${i}`,
                      titulo: plan.nombre,
                      fecha: date.toISOString(),
                      tipo: 'preventivo',
                      color: '#a855f7' // Purple accent para preventivos
                  });
              }
          }
      });
      setPreventivos(projected);

    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    let firstDay = getFirstDayOfMonth(year, month);
    if (firstDay === 0) firstDay = 7; 

    const blanks = Array.from({ length: firstDay - 1 }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const allEvents = [...events, ...preventivos];
    const today = new Date();

    return (
      <div 
        className="w-full gap-2 sm:gap-3 p-2 md:p-4"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
      >
        {/* Cabeceras de Días */}
        {['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'].map(d => (
          <div key={d} className="pb-4 text-center">
             <span className="text-[9px] md:text-xs font-black tracking-widest uppercase text-gray-400">
               {d}
             </span>
          </div>
        ))}
        
        {/* Espacios vacíos del mes */}
        {blanks.map(blank => (
          <div key={`blank-${blank}`} className="glass rounded-xl opacity-50 border-dashed" style={{ minHeight: '90px' }} />
        ))}
        
        {/* Días del mes animados */}
        {days.map(day => {
          const date = new Date(year, month, day);
          const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
          const dayEvents = allEvents.filter(e => {
            const eDate = new Date(e.fecha);
            return eDate.getDate() === day && eDate.getMonth() === month && eDate.getFullYear() === year;
          });

          return (
            <div 
              key={day} 
              onClick={() => {
                 setSelectedDate(date);
                 setIsModalOpen(true);
              }}
              className={`
                glass p-2 md:p-3 rounded-xl transition-all duration-300 cursor-pointer group flex flex-col
                ${isToday ? 'border-accent shadow-[0_0_15px_rgba(var(--color-accent),0.3)]' : 'hover:-translate-y-1 hover:border-accent hover:shadow-xl'}
              `}
              style={{ minHeight: '90px' }}
            >
              <div className="flex justify-between items-start mb-3">
                 <span className={`
                   text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl
                   ${isToday ? 'bg-accent text-white' : 'bg-dark/50 text-gray-400 group-hover:text-white group-hover:bg-accent/50'}
                 `}>
                   {day}
                 </span>
                 
                 <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white transition-all">
                    <Plus size={14} />
                 </div>
              </div>
              
              <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                 {dayEvents.map(ev => (
                    <div 
                      key={ev.id} 
                      className="text-xs truncate px-2 py-1 rounded-lg font-bold flex items-center gap-1.5"
                      style={{ 
                        backgroundColor: `${ev.color}20`, 
                        color: ev.color, 
                        border: `1px solid ${ev.color}40` 
                      }}
                    >
                      {ev.tipo === 'preventivo' ? (
                        <Wrench size={10} className="shrink-0" />
                      ) : (
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                      )}
                      <span className="truncate">{ev.titulo}</span>
                    </div>
                 ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <CalendarIcon className="text-accent" size={32} /> Calendario Operativo
          </h1>
          <p className="text-muted mt-2">Gestiona eventos manuales y visualiza mantenimientos programados.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
          <Button variant="ghost" onClick={prevMonth} className="p-2 hover:bg-white/10">
            <ChevronLeft size={20} />
          </Button>
          <span className="text-lg font-bold w-40 text-center uppercase tracking-widest">
            {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="ghost" onClick={nextMonth} className="p-2 hover:bg-white/10">
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      <div className="bg-dark/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-dark/80 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent" />
          </div>
        )}
        
        {renderCalendarDays()}
      </div>

      <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-muted mt-8">
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3b82f6]" /> EVENTOS MANUALES</div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#a855f7]" /> PLANES PREVENTIVOS AUTOMÁTICOS</div>
      </div>

      {isModalOpen && selectedDate && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title={`Nuevo Evento: ${selectedDate.toLocaleDateString()}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Título del Evento</label>
              <input 
                type="text" 
                className="w-full bg-dark border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-accent"
                placeholder="Ej. Revisión Externa"
                value={nuevoEvento.titulo}
                onChange={e => setNuevoEvento({...nuevoEvento, titulo: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Descripción</label>
              <textarea 
                className="w-full bg-dark border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-accent"
                placeholder="Detalles opcionales..."
                rows={3}
                value={nuevoEvento.descripcion}
                onChange={e => setNuevoEvento({...nuevoEvento, descripcion: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Color de Etiqueta</label>
              <input 
                type="color" 
                className="w-full h-10 bg-dark border border-white/10 rounded-lg p-1"
                value={nuevoEvento.color}
                onChange={e => setNuevoEvento({...nuevoEvento, color: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={async () => {
                if (!nuevoEvento.titulo.trim() || !activeHotelId) return;
                try {
                   const ev = await calendarioService.createEvent({
                     hotel_id: activeHotelId,
                     titulo: nuevoEvento.titulo,
                     descripcion: nuevoEvento.descripcion,
                     color: nuevoEvento.color,
                     tipo: 'evento',
                     fecha: selectedDate.toISOString(),
                     creado_por: 'user' // el trigger/RLS auto asignaría
                   });
                   setEvents([...events, ev]);
                   setIsModalOpen(false);
                   setNuevoEvento({ titulo: '', descripcion: '', color: '#3b82f6' });
                } catch (e) {
                   console.error('Error insertando evento', e);
                }
              }}>Guardar Evento</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
