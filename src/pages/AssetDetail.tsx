import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Settings, 
  History, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  ArrowLeft,
  Wrench,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import moment from 'moment'

export default function AssetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const toast = useToast()
  
  const [asset, setAsset] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info')

  useEffect(() => {
    fetchAssetData()
  }, [id])

  async function fetchAssetData() {
    try {
      setLoading(true)
      // 1. Obtener datos del activo
      const { data: assetData, error: assetError } = await supabase
        .from('activos')
        .select(`
          *,
          zona:zonas(nombre),
          habitacion:habitaciones(nombre)
        `)
        .eq('id', id)
        .single()

      if (assetError) throw assetError
      setAsset(assetData)

      // 2. Obtener historial (incidencias y mantenimientos)
      const [incRes, maintRes] = await Promise.all([
        supabase
          .from('incidencias')
          .select('*, reporter:perfiles(nombre)')
          .eq('activo_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('historial_mantenimiento')
          .select('*, tarea:mantenimiento_preventivo(titulo), completado_por_perfil:perfiles(nombre)')
          .eq('activo_id', id)
          .order('completado_el', { ascending: false })
      ])

      const combinedHistory = [
        ...(incRes.data || []).map(i => ({ ...i, type: 'incident' })),
        ...(maintRes.data || []).map(m => ({ ...m, type: 'maintenance' }))
      ].sort((a, b) => new Date(b.created_at || b.completado_el).getTime() - new Date(a.created_at || a.completado_el).getTime())

      setHistory(combinedHistory)
    } catch (error) {
      console.error('Error fetching asset:', error)
      toast.error('No se pudo cargar la información del activo')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] p-6 flex flex-col items-center justify-center text-center">
        <AlertTriangle size={64} className="text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Activo no encontrado</h1>
        <p className="text-gray-400 mb-6">El código escaneado no coincide con ningún equipo registrado.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-indigo-600 rounded-lg text-white">Volver al inicio</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex flex-col">
      {/* Header */}
      <header className="p-4 bg-[#12121a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold truncate max-w-[200px]">{asset.nombre}</h1>
          <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider">{asset.tipo}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                asset.estado === 'operativo' ? 'bg-green-500/20 text-green-400' :
                asset.estado === 'averiado' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
            }`}>
                {asset.estado}
            </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 max-w-2xl mx-auto w-full">
        {/* Tabs */}
        <div className="flex p-1 bg-white/5 rounded-xl mb-6">
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'info' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Info size={18} /> Ficha Técnica
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <History size={18} /> Historial
          </button>
        </div>

        {activeTab === 'info' ? (
          <div className="space-y-6">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Ubicación</p>
                <p className="font-medium">{asset.zona?.nombre || asset.location || 'No definida'}</p>
                {asset.habitacion && <p className="text-xs text-indigo-400 mt-1">Hab: {asset.habitacion.nombre}</p>}
              </div>
              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Último Mantenimiento</p>
                <p className="font-medium">{history.find(h => h.type === 'maintenance')?.completado_el ? moment(history.find(h => h.type === 'maintenance')?.completado_el).format('DD/MM/YY') : 'Nunca'}</p>
              </div>
            </div>

            {/* Manual Button */}
            {asset.manual_url && (
              <a 
                href={asset.manual_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl group active:scale-98 transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-indigo-100">Ver Manual Técnico</p>
                    <p className="text-xs text-indigo-400/80">PDF, diagramas y especificaciones</p>
                  </div>
                </div>
                <ExternalLink size={18} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </a>
            )}

            {/* Specifications */}
            <div className="p-6 bg-[#12121a] border border-white/5 rounded-3xl">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Settings size={16} /> Especificaciones
              </h3>
              <div className="space-y-3">
                {Object.entries(asset.especificaciones || {}).length > 0 ? (
                    Object.entries(asset.especificaciones).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-gray-500 text-sm capitalize">{key.replace('_', ' ')}</span>
                            <span className="text-sm font-medium text-white">{String(value)}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-sm italic">Sin especificaciones detalladas.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                  <History size={32} />
                </div>
                <p className="text-gray-500">Sin historial de intervenciones.</p>
              </div>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex gap-4">
                  <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                    item.type === 'incident' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                  }`}>
                    {item.type === 'incident' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-sm text-white truncate">
                        {item.type === 'incident' ? item.title : (item.tarea?.titulo || 'Mant. Preventivo')}
                      </p>
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">{moment(item.created_at || item.completado_el).format('DD MMM')}</span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">{item.descripcion || item.notas || 'Sin observaciones.'}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                        {(item.reporter?.nombre || item.completado_por_perfil?.nombre || 'U')[0]}
                      </div>
                      <p className="text-[10px] text-gray-500">{item.reporter?.nombre || item.completado_por_perfil?.nombre || 'Sistema'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-6 right-6 z-40">
        <button 
          onClick={() => navigate('/incidencias', { state: { prefillAsset: asset.id, prefillLocation: asset.zona?.nombre } })}
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <Wrench size={20} />
          Reportar Intervención / Avería
        </button>
      </div>

      <style>{`
        .active\\:scale-98:active { transform: scale(0.98); }
        .active\\:scale-95:active { transform: scale(0.95); }
      `}</style>
    </div>
  )
}
