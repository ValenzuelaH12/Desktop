import { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Calendar, ListChecks, CheckCircle2, AlertCircle } from 'lucide-react';
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

export const PreventivePlanManager = ({ 
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
    items_base: ['Cama', 'TV', 'Mesa', 'Teléfono', 'Escritorio', 'Armario', 'Baño', 'Filtros AC']
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
      onMessage({ type: 'error', text: 'El nombre del plan es obligatorio.' });
      return;
    }
    try {
      const { error } = await supabase
        .from('mantenimiento_planes')
        .insert([{
          ...newPlan,
          hotel_id: activeHotelId
        }]);

      if (error) throw error;
      onMessage({ type: 'success', text: 'Plan preventivo creado correctamente.' });
      setIsAdding(false);
      setNewPlan({
        nombre: '',
        frecuencia: 'mensual',
        items_base: ['Cama', 'TV', 'Mesa', 'Teléfono', 'Escritorio', 'Armario', 'Baño', 'Filtros AC']
      });
      onRefresh();
    } catch (err: any) {
      onMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este plan maestro?')) return;
    const { error } = await supabase.from('mantenimiento_planes').delete().eq('id', id);
    if (error) onMessage({ type: 'error', text: error.message });
    else {
      onMessage({ type: 'success', text: 'Plan eliminado.' });
      onRefresh();
    }
  };

  return (
    <div className="space-y-md animate-fade-in">
      <div className="v-page-header border-b border-white/5 bg-white/5 py-4 px-6 mb-0">
        <div className="flex items-center gap-md">
          <div className="p-2 bg-accent/20 text-accent rounded-lg">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-lg font-black text-white tracking-tight uppercase">Planes de Mantenimiento</h3>
        </div>
        <Button size="sm" onClick={() => setIsAdding(true)} icon={Plus} className="bg-accent hover:bg-accent-hover text-white rounded-xl px-6 py-2">
          Nuevo Plan Maestro
        </Button>
      </div>

      {isAdding ? (
        <Card className="p-xl bg-white/[0.02] border-accent/20">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
             <div className="space-y-lg">
                <div className="input-group">
                   <label className="input-label">Nombre del Plan</label>
                   <input 
                     className="v-input bg-white/5" 
                     placeholder="Ej: Checklist Mansual de Habitación"
                     value={newPlan.nombre}
                     onChange={e => setNewPlan({...newPlan, nombre: e.target.value})}
                   />
                </div>
                <div className="input-group">
                   <label className="input-label">Frecuencia de Repeteción</label>
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

             <div className="bg-white/5 p-xl rounded-3xl border border-white/5 space-y-md">
                <div className="flex items-center justify-between">
                   <label className="text-xs font-black uppercase text-muted tracking-widest">Items del Checklist</label>
                   <span className="badge badge-accent text-[9px]">{newPlan.items_base.length} items</span>
                </div>
                
                <div className="flex gap-sm">
                   <input 
                     className="v-input bg-white/5 text-xs py-2" 
                     placeholder="Añadir objeto (ej: Lámpara)..."
                     value={tempItem}
                     onChange={e => setTempItem(e.target.value)}
                     onKeyPress={e => e.key === 'Enter' && handleAddItem()}
                   />
                   <button onClick={handleAddItem} className="p-2 bg-accent text-white rounded-xl"><Plus size={18} /></button>
                </div>

                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                   <div className="flex flex-wrap gap-2">
                      {newPlan.items_base.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 p-2 px-3 rounded-xl text-xs font-bold text-white group">
                          {item}
                          <button onClick={() => handleRemoveItem(i)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                             <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {planes.map(plan => (
            <Card key={plan.id} className="p-xl bg-white/[0.01] hover:bg-white/[0.03] transition-all group border-white/5">
              <div className="flex justify-between items-start mb-md">
                <div className="p-3 bg-accent/10 text-accent rounded-2xl group-hover:scale-110 transition-transform">
                  <ListChecks size={24} />
                </div>
                <button 
                  onClick={() => handleDelete(plan.id)}
                  className="p-2 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h4 className="text-xl font-black mb-xs text-white">{plan.nombre}</h4>
              <div className="flex items-center gap-sm text-xs font-bold text-muted uppercase tracking-widest mb-lg">
                <Calendar size={12} className="text-accent" />
                Frecuencia: <span className="text-white">{plan.frecuencia.toUpperCase()}</span>
              </div>
              <div className="space-y-sm">
                 <p className="text-[10px] font-black text-muted uppercase tracking-widest">Ejemplo de Checklist:</p>
                 <div className="flex flex-wrap gap-1">
                    {plan.items_base.slice(0, 5).map((item: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-muted">{item}</span>
                    ))}
                    {plan.items_base.length > 5 && <span className="text-[10px] text-accent">+{plan.items_base.length - 5}</span>}
                 </div>
              </div>
            </Card>
          ))}
          {planes.length === 0 && (
            <div className="md:col-span-3 py-20 flex flex-col items-center justify-center text-muted border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
               <AlertCircle size={48} className="mb-md opacity-20" />
               <p className="font-black text-sm uppercase tracking-widest opacity-40">No hay planes maestros configurados</p>
               <p className="text-xs">Crea un plan para empezar a generar tareas preventivas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
