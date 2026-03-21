import { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { preventivoService } from '../services/preventivoService';
import { PreventiveRevision } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { InspeccionChecklist } from '../components/features/inspections/InspeccionChecklist';
import { InspectionReport } from '../components/features/inspections/InspectionReport';
import { BulkInspectionReport } from '../components/features/inspections/BulkInspectionReport';

export default function Inspecciones() {
  const { activeHotelId, user } = useAuth();
  const [revisions, setRevisions] = useState<PreventiveRevision[]>([]);
  const [completedRevisions, setCompletedRevisions] = useState<PreventiveRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRevision, setActiveRevision] = useState<PreventiveRevision | null>(null);
  const [reportRevisionId, setReportRevisionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'habitacion' | 'zona' | 'activo'>('all');
  
  // Estados de navegación
  const [viewMode, setViewMode] = useState<'plans' | 'revisions' | 'history'>('plans');
  const [historyRevisions, setHistoryRevisions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [bulkRevisionIds, setBulkRevisionIds] = useState<string[] | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const fetchData = async () => {
    if (!activeHotelId) return;
    setLoading(true);
    try {
      await preventivoService.reconcileRevisions(activeHotelId);
      const [pending, completed] = await Promise.all([
        preventivoService.getPendingRevisions(activeHotelId),
        preventivoService.getRecentRevisions(activeHotelId)
      ]);
      setRevisions(pending);
      setCompletedRevisions(completed);
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeHotelId]);

  const handleStart = async (rev: PreventiveRevision) => {
    try {
      if (!user) return;
      await preventivoService.startRevision(rev.id, user.id);
      setActiveRevision(rev);
    } catch (error) {
       console.error('Error starting revision:', error);
    }
  };

  // Agrupar revisiones por Plan (Solo para la vista de Planes)
  const plansMap = revisions.reduce((acc: any, rev) => {
    const planId = rev.plantilla_id;
    if (!acc[planId]) {
      acc[planId] = {
        id: planId,
        nombre: rev.plantilla?.nombre || 'Plan sin nombre',
        frecuencia: rev.plantilla?.frecuencia || 'varias',
        count: 0,
        revisions: []
      };
    }
    acc[planId].count++;
    acc[planId].revisions.push(rev);
    return acc;
  }, {});

  const plansList = Object.values(plansMap) as any[];

  // Filtrado final según pestaña activa
  const listToFilter = activeTab === 'pending' 
    ? (selectedPlanId ? plansMap[selectedPlanId]?.revisions || [] : [])
    : (selectedPlanId ? completedRevisions.filter(r => r.plantilla_id === selectedPlanId) : completedRevisions);

  const filteredRevisions = listToFilter.filter((rev: any) => {
    const matchesSearch = rev.ubicacion_nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || rev.entidad_tipo === filterType;
    return matchesSearch && matchesType;
  });

  if (activeRevision) {
    return (
      <InspeccionChecklist 
        revision={activeRevision}
        onComplete={() => {
          setActiveRevision(null);
          // Cambiar a completadas automáticamente al terminar una
          setActiveTab('completed');
          fetchData();
        }}
        onCancel={() => setActiveRevision(null)}
      />
    );
  }

  if (!activeHotelId) {
    return (
      <div className="flex flex-col items-center justify-center p-xl text-muted h-[60vh]">
        <AlertCircle size={48} className="mb-md opacity-20" />
        <p className="font-bold">Acceso Denegado</p>
        <p className="text-sm">Selecciona un hotel para ver las inspecciones.</p>
      </div>
    );
  }

  return (
    <div className="p-md md:p-xl space-y-lg animate-fade-in max-w-5xl mx-auto pb-[100px]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-sm">
            <ClipboardCheck className="text-accent" size={28} />
            Inspecciones
          </h1>
          <p className="text-secondary text-sm">
            {viewMode === 'plans' && 'Selecciona un plan de trabajo'}
            {viewMode === 'revisions' && `Tareas de ${plansMap[selectedPlanId!]?.nombre}`}
            {viewMode === 'history' && 'Historial Global de Preventivos'}
          </p>
        </div>
        
        {viewMode === 'plans' ? (
          <Button 
            variant="ghost" 
            className="hidden md:flex bg-accent/10 border-accent/20 text-accent hover:bg-accent hover:text-white transition-all shadow-lg"
            onClick={async () => {
              setViewMode('history');
              if (historyRevisions.length === 0) {
                 setLoadingHistory(true);
                 if (activeHotelId) {
                   const groupedHistory = await preventivoService.getGroupedHistory(activeHotelId);
                   setHistoryRevisions(groupedHistory);
                 }
                 setLoadingHistory(false);
              }
            }}
          >
            <History size={18} className="mr-2" /> Ver Historial Completo
          </Button>
        ) : (
          <div className="bg-accent/10 p-md rounded-xl border border-accent/20 hidden md:block text-right">
             <div className="text-[10px] font-bold text-accent uppercase tracking-widest">Tareas Totales</div>
             <div className="text-2xl font-black text-white">
               {viewMode === 'history' ? historyRevisions.length : revisions.length}
             </div>
          </div>
        )}
      </div>

      {/* Navegación y Filtros */}
      <div className="flex flex-col md:flex-row gap-6">
        {(viewMode === 'revisions' || viewMode === 'history') && (
          <Button 
            variant="secondary" 
            onClick={() => {
              setViewMode('plans');
              setSelectedPlanId(null);
              setActiveTab('pending');
              setSearchTerm('');
            }}
            className="w-full md:w-auto bg-white/5 border-white/10"
          >
            ← Volver a Planes
          </Button>
        )}
        
        {viewMode === 'revisions' && (
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 self-start">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pending' ? 'bg-accent text-white shadow-lg' : 'text-muted hover:text-white'
              }`}
            >
              PENDIENTES ({plansMap[selectedPlanId!]?.count || 0})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'completed' ? 'bg-success text-white shadow-lg' : 'text-muted hover:text-white'
              }`}
            >
              COMPLETADAS ({completedRevisions.filter(r => r.plantilla_id === selectedPlanId).length})
            </button>
          </div>
        )}

        {(viewMode === 'revisions' || viewMode === 'history') && (
          <div className="flex-1 flex flex-col md:flex-row gap-md">
            <div className="v-glass-card flex-1 p-sm flex items-center gap-sm border-white/5">
              <Search className="text-muted ml-sm" size={18} />
              <input 
                placeholder={viewMode === 'history' ? "Buscar ubicación, activo o plan..." : "Buscar ubicación..."}
                className="bg-transparent border-none text-white p-sm flex-1 focus:outline-none placeholder:text-muted/50"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid de Contenido */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {Array(6).fill(0).map((_, i) => (
             <Card key={i} className="h-32 animate-pulse bg-white/5 border-white/5"><div /></Card>
          ))}
        </div>
      ) : viewMode === 'plans' ? (
        /* VISTA DE PLANES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plansList.length > 0 ? (
            plansList.map(plan => (
              <Card 
                key={plan.id} 
                className="group relative overflow-hidden bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-accent/40 transition-all cursor-pointer p-0"
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  setViewMode('revisions');
                  setActiveTab('pending');
                }}
              >
                <div className="p-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-accent/10 rounded-2xl text-accent group-hover:scale-110 transition-transform">
                      <ShieldCheck size={24} />
                    </div>
                    <span className="text-[10px] font-bold bg-white/5 px-3 py-1 rounded-full text-secondary uppercase tracking-widest">
                      {plan.frecuencia}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors">{plan.nombre}</h3>
                    <p className="text-sm text-muted mt-2">
                       {plan.count} tareas {plan.count === 1 ? 'pendiente' : 'pendientes'}
                    </p>
                  </div>

                  <div className="pt-4 flex items-center text-accent text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Abrir revisiones <ChevronRight size={16} className="ml-1" />
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 h-1 bg-accent/20 w-full" />
                <div className="absolute bottom-0 left-0 h-1 bg-accent w-1/3" />
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-24 bg-white/5 rounded-3xl border-2 border-dashed border-white/10">
              <ClipboardCheck size={64} className="mx-auto mb-md opacity-10" />
              <h3 className="font-bold text-white/50 text-xl tracking-tight">¡Sin planes activos!</h3>
              <p className="text-sm text-muted max-w-xs mx-auto mt-xs">No hay trabajos preventivos programados para hoy.</p>
            </div>
          )}
        </div>
      ) : viewMode === 'revisions' ? (
        /* VISTA DE REVISIONES (PENDIENTES O COMPLETADAS) */
        <div className="animate-fade-in">
          {filteredRevisions.length > 0 ? (
            <div className="space-y-12">
              {Object.entries(
                filteredRevisions.reduce((acc: Record<string, any[]>, rev: any) => {
                  const tipo = rev.entidad_tipo || 'otros';
                  if (!acc[tipo]) acc[tipo] = [];
                  acc[tipo].push(rev);
                  return acc;
                }, {})
              ).map(([tipo, revs]: [string, any[]]) => (
                <div key={tipo} className="space-y-4">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest pl-3 py-1 border-l-2 border-accent">
                    {tipo === 'habitacion' ? 'Habitaciones' : tipo === 'zona' ? 'Zonas Comunes' : 'Activos & Equipos'} ({revs.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {revs.map((rev: any) => (
                      <Card 
                        key={rev.id} 
                        className={`group relative transition-all border-white/5 overflow-hidden flex flex-col p-0 ${
                          activeTab === 'completed' ? 'bg-white/[0.02] opacity-80 shadow-none' : 'bg-white/[0.04] hover:bg-white/[0.08] hover:border-accent/40 shadow-xl'
                        }`}
                      >
                        <div className={`absolute top-0 left-0 w-full h-1 ${
                          activeTab === 'completed' 
                            ? (rev.estado === 'fallida' ? 'bg-danger' : 'bg-success') 
                            : (rev.estado === 'en_proceso' ? 'bg-accent' : 'bg-warning')
                        }`} />
                        
                        <div className="p-xl flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold bg-white/5 px-3 py-1 rounded-full text-secondary uppercase tracking-widest">
                              {rev.entidad_tipo}
                            </span>
                            {activeTab === 'completed' ? (
                              <span className={`text-[10px] font-black uppercase tracking-widest ${rev.estado === 'fallida' ? 'text-danger' : 'text-success'}`}>
                                {rev.estado === 'fallida' ? 'FALLIDA' : 'OK'}
                              </span>
                            ) : (
                              <span className={`text-[10px] font-black uppercase tracking-widest ${rev.estado === 'en_proceso' ? 'text-accent' : 'text-warning'}`}>
                                {rev.estado === 'en_proceso' ? 'EN CURSO' : 'PENDIENTE'}
                              </span>
                            )}
                          </div>
                          
                          <h3 className={`text-xl font-bold mb-2 ${activeTab === 'pending' ? 'group-hover:text-accent' : 'text-white'} transition-colors`}>
                            {rev.ubicacion_nombre}
                          </h3>
                          
                          {activeTab === 'completed' && (
                            <div className="text-xs text-muted mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                               <span>{new Date(rev.completado_el).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                               <span className="italic">{rev.ejecutor?.nombre || 'Técnico'}</span>
                            </div>
                          )}
                        </div>

                        {activeTab === 'pending' && (
                          <div className="p-4 bg-white/5 border-t border-white/5">
                            <Button onClick={() => handleStart(rev)} className="w-full btn-sm shadow-lg shadow-accent/20">
                              <span>{rev.estado === 'en_proceso' ? 'Continuar Tarea' : 'Comenzar Inspección'}</span>
                              <ChevronRight size={16} />
                            </Button>
                          </div>
                        )}

                        {activeTab === 'completed' && (
                          <div className="p-3 bg-white/5 border-t border-white/5 flex justify-center">
                            <Button 
                              variant="ghost" 
                              onClick={() => setReportRevisionId(rev.id)}
                              className="w-full text-accent hover:bg-accent/10 text-xs py-1 h-auto"
                            >
                              <FileText size={14} className="mr-2" /> Ver Reporte Generado
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white/5 rounded-3xl border-white/5">
              <ClipboardCheck size={48} className="mx-auto mb-md opacity-20" />
              <p className="text-muted">
                {activeTab === 'pending' 
                  ? '¡Magnífico! No quedan tareas pendientes.' 
                  : 'Aún no has completado tareas hoy.'}
              </p>
            </div>
          )}
        </div>
      ) : viewMode === 'history' ? (
        /* VISTA DE HISTORIAL GLOBAL AGRUPADO POR CICLO */
        <div className="animate-fade-in">
          {loadingHistory ? (
             <div className="text-center py-24 text-muted"><div className="animate-spin rounded-full h-8 w-8 border-4 border-accent border-t-transparent mx-auto mb-4" />Generando grupos del historial...</div>
          ) : historyRevisions.filter((group: any) => 
               group.plantilla_nombre.toLowerCase().includes(searchTerm.toLowerCase())
              ).length > 0 ? (
            <div className="space-y-8">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest pl-3 py-1 border-l-2 border-accent">
                Ciclos Completados (Por Plan)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {historyRevisions.filter((group: any) => 
                  group.plantilla_nombre.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((group: any) => (
                  <Card 
                    key={group.id} 
                    className="group relative transition-all border-white/5 overflow-hidden flex flex-col p-0 bg-white/[0.04] hover:bg-white/[0.08] hover:border-accent/40 shadow-xl"
                  >
                    <div className={`absolute top-0 left-0 w-full h-1 ${group.tareas_fallidas > 0 ? 'bg-warning' : 'bg-success'}`} />
                    
                    <div className="p-xl flex-1 flex flex-col">
                      <div className="flex flex-col gap-2 mb-4">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] text-accent font-bold bg-accent/10 px-3 py-1 rounded-full uppercase tracking-widest truncate max-w-[80%] border border-accent/20">
                            {new Date(group.fecha_ciclo).toLocaleDateString()}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${group.tareas_fallidas > 0 ? 'text-warning' : 'text-success'}`}>
                            {group.tareas_fallidas === 0 ? '100% ÉXITO' : `${group.tareas_fallidas} CON FALLOS`}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-black mb-2 text-white group-hover:text-accent transition-colors">
                        {group.plantilla_nombre}
                      </h3>
                      <p className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest">
                         {group.total_tareas} TAREAS EJECUTADAS
                      </p>
                      
                      <div className="text-xs text-muted mt-auto pt-4 flex flex-col gap-2 border-t border-white/5">
                        <div className="flex justify-between">
                          <span className="uppercase text-[9px] font-bold tracking-widest">Último Cierre</span>
                          <span className="font-bold text-white">{new Date(group.ultima_fecha_completado).toLocaleDateString()} {new Date(group.ultima_fecha_completado).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="uppercase text-[9px] font-bold tracking-widest">Aprobadas / Fallidas</span>
                          <span><span className="text-success font-bold">{group.tareas_ok}</span> / <span className="text-danger font-bold">{group.tareas_fallidas}</span></span>
                        </div>
                        <div className="flex justify-between">
                          <span className="uppercase text-[9px] font-bold tracking-widest">Auditores Intervinientes</span>
                          <span className="italic truncate max-w-[150px]">{Array.from(group.ejecutores).join(', ') || 'SISTEMA'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 border-t border-white/5 flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => setBulkRevisionIds(group.revision_ids)}
                        className="w-full text-white bg-accent hover:bg-accent/80 hover:text-white text-xs py-2 shadow-lg shadow-accent/20"
                      >
                        <FileText size={16} className="mr-2" /> PDF Consolidado Total
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-24 bg-white/5 rounded-3xl border-white/5">
              <History size={48} className="mx-auto mb-md opacity-20" />
              <p className="text-muted">
                No se encontraron ciclos de trabajo completados en el historial.
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* Modal de Reporte Individual */}
      {reportRevisionId && (
        <InspectionReport 
          revisionId={reportRevisionId} 
          onClose={() => setReportRevisionId(null)} 
        />
      )}

      {/* Modal de Reporte Consolidado (Bulk) */}
      {bulkRevisionIds && (
        <BulkInspectionReport 
          revisionIds={bulkRevisionIds}
          onClose={() => setBulkRevisionIds(null)}
        />
      )}
    </div>
  );
}
