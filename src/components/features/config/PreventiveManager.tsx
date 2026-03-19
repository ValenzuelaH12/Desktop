import { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Calendar, ListChecks, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

const FRECUENCIAS = [
  { id: 'diaria', name: 'Diaria' },
  { id: 'semanal', name: 'Semanal' },
  { id: 'quincenal', name: 'Quincenal' },
  { id: 'mensual', name: 'Mensual' },
  { id: 'trimestral', name: 'Trimestral' },
  { id: 'semestral', name: 'Semestral' },
  { id: 'anual', name: 'Anual' },
];

export const PreventiveManager = ({ 
  activeHotelId, 
  onMessage, 
  planes, 
  onRefresh 
}: { 
  activeHotelId: string | null, 
  onMessage: (msg: { type: 'success' | 'error', text: string }) => void,
  planes: any[],
  onRefresh: () => void
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newPlan, setNewPlan] = useState({
    nombre: '',
    frecuencia: 'mensual',
    items_base: ['Revisión Grifos', 'Revisión Luces', 'Prueba TV', 'Limpieza Filtros AC']
  });
  const [tempItem, setTempItem] = useState('');

  const handleAddItem = () => {
    if (!tempItem.trim()) return;
    setNewPlan({ ...newPlan, items_base: [...newPlan.items_base, tempItem.trim()] });
    setTempItem('');
  };

  const handleRemoveItem = (index: number) => {
    const list = [...newPlan.items_base];
    list.splice(index, 1);
    setNewPlan({ ...newPlan, items_base: list });
  };

  const handleSavePlan = async () => {
    if (!newPlan.nombre) {
      onMessage({ type: 'error', text: 'El nombre es obligatorio' });
      return;
    }
    try {
      const { error } = await supabase
        .from('mantenimiento_planes')
        .insert([{ ...newPlan, hotel_id: activeHotelId }]);

      if (error) throw error;
      onMessage({ type: 'success', text: 'Plan preventivo guardado' });
      setIsAdding(false);
      onRefresh();
    } catch (err: any) {
      onMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este plan maestro?')) return;
    const { error } = await supabase.from('mantenimiento_planes').delete().eq('id', id);
    if (error) onMessage({ type: 'error', text: error.message });
    else onRefresh();
  };

  return (
    <div className="space-y-md animate-fade-in">
      <div className="v-page-header bg-white/5 p-6 rounded-[2rem] border border-white/5 mb-xl">
        <div className="flex items-center gap-md">
          <div className="p-3 bg-accent/20 text-accent rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Gestión de Planes Preventivos</h3>
            <p className="text-xs text-muted font-bold tracking-widest uppercase mt-0.5">Define checklists y frecuencias maestras</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setIsAdding(true)} icon={Plus} className="v-btn-accent px-8 py-3 rounded-2xl">
          Nuevo Plan Maestro
        </Button>
      </div>

      {isAdding ? (
        <Card className="p-xl bg-white/[0.02] border-accent/20">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
              <div className="space-y-xl">
                 <div className="input-group">
                    <label className="input-label">Nombre del Plan</label>
                    <input 
                      className="v-input bg-white/5" 
                      placeholder="Ej: Preventivo Mensual Habitaciones"
                      value={newPlan.nombre}
                      onChange={e => setNewPlan({...newPlan, nombre: e.target.value})}
                    />
                 </div>
                 <div className="input-group">
                    <label className="input-label">Frecuencia de Repetición</label>
                    <select 
                      className="v-input bg-white/5"
                      value={newPlan.frecuencia}
                      onChange={e => setNewPlan({...newPlan, frecuencia: e.target.value})}
                    >
                      {FRECUENCIAS.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                 </div>
                 <div className="flex gap-md pt-lg">
                    <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
                    <Button onClick={handleSavePlan}>Guardar Plan Maestro</Button>
                 </div>
              </div>

              <div className="bg-white/5 p-xl rounded-[2.5rem] border border-white/5 space-y-md">
                 <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest">Checklist de Objetos</label>
                    <span className="text-[10px] text-accent font-black">{newPlan.items_base.length} ITEMS</span>
                 </div>
                 <div className="flex gap-sm">
                    <input 
                      className="v-input bg-white/5 text-xs py-3" 
                      placeholder="Ej: Grifería Baño..."
                      value={tempItem}
                      onChange={e => setTempItem(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddItem()}
                    />
                    <button onClick={handleAddItem} className="p-3 bg-accent text-white rounded-2xl"><Plus size={20} /></button>
                 </div>
                 <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {newPlan.items_base.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/5 p-2 px-3 rounded-xl text-xs font-bold text-white group">
                         {item}
                         <button onClick={() => handleRemoveItem(i)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={12} />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
           {planes.map(plan => (
             <Card key={plan.id} className="p-xl bg-white/[0.01] hover:bg-white/[0.03] transition-all group border-white/5">
                <div className="flex justify-between items-start mb-md">
                   <div className="p-3 bg-accent/10 text-accent rounded-2xl">
                      <ListChecks size={24} />
                   </div>
                   <button onClick={() => handleDelete(plan.id)} className="p-2 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={16} />
                   </button>
                </div>
                <h4 className="text-xl font-black text-white mb-xs">{plan.nombre}</h4>
                <div className="flex items-center gap-sm text-[10px] font-black text-muted uppercase tracking-widest mb-lg">
                   <Calendar size={12} className="text-accent" />
                   Frecuencia: <span className="text-white">{plan.frecuencia}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                   {plan.items_base.slice(0, 4).map((item: string, i: number) => (
                     <span key={i} className="px-2 py-1 bg-white/5 rounded-lg text-[9px] text-muted font-bold">{item}</span>
                   ))}
                   {plan.items_base.length > 4 && <span className="text-[9px] text-accent font-black">+{plan.items_base.length - 4} más</span>}
                </div>
             </Card>
           ))}
           {planes.length === 0 && (
             <div className="md:col-span-3 py-20 flex flex-col items-center justify-center text-muted border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                <AlertCircle size={48} className="mb-md opacity-20" />
                <p className="font-black text-sm uppercase tracking-widest opacity-40">No hay planes maestros definidos</p>
                <p className="text-[10px] uppercase font-bold tracking-widest mt-1">Crea uno para empezar a automatizar el preventivo</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
};
