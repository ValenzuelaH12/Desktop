import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  FileText,
  ChevronRight,
  X,
  RefreshCw,
  Check,
  Printer
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { useIncidents } from '../hooks/useIncidents'
import { useLowStockAlerts } from '../hooks/useInventory'
import { useReadingTrends } from '../hooks/useReadings'
import jsPDF from 'jspdf'
import { Skeleton } from '../components/ui/Skeleton'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, activeHotelId } = useAuth()
  
  // State for reports
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportDates, setReportDates] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [isGenerating, setIsGenerating] = useState(false)

  // React Query Hooks
  const { data: allIncidents = [], isLoading: incLoading } = useIncidents(activeHotelId)
  const { data: lowStock = [], isLoading: stockLoading } = useLowStockAlerts(activeHotelId)
  const { data: readingTrends = {}, isLoading: trendsLoading } = useReadingTrends(activeHotelId)

  const loading = incLoading || stockLoading || trendsLoading

  // Calculate Stats
  const stats = useMemo(() => {
    const active = allIncidents.filter(i => i.status !== 'resuelto' && i.status !== 'resolved').length
    const resolvedToday = allIncidents.filter(i => 
      (i.status === 'resuelto' || i.status === 'resolved') && 
      new Date(i.created_at).toDateString() === new Date().toDateString()
    ).length

    return [
      { id: 1, title: 'Incidencias Activas', value: active, icon: AlertTriangle, color: 'danger' },
      { id: 2, title: 'Resueltas Hoy', value: resolvedToday, icon: CheckCircle, color: 'success' },
      { id: 3, title: 'Tiempo de Resolución', value: '1.2h', icon: Clock, color: 'info' },
      { id: 4, title: 'Alertas Inventario', value: lowStock.length, icon: Activity, color: 'accent' },
    ]
  }, [allIncidents, lowStock])

  const generateProReport = async () => {
    setIsGenerating(true)
    try {
      const { start, end } = reportDates
      
      let qInc = supabase.from('incidencias').select('*').gte('created_at', start).lte('created_at', end + 'T23:59:59')
      if (activeHotelId) qInc = qInc.eq('hotel_id', activeHotelId)
      const { data: incs } = await qInc

      let qMant = supabase.from('historial_mantenimiento').select('*, tarea:tarea_id(titulo)').gte('completado_el', start).lte('completado_el', end + 'T23:59:59')
      if (activeHotelId) qMant = qMant.eq('hotel_id', activeHotelId)
      const { data: maintenance } = await qMant

      let qRead = supabase.from('lecturas').select('*, contador:contador_id(nombre, tipo)').gte('fecha', start).lte('fecha', end).order('fecha', { ascending: true })
      if (activeHotelId) qRead = qRead.eq('hotel_id', activeHotelId)
      const { data: readings } = await qRead

      const consumos = readings?.reduce((acc: any, curr: any, idx, arr) => {
        const next = arr.find((r, i) => i > idx && r.contador_id === curr.contador_id)
        if (next) {
          const diff = next.valor - curr.valor
          acc[curr.contador.tipo] = (acc[curr.contador.tipo] || 0) + diff
        }
        return acc
      }, {})

      const doc = new jsPDF()
      const { default: autoTable } = await import('jspdf-autotable')

      doc.setFillColor(10, 10, 26)
      doc.rect(0, 0, 210, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.text('V-SUITE', 14, 25)
      doc.setFontSize(10)
      doc.text('REPORTE EJECUTIVO DE OPERACIONES', 14, 32)
      
      doc.setTextColor(100, 100, 100)
      doc.text(`Periodo: ${new Date(start).toLocaleDateString()} al ${new Date(end).toLocaleDateString()}`, 14, 48)
      doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 54)

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.text('Métricas Clave', 14, 70)
      
      const kpiData = [
        ['Incidencias Reportadas', incs?.length || 0],
        ['Incidencias Resueltas', incs?.filter(i => i.status === 'resolved' || i.status === 'resuelto').length || 0],
        ['Mantenimientos Ejecutados', maintenance?.length || 0],
        ['Eficiencia de Resolución', incs?.length ? Math.round((incs.filter(i => i.status === 'resolved' || i.status === 'resuelto').length / incs.length) * 100) + '%' : 'N/A']
      ]

      autoTable(doc, {
        startY: 75,
        head: [['KPI', 'Valor']],
        body: kpiData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 10 }
      })

      doc.save(`Reporte_VSuite_${start}_a_${end}.pdf`)
      setIsReportModalOpen(false)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error al generar el reporte detallado.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vista General</h1>
          <p className="page-subtitle">Resumen operativo en tiempo real</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsReportModalOpen(true)}>
          <FileText size={18} />
          <span>Generar Reporte Pro</span>
        </button>
      </div>

      <div className="stats-grid">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card glass-card">
              <Skeleton variant="text" width="60%" height="1.2rem" />
              <Skeleton variant="text" width="40%" height="2rem" />
            </div>
          ))
        ) : (
          stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.id} className="stat-card glass-card">
                <div className="stat-header">
                  <span className="stat-title">{stat.title}</span>
                  <div className={`stat-icon-wrapper text-${stat.color} bg-${stat.color}-light`}>
                    <Icon size={20} />
                  </div>
                </div>
                <div className="stat-body">
                  <h3 className="stat-value">{stat.value}</h3>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="dashboard-grid mt-xl">
        <div className="glass-card panel">
          <div className="panel-header border-b">
            <h3>Incidencias Recientes</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/incidencias')}>Ver todas</button>
          </div>
          
          <div className="panel-body">
            {incLoading ? (
              <div className="p-lg">
                <Skeleton variant="text" height="40px" className="mb-sm" />
                <Skeleton variant="text" height="40px" className="mb-sm" />
                <Skeleton variant="text" height="40px" />
              </div>
            ) : (
              <ul className="incident-list">
                {allIncidents.slice(0, 5).map((incident) => (
                  <li key={incident.id} className="incident-item">
                    <div className="incident-status">
                      <div className={`priority-indicator priority-${incident.priority}`}></div>
                    </div>
                    
                    <div className="incident-content">
                      <div className="incident-top">
                        <span className="incident-id text-accent">ID: {incident.id}</span>
                        <span className="incident-time">{new Date(incident.created_at).toLocaleTimeString()}</span>
                      </div>
                      <h4 className="incident-title">{incident.title}</h4>
                      <div className="incident-bottom">
                        <span className="badge badge-neutral">Hab. {incident.location}</span>
                        <span className={`badge badge-${
                          (incident.status === 'resolved' || incident.status === 'resuelto') ? 'success' : 
                          (incident.status === 'in-progress' || incident.status === 'proceso') ? 'warning' : 'danger'
                        }`}>
                          {(incident.status === 'resolved' || incident.status === 'resuelto') ? 'Resuelta' : 
                           (incident.status === 'in-progress' || incident.status === 'proceso') ? 'En proceso' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="glass-card panel">
          <div className="panel-header border-b">
            <h3>Alertas de Inventario</h3>
          </div>
          <div className="panel-body p-lg">
            {stockLoading ? (
               <div className="flex flex-col gap-sm">
                 <Skeleton height="30px" />
                 <Skeleton height="30px" />
               </div>
            ) : lowStock.length > 0 ? (
              <ul className="incident-list">
                {lowStock.map(item => (
                  <li key={item.id} className="p-sm flex justify-between items-center border-b border-white/5 last:border-0" onClick={() => navigate('/inventario')}>
                    <div>
                      <div className="font-bold text-sm">{item.nombre}</div>
                      <div className="text-[10px] text-danger font-bold">Stock: {item.stock_actual}</div>
                    </div>
                    <ChevronRight size={16} className="text-muted" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-xl text-center text-muted">Stock garantizado.</div>
            )}
          </div>
        </div>

        <div className="glass-card panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-header border-b">
            <h3>Tendencia de Consumo</h3>
          </div>
          <div className="panel-body p-lg" style={{ height: '320px' }}>
            {trendsLoading ? (
               <div className="w-full h-full flex flex-col justify-end gap-sm p-lg">
                 <div className="flex items-end gap-md h-full">
                    <Skeleton height="40%" width="12%" />
                    <Skeleton height="70%" width="12%" />
                    <Skeleton height="50%" width="12%" />
                    <Skeleton height="90%" width="12%" />
                    <Skeleton height="60%" width="12%" />
                    <Skeleton height="80%" width="12%" />
                 </div>
               </div>
            ) : (() => {
              const typeColors = {
                luz: { border: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
                agua: { border: '#2dd4bf', bg: 'rgba(45,212,191,0.1)' },
                gas: { border: '#fbbf24', bg: 'rgba(251,191,36,0.1)' }
              }
              const trends: any = readingTrends || {}
              const allDates = [...new Set(Object.values(trends).flat().map((r: any) => r.fecha))].sort()
              const labels = allDates.map(d => new Date(d as string).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))

              const datasets = Object.entries(typeColors)
                .filter(([tipo]) => trends[tipo] && trends[tipo].length > 0)
                .map(([tipo, colors]) => ({
                  label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
                  data: allDates.map(d => {
                    const match = (trends[tipo] as any[] || []).find(r => r.fecha === d)
                    return match ? match.consumo : null
                  }),
                  borderColor: colors.border,
                  backgroundColor: colors.bg,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  borderWidth: 2,
                  spanGaps: true
                }))

              if (datasets.length === 0) return (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted">
                  <Activity size={32} className="mb-sm opacity-20" />
                  <p className="text-xs">Sin datos de consumo</p>
                </div>
              )

              return (
                <Line
                  data={{ labels, datasets }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { intersect: false, mode: 'index' as const },
                    plugins: {
                      legend: { position: 'top' as const, labels: { color: '#a0a0c0', font: { size: 12 }, padding: 16, usePointStyle: true } },
                      tooltip: { backgroundColor: 'rgba(15,15,35,0.95)', titleColor: '#e0e0f0', bodyColor: '#a0a0c0', padding: 12, cornerRadius: 8, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }
                    },
                    scales: {
                      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b6b8d', font: { size: 11 } } },
                      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b6b8d', font: { size: 11 } }, beginAtZero: true }
                    }
                  }}
                />
              )
            })()}
          </div>
        </div>
      </div>

      {/* MODAL DE REPORTE PRO */}
      {isReportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsReportModalOpen(false)}>
          <div className="modal-content" style={{maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-sm">
                <FileText className="text-accent" size={24} />
                <h2>Centro de Reportes Pro</h2>
              </div>
              <button className="btn-icon btn-ghost" onClick={() => setIsReportModalOpen(false)}><X size={20} /></button>
            </div>

            <div className="modal-body p-xl">
              <p className="text-sm text-muted mb-xl">
                Selecciona el rango de fechas para consolidar las métricas de mantenimiento, incidencias y suministros en un documento ejecutivo PDF.
              </p>
              
              <div className="grid-2 gap-md mb-xl">
                <div className="input-group">
                  <label className="input-label">Desde</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={reportDates.start} 
                    onChange={e => setReportDates({...reportDates, start: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Hasta</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={reportDates.end} 
                    onChange={e => setReportDates({...reportDates, end: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-accent/5 p-md rounded-md mb-xl">
                <h4 className="text-xs font-bold text-accent mb-sm uppercase">Resumen del Informe:</h4>
                <ul className="text-xs text-muted flex flex-col gap-xs">
                  <li className="flex items-center gap-xs"><Check size={12} className="text-success" /> Consolidado de Incidencias Totales</li>
                  <li className="flex items-center gap-xs"><Check size={12} className="text-success" /> Cálculo de Suministros (m³ / kWh)</li>
                  <li className="flex items-center gap-xs"><Check size={12} className="text-success" /> Registro de Mantenimiento Preventivo</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsReportModalOpen(false)}>Cancelar</button>
              <button 
                className="btn btn-primary ml-md" 
                onClick={generateProReport} 
                disabled={isGenerating}
              >
                {isGenerating ? (
                   <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Printer size={16} />
                )}
                <span>{isGenerating ? 'Procesando...' : 'Descargar PDF Pro'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dashboard-container { animation: fadeIn 0.5s ease; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-xl); }
        .page-title { font-size: var(--font-size-2xl); font-weight: 800; }
        .page-subtitle { color: var(--color-text-secondary); }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg); }
        .stat-card { padding: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-sm); }
        .stat-header { display: flex; justify-content: space-between; align-items: center; }
        .stat-title { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; }
        .stat-icon-wrapper { width: 36px; height: 36px; border-radius: 8px; display: flex; items-center; justify-content: center; }
        .stat-value { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-text-primary); }

        .dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--spacing-lg); }
        .panel { display: flex; flex-direction: column; }
        .panel-header { padding: var(--spacing-md) var(--spacing-lg); display: flex; justify-content: space-between; items-center; }
        .panel-header h3 { font-size: var(--font-size-sm); font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary); }
        
        .incident-list { list-style: none; }
        .incident-item { display: flex; gap: var(--spacing-md); padding: var(--spacing-md) var(--spacing-lg); border-bottom: 1px solid var(--color-border); cursor: pointer; transition: background 0.2s; }
        .incident-item:hover { background: var(--color-bg-glass); }
        .priority-indicator { width: 4px; border-radius: 2px; }
        .priority-critica { background: var(--color-danger); }
        .priority-alta { background: var(--color-priority-alta); }
        .priority-media { background: var(--color-warning); }
        .priority-baja { background: var(--color-success); }
        
        .incident-content { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .incident-top { display: flex; justify-content: space-between; font-size: var(--font-size-xs); color: var(--color-text-muted); }
        .incident-title { font-size: var(--font-size-sm); font-weight: 600; }
        .incident-bottom { display: flex; gap: var(--spacing-sm); margin-top: 4px; }

        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
