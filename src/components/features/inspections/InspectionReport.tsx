import { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  User, 
  MapPin, 
  Zap,
  ShieldCheck,
  Printer,
  Download,
  X
} from 'lucide-react';
import { preventivoService } from '../../../services/preventivoService';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

interface Props {
  revisionId: string;
  onClose: () => void;
}

export const InspectionReport = ({ revisionId, onClose }: Props) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fullDetail = await preventivoService.getRevisionFullDetail(revisionId);
        setData(fullDetail);
      } catch (error) {
        console.error('Error loading report data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [revisionId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="flex items-center justify-center p-24">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent" />
    </div>
  );

  if (!data) return <div className="p-xl text-center">No se pudo cargar el reporte.</div>;

  const resultsMap = (data.resultados || []).reduce((acc: any, r: any) => {
    acc[r.item_id] = r;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-0 md:p-6 backdrop-blur-sm print:relative print:bg-white print:p-0">
      <div className="bg-[#1a1c23] w-full max-w-4xl h-full md:h-[90vh] overflow-hidden flex flex-col rounded-3xl border border-white/10 shadow-2xl print:bg-white print:h-auto print:border-none print:shadow-none print:rounded-none">
        
        {/* Toolbar - Oculto al imprimir */}
        <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <div className="bg-accent p-2 rounded-lg">
               <FileText size={20} className="text-white" />
            </div>
            <span className="font-bold text-white">Visualización de Reporte</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handlePrint}>
              <Printer size={18} className="mr-2" /> Imprimir / PDF
            </Button>
            <Button variant="ghost" onClick={onClose} className="p-2">
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Contenido del Reporte */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white text-gray-900 print:overflow-visible">
          
          {/* Header del Reporte */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b-4 border-accent pb-8 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white font-black text-xl">V</div>
                 <span className="text-2xl font-black tracking-tighter">V-SUITE<span className="text-accent">AUDIT</span></span>
              </div>
              <h1 className="text-3xl font-black uppercase leading-none">Informe de Inspección <br/><span className="text-accent/80 text-xl">MANTENIMIENTO PREVENTIVO</span></h1>
            </div>
            
            <div className="text-right space-y-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Código de Auditoría</div>
              <div className="text-sm font-mono font-bold bg-gray-100 p-1 px-2 rounded">{data.id.substring(0, 8).toUpperCase()}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Fecha de Generación</div>
              <div className="text-sm font-bold">{new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Datos Maestros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><MapPin size={20}/></div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ubicación</div>
                <div className="text-sm font-black">{data.ubicacion_nombre}</div>
                <div className="text-[10px] text-gray-500">{data.entidad_tipo.toUpperCase()}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><Zap size={20}/></div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Procedimiento</div>
                <div className="text-sm font-black">{data.plantilla?.nombre}</div>
                <div className="text-[10px] text-gray-500">{data.plantilla?.frecuencia.toUpperCase()}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><User size={20}/></div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Técnico Auditor</div>
                <div className="text-sm font-black">{data.ejecutor?.nombre || 'Personal Hotel'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><ShieldCheck size={20}/></div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado Final</div>
                <div className={`text-sm font-black ${data.estado === 'fallida' ? 'text-red-600' : 'text-green-600'}`}>
                  {data.estado === 'fallida' ? 'CON OBSERVACIONES' : 'CERTIFICADO OK'}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Checkpoints */}
          <div className="space-y-8 mb-16">
            <h2 className="text-lg font-black border-l-4 border-gray-900 pl-4 py-1">DETALLE DE PUNTOS DE CONTROL</h2>
            
            {data.plantilla?.preventivo_categorias?.map((cat: any) => (
              <div key={cat.id} className="space-y-4">
                <div className="bg-gray-100 p-2 px-4 rounded-lg font-bold text-xs uppercase tracking-widest text-gray-600">
                  {cat.nombre}
                </div>
                <div className="border-t border-gray-100">
                  {cat.preventivo_items?.map((item: any) => {
                    const res = resultsMap[item.id];
                    return (
                      <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-50 gap-6">
                        <div className="flex-1">
                          <p className="text-sm font-bold">{item.texto}</p>
                          {res?.comentario && (
                            <p className="text-xs text-gray-500 mt-1 italic">Obs: {res.comentario}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 min-w-[120px] justify-end">
                           <span className={`text-[10px] font-black uppercase tracking-tighter ${res?.valor === 'nok' ? 'text-red-500' : 'text-green-500'}`}>
                             {res?.valor === 'nok' ? 'Fallo Crítico' : 'Correcto'}
                           </span>
                           {res?.valor === 'nok' ? <XCircle className="text-red-500" size={20} /> : <CheckCircle2 className="text-green-500" size={20} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Auditoría */}
          <div className="grid grid-cols-2 gap-24 pt-24 mt-24 border-t border-gray-200">
             <div className="text-center space-y-8">
                <div className="h-24 flex items-end justify-center">
                  <span className="text-gray-200 font-mono text-[10px] tracking-widest italic select-none">ID_SIGN_TECH_{data.ejecutado_por?.substring(0,6)}</span>
                </div>
                <div className="border-t border-gray-900 pt-2">
                   <p className="text-[10px] font-bold uppercase">Nombre del Técnico</p>
                   <p className="text-xs text-gray-500">Dpto. Mantenimiento</p>
                </div>
             </div>
             <div className="text-center space-y-8">
                <div className="h-24 flex items-end justify-center">
                   <div className="w-16 h-16 bg-accent opacity-10 rounded-full border-4 border-accent flex items-center justify-center -rotate-12 translate-y-4 print:opacity-20">
                      <span className="text-[8px] font-black text-accent uppercase leading-tight">V-SUITE<br/>APPROVED</span>
                   </div>
                </div>
                <div className="border-t border-gray-900 pt-2">
                   <p className="text-[10px] font-bold uppercase">Sello V-Suite Audit</p>
                   <p className="text-xs text-gray-500">Validado Sistema {new Date(data.completado_el).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
             </div>
          </div>

          <div className="mt-24 text-[8px] text-gray-400 text-center uppercase tracking-widest font-bold">
            Este documento carecerá de validez legal sin el sello correspondiente del hotel. <br/>
            Generado digitalmente por V-Suite Mantenimiento Preventivo (HotelOps Pro).
          </div>
        </div>

      </div>
    </div>
  );
};
