import { useEffect, useMemo, useState } from 'react'
import { 
  BarChart3, 
  Users, 
  Building2, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Download,
  Settings,
  ChevronRight,
  Search,
  Plus,
  X,
  Globe,
  CreditCard,
  Check
} from 'lucide-react'
import { useSuperAdmin } from '../hooks/useSuperAdmin'
import { usePlanes } from '../hooks/usePlanes'
import { planService } from '../services/planService'
import { configService } from '../services/configService'
import { Line } from 'react-chartjs-2'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  BarElement
} from 'chart.js'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

export default function SuperAdmin() {
  const { hotels, globalIncidents, globalStaff, isLoading: adminLoading } = useSuperAdmin()
  const { planes, isLoading: planesLoading, updatePlan } = usePlanes()
  const { profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isPlanesModalOpen, setIsPlanesModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any | null>(null)
  const [newGlobalType, setNewGlobalType] = useState({ nombre: '', categoria: '' })
  const navigate = useNavigate()

  // El efecto ya no es necesario ya que usePlanes maneja el fetch

  const metrics = useMemo(() => {
    const totalIncidents = globalIncidents.length
    const resolvedIncidents = globalIncidents.filter(i => i.status === 'resolved' || i.status === 'resuelto').length
    const activeIncidents = totalIncidents - resolvedIncidents
    const efficiency = totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0

    return [
      { title: 'Hoteles en Cadena', value: hotels.length, icon: Building2, color: 'info' },
      { title: 'Personal Total', value: globalStaff.length, icon: Users, color: 'accent' },
      { title: 'Incidencias Activas', value: activeIncidents, icon: AlertTriangle, color: 'danger' },
      { title: 'Eficiencia Global', value: `${efficiency}%`, icon: TrendingUp, color: 'success' },
    ]
  }, [hotels, globalIncidents, globalStaff])

  const hotelStats = useMemo(() => {
    return hotels.map(hotel => {
      const hotelIncidents = globalIncidents.filter(i => i.hotel_id === hotel.id)
      const hotelStaff = globalStaff.filter(s => s.hotel_id === hotel.id)
      const active = hotelIncidents.filter(i => i.status !== 'resolved' && i.status !== 'resuelto').length
      
      return {
        ...hotel,
        activeIncidents: active,
        totalStaff: hotelStaff.length,
        lastActivity: hotelIncidents[0]?.created_at || 'Sin actividad'
      }
    }).filter(h => h.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [hotels, globalIncidents, globalStaff, searchTerm])

  const generateChainReport = () => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('REPORTE CONSOLIDADO DE CADENA - V-SUITE', 14, 20)
    doc.setFontSize(10)
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28)

    const tableData = hotelStats.map(h => [
      h.nombre,
      h.activeIncidents,
      h.totalStaff,
      h.estado.toUpperCase()
    ])

    autoTable(doc, {
      startY: 35,
      head: [['Hotel', 'Incidencias Activas', 'Personal', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [10, 10, 26] }
    })

    doc.save(`Reporte_Cadena_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleCreateGlobalType = async () => {
    if (!newGlobalType.nombre) return
    try {
      await configService.createGlobalIncidentType(newGlobalType)
      setIsConfigModalOpen(false)
      setNewGlobalType({ nombre: '', categoria: '' })
      alert('Tipo de incidencia global creado. Se reflejará en todos los hoteles.')
    } catch (error) {
      console.error('Error creating global type:', error)
    }
  }

  const handleUpdatePlan = async () => {
    if (!editingPlan) return
    try {
      await updatePlan({ id: editingPlan.id, updates: editingPlan })
      setEditingPlan(null)
      alert('Plan actualizado correctamente.')
    } catch (error) {
      console.error('Error updating plan:', error)
      alert('Error al actualizar el plan: ' + (error as any).message)
    }
  }

  const handleToggleFeature = (feature: string) => {
    if (!editingPlan) return
    const features = editingPlan.features.includes(feature)
      ? editingPlan.features.filter(f => f !== feature)
      : [...editingPlan.features, feature]
    setEditingPlan({ ...editingPlan, features })
  }

  const chartData = useMemo(() => {
    const labels = hotels.map(h => h.nombre)
    const activeData = hotels.map(hotel => 
      globalIncidents.filter(i => i.hotel_id === hotel.id && i.status !== 'resolved' && i.status !== 'resuelto').length
    )
    
    return {
      labels,
      datasets: [{
        label: 'Incidencias Activas',
        data: activeData,
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1
      }]
    }
  }, [hotels, globalIncidents])

  if (adminLoading || planesLoading) return <div className="p-xl text-center">Cargando visión global...</div>

  return (
    <div className="p-lg md:p-xl space-y-xl animate-fade-in max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
        <div className="flex items-center gap-lg">
          <div className="p-3 bg-accent/20 text-accent rounded-2xl border border-accent/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Globe size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">V-<span className="text-accent">Chain</span></h1>
            <p className="text-muted text-sm font-bold uppercase tracking-widest opacity-60">Centro de Operaciones Global • 8 Hoteles</p>
          </div>
        </div>
        <div className="flex gap-sm">
          <button className="v-button-secondary py-3 px-6 rounded-2xl flex items-center gap-sm font-black uppercase text-[10px] tracking-widest" onClick={generateChainReport}>
            <Download size={16} />
            <span>Exportar Reporte</span>
          </button>
          
          {profile?.rol === 'super_admin' && (
            <button className="v-button-secondary py-3 px-8 rounded-2xl flex items-center gap-sm font-black uppercase text-[10px] tracking-widest shadow-lg" onClick={() => setIsPlanesModalOpen(true)}>
              <CreditCard size={16} />
              <span>Gestión de Planes</span>
            </button>
          )}

          <button className="v-button-primary py-3 px-8 rounded-2xl flex items-center gap-sm font-black uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20" onClick={() => setIsConfigModalOpen(true)}>
            <Plus size={16} />
            <span>Configuración Maestra</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="v-glass-card group hover:scale-[1.02] transition-all duration-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-accent/10 transition-all" />
              <div className="p-lg relative">
                <div className="flex justify-between items-start mb-md">
                  <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 text-white group-hover:border-accent/30 group-hover:text-accent transition-all`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-[10px] font-black p-1 px-3 bg-white/5 rounded-full text-muted group-hover:text-white transition-all">REAL-TIME</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted uppercase tracking-widest">{m.title}</span>
                  <div className="text-4xl font-black text-white tracking-tighter">{m.value}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="lg:col-span-2 v-glass-card p-lg">
          <h3 className="text-sm font-bold mb-md uppercase text-muted tracking-widest">Carga de Trabajo por Hotel</h3>
          <div className="h-64">
            <Line data={chartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="v-glass-card p-lg">
          <h3 className="text-sm font-bold mb-md uppercase text-muted tracking-widest">Alertas de Cadena</h3>
          <div className="space-y-sm">
            {hotelStats.filter(h => h.activeIncidents > 10).map(h => (
              <div key={h.id} className="p-sm bg-danger/10 border border-danger/20 rounded-lg flex items-center justify-between">
                <span className="text-sm font-bold">{h.nombre}</span>
                <span className="badge badge-danger">{h.activeIncidents} críticas</span>
              </div>
            ))}
            {hotelStats.filter(h => h.activeIncidents > 10).length === 0 && (
              <div className="text-center py-xl text-muted text-sm italic">Sin alertas críticas en la cadena.</div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-lg border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-md">
            <h2 className="text-lg font-bold">Estado de Hoteles</h2>
            <span className="badge badge-info">{hotelStats.length} Hoteles</span>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Buscar hotel..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-xs text-muted uppercase">
              <tr>
                <th className="px-lg py-md">Hotel</th>
                <th className="px-lg py-md">Estado</th>
                <th className="px-lg py-md">Incidencias</th>
                <th className="px-lg py-md">Personal</th>
                <th className="px-lg py-md">Última Actividad</th>
                <th className="px-lg py-md"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {hotelStats.map((hotel) => (
                <tr key={hotel.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-lg py-md">
                    <div className="font-bold">{hotel.nombre}</div>
                    <div className="text-xs text-muted font-mono">{hotel.id}</div>
                  </td>
                  <td className="px-lg py-md">
                    <span className={`badge ${hotel.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                      {hotel.estado}
                    </span>
                  </td>
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-sm">
                      <span className="text-lg font-bold">{hotel.activeIncidents}</span>
                      <AlertTriangle size={14} className={hotel.activeIncidents > 5 ? 'text-danger' : 'text-muted'} />
                    </div>
                  </td>
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-sm">
                      <Users size={14} className="text-muted" />
                      <span>{hotel.totalStaff} staff</span>
                    </div>
                  </td>
                  <td className="px-lg py-md text-sm text-muted">
                    {hotel.lastActivity !== 'Sin actividad' ? new Date(hotel.lastActivity).toLocaleDateString() : '---'}
                  </td>
                  <td className="px-lg py-md text-right">
                    <button className="p-sm hover:text-primary transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isConfigModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-xl space-y-lg max-w-md">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Configuración Maestra</h2>
              <button className="btn-icon btn-ghost" onClick={() => setIsConfigModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-md">
              <p className="text-sm text-muted">Añadir un nuevo tipo de incidencia que estará disponible en los 8 hoteles automáticamente.</p>
              <div className="field-group">
                <label className="label text-xs uppercase text-muted font-bold">Nombre del Tipo</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Ej: Aire Acondicionado" 
                  value={newGlobalType.nombre}
                  onChange={(e) => setNewGlobalType({ ...newGlobalType, nombre: e.target.value })}
                />
              </div>
              <div className="field-group">
                <label className="label text-xs uppercase text-muted font-bold">Categoría</label>
                <select 
                  className="input"
                  value={newGlobalType.categoria}
                  onChange={(e) => setNewGlobalType({ ...newGlobalType, categoria: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Sistemas">Sistemas</option>
                </select>
              </div>
              <button className="btn btn-primary w-full" onClick={handleCreateGlobalType}>
                Propagar a toda la cadena
              </button>
            </div>
          </div>
        </div>
      )}
      {isPlanesModalOpen && profile?.rol === 'super_admin' && (
        <div className="modal-overlay">
          <div className="modal-content p-xl space-y-xl max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Gestión de Planes V-Suite</h2>
                <p className="text-muted text-xs font-bold uppercase tracking-widest">Configura tu oferta comercial</p>
              </div>
              <button className="btn-icon btn-ghost" onClick={() => setIsPlanesModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
              {/* Lista de Planes */}
              <div className="space-y-md">
                <h3 className="text-sm font-bold uppercase text-muted tracking-widest">Planes Disponibles</h3>
                <div className="space-y-sm">
                  {planes.map(plan => (
                    <button 
                      key={plan.id}
                      onClick={() => setEditingPlan(plan)}
                      className={`w-full p-lg rounded-2xl border text-left transition-all flex justify-between items-center ${
                        editingPlan?.id === plan.id ? 'border-accent bg-accent/5' : 'border-white/5 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white">{plan.nombre}</div>
                        <div className="text-xs text-muted">{plan.precio_mensual}€ / mes</div>
                      </div>
                      <ChevronRight size={16} className={editingPlan?.id === plan.id ? 'text-accent' : 'text-muted'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor de Plan */}
              <div className="v-glass-card p-lg border border-white/10">
                {editingPlan ? (
                  <div className="space-y-lg">
                    <h3 className="text-sm font-bold uppercase text-accent tracking-widest">Editando: {editingPlan.nombre}</h3>
                    
                    <div className="grid grid-cols-2 gap-md">
                      <div className="field-group">
                        <label className="label text-[10px] uppercase text-muted font-bold">Precio Mensual (€)</label>
                        <input 
                          type="number" 
                          className="input" 
                          value={editingPlan.precio_mensual}
                          onChange={(e) => setEditingPlan({ ...editingPlan, precio_mensual: Number(e.target.value) })}
                        />
                      </div>
                      <div className="field-group">
                        <label className="label text-[10px] uppercase text-muted font-bold">Precio Anual (€)</label>
                        <input 
                          type="number" 
                          className="input" 
                          value={editingPlan.precio_anual}
                          onChange={(e) => setEditingPlan({ ...editingPlan, precio_anual: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="field-group">
                      <label className="label text-[10px] uppercase text-muted font-bold">Descripción Corta</label>
                      <input 
                        type="text" 
                        className="input" 
                        value={editingPlan.descripcion}
                        onChange={(e) => setEditingPlan({ ...editingPlan, descripcion: e.target.value })}
                      />
                    </div>

                    <div className="space-y-md">
                      <label className="label text-[10px] uppercase text-muted font-bold">Características / Ventanas</label>
                      <div className="grid grid-cols-1 gap-sm">
                        {[
                          'Habitaciones ilimitadas',
                          'Analítica V-Insights',
                          'V-Nexus Real-time',
                          'V-Scan QR Premium',
                          'Asistente V-AI (IA)',
                          'Gestión de cadena (V-Chain)',
                          'Soporte 24/7',
                          'Panel de mantenimiento',
                          'Notificaciones push'
                        ].map(feature => (
                          <button 
                            key={feature}
                            onClick={() => handleToggleFeature(feature)}
                            className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                              editingPlan.features.includes(feature)
                                ? 'border-success bg-success/10 text-success'
                                : 'border-white/5 bg-white/5 text-muted hover:border-white/20'
                            }`}
                          >
                            <span>{feature}</span>
                            {editingPlan.features.includes(feature) && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button className="v-button-primary w-full py-4 mt-lg rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20" onClick={handleUpdatePlan}>
                      Guardar Cambios en {editingPlan.nombre}
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-xl opacity-50">
                    <CreditCard size={48} className="mb-md text-muted" />
                    <p className="text-sm font-bold uppercase tracking-widest text-muted">Selecciona un plan para editar sus precios y beneficios</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
