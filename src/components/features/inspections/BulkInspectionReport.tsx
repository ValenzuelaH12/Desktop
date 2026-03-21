import { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer,
  X,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { preventivoService } from '../../../services/preventivoService';
import { Button } from '../../ui/Button';

interface Props {
  revisionIds: string[];
  onClose: () => void;
}

export const BulkInspectionReport = ({ revisionIds, onClose }: Props) => {
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await preventivoService.getRevisionBulkFullDetail(revisionIds);
        setRevisions(data);
      } catch (error) {
        console.error('Error loading bulk report data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (revisionIds?.length > 0) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [revisionIds]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent" />
    </div>
  );

  if (!revisions.length) return <div className="p-xl text-center">No se pudo cargar el reporte consolidado.</div>;

  const plantilla = revisions[0]?.plantilla;
  const fechaEjecucion = new Date(revisions[0]?.completado_el).toLocaleDateString();
  const total = revisions.length;
  const fallidas = revisions.filter(r => r.estado === 'fallida').length;
  const correctas = total - fallidas;
  const porcentaje = Math.round((correctas / total) * 100) || 0;

  // Ejecutores únicos
  const ejecutoresSet = new Set(revisions.map(r => r.ejecutor?.nombre).filter(Boolean));
  const ejecutores = Array.from(ejecutoresSet).join(', ') || 'Personal del Hotel';

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-0 md:p-6 backdrop-blur-sm print:relative print:bg-white print:p-0">
      <div className="bg-[#1a1c23] w-full max-w-4xl h-full md:h-[90vh] overflow-hidden flex flex-col rounded-3xl border border-white/10 shadow-2xl print:bg-white print:h-auto print:border-none print:shadow-none print:rounded-none">
        
        {/* Toolbar - Oculto al imprimir */}
        <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <div className="bg-accent p-2 rounded-lg">
               <FileText size={20} className="text-white" />
            </div>
            <span className="font-bold text-white">Reporte Consolidado (Múltiples Ubicaciones)</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handlePrint}>
              <Printer size={18} className="mr-2" /> Imprimir / Guardar PDF
            </Button>
            <Button variant="ghost" onClick={onClose} className="p-2">
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Contenido del Reporte */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white text-gray-900 print:overflow-visible relative">
          
          {/* Header del Reporte */}
          <div className="flex justify-between items-start gap-6 border-b-4 border-accent pb-8 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white font-black text-xl">V</div>
                 <span className="text-2xl font-black tracking-tighter">V-SUITE<span className="text-accent">AUDIT</span></span>
              </div>
              <h1 className="text-3xl font-black uppercase leading-none">Reporte Maestro <br/><span className="text-accent/80 text-xl">MANTENIMIENTO PREVENTIVO</span></h1>
            </div>
            
            <div className="text-right space-y-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plan Ejecutado</div>
              <div className="text-sm font-black bg-gray-100 p-1 px-2 rounded mb-4">{plantilla?.nombre} ({plantilla?.frecuencia.toUpperCase()})</div>
              
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Fecha de Ejecución</div>
              <div className="text-sm font-bold">{fechaEjecucion}</div>
            </div>
          </div>

          {/* Resumen Ejecutivo */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-12 border border-gray-100">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Resumen Ejecutivo del Ciclo</h2>
            
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
               <div className="flex-1 space-y-4 w-full">
                  <div className="flex justify-between pb-2 border-b border-gray-200">
                     <span className="text-sm font-bold text-gray-500">Ubicaciones Inspeccionadas:</span>
                     <span className="text-lg font-black">{total}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-200">
                     <span className="text-sm font-bold text-green-600">Certificadas sin fallos (OK):</span>
                     <span className="text-lg font-black text-green-600">{correctas}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-200">
                     <span className="text-sm font-bold text-red-600">Con observaciones (Fallos):</span>
                     <span className="text-lg font-black text-red-600">{fallidas}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                     <span className="text-sm font-bold text-gray-500">Auditores Intervinientes:</span>
                     <span className="text-sm font-bold text-right max-w-[200px] truncate">{ejecutores}</span>
                  </div>
               </div>
               
               <div className="w-48 h-48 flex items-center justify-center shrink-0">
                  {/* Círculo de porcentaje simple */}
                  <div className="relative w-40 h-40 rounded-full flex items-center justify-center border-[12px] border-accent/20">
                     {porcentaje >= 95 ? (
                       <div className="absolute inset-[-12px] rounded-full border-[12px] border-green-500" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }} />
                     ) : porcentaje > 0 ? (
                       <div className="absolute inset-[-12px] rounded-full border-[12px] border-accent" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${porcentaje}%, 0 100%)` }} />
                     ) : null}
                     <div className="text-center flex flex-col">
                       <span className={`text-4xl font-black ${porcentaje === 100 ? 'text-green-600' : 'text-accent'}`}>{porcentaje}%</span>
                       <span className="text-[10px] uppercase font-bold text-gray-400">Éxito Global</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 italic mb-8 border-b-2 border-gray-200 pb-2">
            A continuación se listan todas las ubicaciones auditadas en este ciclo. Para maximizar la claridad, <strong>solo se detallan los puntos de control si se detectó una falla.</strong>
          </p>

          <div className="space-y-6 mb-24">
            {revisions.map((rev) => {
              const resMap = (rev.resultados || []).reduce((acc: any, r: any) => { acc[r.item_id] = r; return acc; }, {});
              
              // Si la revisión está OK, no listamos sus ítems, ahorrando cientos de páginas de papel
              const isFailed = rev.estado === 'fallida';
              const fallos = isFailed ? (rev.plantilla?.preventivo_categorias || []).flatMap((cat: any) => 
                (cat.preventivo_items || []).filter((item: any) => resMap[item.id]?.valor === 'nok' || resMap[item.id]?.valor === 'no').map((item: any) => ({
                  catNombre: cat.nombre,
                  texto: item.texto,
                  comentario: resMap[item.id]?.comentario
                }))
              ) : [];

              return (
                <div key={rev.id} className="border border-gray-200 rounded-xl overflow-hidden print:break-inside-avoid">
                  <div className={`p-3 px-4 flex justify-between items-center ${isFailed ? 'bg-red-50' : 'bg-gray-50'}`}>
                     <div className="flex items-center gap-3">
                       {isFailed ? <XCircle size={18} className="text-red-500" /> : <CheckCircle2 size={18} className="text-green-500" />}
                       <span className="font-bold text-sm uppercase">{rev.ubicacion_nombre}</span>
                       <span className="text-[10px] text-gray-400 ml-2 tracking-widest">{rev.entidad_tipo.toUpperCase()}</span>
                     </div>
                     <span className={`text-[10px] font-black tracking-widest ${isFailed ? 'text-red-500' : 'text-green-500'}`}>
                       {isFailed ? 'REVISIÓN FALLIDA' : 'OK'}
                     </span>
                  </div>
                  
                  {isFailed && fallos.length > 0 && (
                    <div className="p-4 bg-white">
                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-2">Detalles de la falla:</div>
                      <div className="space-y-3">
                        {fallos.map((f: any, idx: number) => (
                           <div key={idx} className="flex gap-4 text-sm border-l-2 border-red-200 pl-3">
                              <span className="font-bold min-w-[120px] text-gray-600 border-r border-gray-100 pr-2">{f.catNombre}</span>
                              <span className="flex-1">{f.texto}</span>
                              {f.comentario && <span className="text-red-600 font-medium italic mr-2 text-xs">Obs: {f.comentario}</span>}
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Auditoría */}
          <div className="grid grid-cols-2 gap-24 pt-12 mt-12 border-t border-gray-200 print:break-inside-avoid">
             <div className="text-center space-y-8">
                <div className="h-24 flex items-end justify-center">
                  <span className="text-gray-200 font-mono text-[10px] tracking-widest italic select-none">SGN_GRP_{new Date().getTime().toString().substring(5)}</span>
                </div>
                <div className="border-t border-gray-900 pt-2">
                   <p className="text-[10px] font-bold uppercase">Dirección / Gobernante</p>
                   <p className="text-xs text-gray-500">Aprobación General</p>
                </div>
             </div>
             <div className="text-center space-y-8">
                <div className="h-24 flex items-end justify-center">
                   <div className="w-16 h-16 bg-accent opacity-10 rounded-full border-4 border-accent flex items-center justify-center -rotate-12 translate-y-4 print:opacity-20">
                      <span className="text-[8px] font-black text-accent uppercase leading-tight text-center mt-2">V-SUITE<br/>GLOBAL</span>
                   </div>
                </div>
                <div className="border-t border-gray-900 pt-2">
                   <p className="text-[10px] font-bold uppercase">Sello de Certificación</p>
                   <p className="text-xs text-gray-500">Validado Sistema {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
