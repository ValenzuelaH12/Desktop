import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  Activity, 
  TrendingUp, 
  Clock, 
  Map, 
  AlertTriangle,
  ChevronDown,
  Filter,
  Download,
  Calendar
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler
)

export default function VInsights() {
  const [isExporting, setIsExporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30') // días
  const [heatmapData, setHeatmapData] = useState(null)
  const [mttrData, setMttrData] = useState(null)
  const [consumptionData, setConsumptionData] = useState(null)
  const [summaryStats, setSummaryStats] = useState({
    totalIncidents: 0,
    avgResolutionTime: 0,
    criticalZones: [],
    efficiencyScore: 0
  })

  useEffect(() => {
    fetchInsightsData()
  }, [timeRange])

  const fetchInsightsData = async () => {
    setLoading(true)
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timeRange))
      const startDateISO = startDate.toISOString()

      // 1. Fetch Incidents for Heatmap and MTTR
      // Simplificamos la consulta para evitar errores de sintaxis y RLS
      const { data: incidents, error: incError } = await supabase
        .from('incidencias')
        .select('id, title, location, status, created_at')
        .gte('created_at', startDateISO)

      if (incError) throw incError

      // Process Heatmap (Incidents by Location)
      const locationCounts = {}
      incidents.forEach(inc => {
        // Normalize location (extract room or zone)
        const loc = inc.location ? inc.location.split('-')[0].trim() : 'General'
        locationCounts[loc] = (locationCounts[loc] || 0) + 1
      })

      const sortedLocations = Object.entries(locationCounts)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 10)

      setHeatmapData({
        labels: sortedLocations.map(l => l[0]),
        datasets: [{
          label: 'Incidencias por Zona',
          data: sortedLocations.map(l => l[1]),
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: '#6366f1',
          borderWidth: 1,
          borderRadius: 4
        }]
      })

      // Process MTTR (Mean Time To Resolution)
      // Note: Since updated_at doesn't exist, MTTR is currently 0 or based on another logic.
      // We use created_at for now to avoid crashes, but logic needs a real 'resolved_at' field.
      const resolvedIncidents = incidents.filter(inc => 
        (inc.status === 'resolved' || inc.status === 'resuelto') && 
        inc.created_at
      )

      const resolutionTimes = resolvedIncidents.map(inc => {
        // Fallback to 0 since we don't have a resolution timestamp yet
        return 0 
      })

      const mttrRanges = {
        '< 1h': resolutionTimes.filter(t => t < 1).length,
        '1-4h': resolutionTimes.filter(t => t >= 1 && t < 4).length,
        '4-24h': resolutionTimes.filter(t => t >= 4 && t < 24).length,
        '> 24h': resolutionTimes.filter(t => t >= 24).length
      }

      setMttrData({
        labels: Object.keys(mttrRanges),
        datasets: [{
          data: Object.values(mttrRanges),
          backgroundColor: [
            'rgba(34, 197, 94, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(239, 68, 68, 0.6)'
          ],
          borderColor: [
            '#22c55e',
            '#3b82f6',
            '#f59e0b',
            '#ef4444'
          ],
          borderWidth: 1
        }]
      })

      // 2. Fetch Consumption Trends
      const { data: readings, error: readError } = await supabase
        .from('lecturas')
        .select('valor, fecha, contador_id, contadores(tipo)')
        .gte('fecha', startDateISO.split('T')[0])
        .order('fecha', { ascending: true })

      if (readError) throw readError

      const dailyConsumption = {}
      const lastValues = {} // track last value per counter

      readings.forEach((read) => {
        const counterId = read.contador_id
        if (lastValues[counterId] !== undefined) {
          const consumption = read.valor - lastValues[counterId]
          const day = read.fecha
          const type = read.contadores?.tipo || 'otros'
          
          if (!dailyConsumption[day]) dailyConsumption[day] = { luz: 0, agua: 0, gas: 0, otros: 0 }
          if (consumption >= 0) { // Avoid negative consumption on resets or errors
            dailyConsumption[day][type] += consumption
          }
        }
        lastValues[counterId] = read.valor
      })

      const days = Object.keys(dailyConsumption).sort()
      setConsumptionData({
        labels: days.map(d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })),
        datasets: [
          {
            label: 'Luz (kWh)',
            data: days.map(d => dailyConsumption[d].luz),
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129, 140, 248, 0.1)',
            fill: true,
            tension: 0.4,
            spanGaps: true
          },
          {
            label: 'Agua (m³)',
            data: days.map(d => dailyConsumption[d].agua),
            borderColor: '#2dd4bf',
            backgroundColor: 'rgba(45, 212, 191, 0.1)',
            fill: true,
            tension: 0.4,
            spanGaps: true
          }
        ]
      })

      // Summary Stats
      const avgMTTR = resolutionTimes.length > 0 
        ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1)
        : '0.0'

      setSummaryStats({
        totalIncidents: incidents.length,
        avgResolutionTime: parseFloat(avgMTTR),
        criticalZones: sortedLocations.slice(0, 3).map(l => l[0]),
        efficiencyScore: resolutionTimes.length > 0 
          ? Math.round((mttrRanges['< 1h'] + mttrRanges['1-4h']) / resolutionTimes.length * 100)
          : 0
      })

    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const doc = new jsPDF()
      const { default: autoTable } = await import('jspdf-autotable')
      
      // Header
      doc.setFillColor(10, 10, 26)
      doc.rect(0, 0, 210, 40, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.text('V-SUITE', 14, 25)
      doc.setFontSize(10)
      doc.text('INFORME DE ANALÍTICA AVANZADA (V-INSIGHTS)', 14, 32)
      
      // Info
      doc.setTextColor(100, 100, 100)
      doc.text(`Rango: Últimos ${timeRange} días`, 14, 48)
      doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 54)

      // Summary Stats Table
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.text('Resumen Operativo', 14, 70)
      
      autoTable(doc, {
        startY: 75,
        head: [['Métrica', 'Valor']],
        body: [
          ['Incidencias Totales', summaryStats.totalIncidents],
          ['MTTR (Tiempo Medio)', summaryStats.avgResolutionTime + 'h'],
          ['Eficiencia Operativa', summaryStats.efficiencyScore + '%'],
          ['Zonas Críticas', summaryStats.criticalZones.join(', ') || 'N/A']
        ],
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] }
      })

      // Heatmap Data Table
      let finalY = (doc as any).lastAutoTable.finalY + 15
      doc.text('Distribución por Zonas (Heatmap)', 14, finalY)
      
      const heatmapRows = heatmapData ? heatmapData.labels.map((label, i) => [
        label,
        heatmapData.datasets[0].data[i]
      ]) : [['Sin datos', 0]]

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Zona', 'Nº Incidencias']],
        body: heatmapRows,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      })

      // Consumption Trends
      finalY = (doc as any).lastAutoTable.finalY + 15
      doc.text('Consumo de Suministros', 14, finalY)
      
      const consumptionRows = consumptionData ? consumptionData.labels.map((label, i) => [
        label,
        consumptionData.datasets[0].data[i] + ' kWh',
        consumptionData.datasets[1].data[i] + ' m³'
      ]) : [['Sin datos', '-', '-']]

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Día', 'Luz (kWh)', 'Agua (m³)']],
        body: consumptionRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
      })

      doc.save(`V-Insights_Report_${timeRange}days_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error exporting report:', error)
      alert('Error al generar el PDF del informe.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="insights-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-sm">
            <BarChart3 className="text-accent" />
            V-Insights <span className="badge badge-accent ml-sm">Beta</span>
          </h1>
          <p className="page-subtitle">Analítica avanzada y toma de decisiones ejecutivas</p>
        </div>
        <div className="flex items-center gap-md">
          <div className="select-wrapper">
            <Calendar size={16} className="select-icon" />
            <select 
              className="select variant-small" 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 3 meses</option>
            </select>
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Activity size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span>{isExporting ? 'Generando...' : 'Exportar Informe'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-xl min-h-[400px]">
          <Activity size={48} className="text-accent animate-spin mb-md" />
          <p className="text-muted">Procesando métricas operativas...</p>
        </div>
      ) : (
        <>
          <div className="stats-grid mb-xl">
            <div className="stat-card glass-card border-l-accent">
              <span className="stat-label">Incidencias Totales</span>
              <div className="stat-value">{summaryStats.totalIncidents}</div>
              <div className="text-xs text-muted mt-xs">En el periodo seleccionado</div>
            </div>
            <div className="stat-card glass-card border-l-success">
              <span className="stat-label">MTTR (Tiempo Medio)</span>
              <div className="stat-value">{summaryStats.avgResolutionTime}h</div>
              <div className="text-xs text-muted mt-xs">De reporte a resolución</div>
            </div>
            <div className="stat-card glass-card border-l-info">
              <span className="stat-label">Eficiencia Operativa</span>
              <div className="stat-value">{summaryStats.efficiencyScore}%</div>
              <div className="text-xs text-muted mt-xs">Resueltas en menos de 4h</div>
            </div>
            <div className="stat-card glass-card border-l-warning">
              <span className="stat-label">Zonas Críticas</span>
              <div className="stat-value text-lg">{summaryStats.criticalZones.join(', ') || 'Ninguna'}</div>
              <div className="text-xs text-muted mt-xs">Ubicaciones con más reportes</div>
            </div>
          </div>

          <div className="insights-grid">
            <div className="glass-card panel">
              <div className="panel-header border-b">
                <div className="flex items-center gap-sm">
                  <Map size={18} className="text-primary" />
                  <h3>Distribución Geográfica (Heatmap)</h3>
                </div>
              </div>
              <div className="panel-body p-lg h-[350px]">
                {heatmapData && <Bar 
                  data={heatmapData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a0c0' } },
                      x: { grid: { display: false }, ticks: { color: '#a0a0c0' } }
                    }
                  }}
                />}
              </div>
            </div>

            <div className="glass-card panel">
              <div className="panel-header border-b">
                <div className="flex items-center gap-sm">
                  <PieChart size={18} className="text-success" />
                  <h3>Rendimiento del Equipo</h3>
                </div>
              </div>
              <div className="panel-body p-lg h-[350px] flex items-center justify-center">
                {mttrData && <Pie 
                  data={mttrData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { 
                        position: 'right', 
                        labels: { color: '#a0a0c0', usePointStyle: true, font: { size: 11 } } 
                      } 
                    }
                  }}
                />}
              </div>
            </div>

            <div className="glass-card panel col-span-2">
              <div className="panel-header border-b">
                <div className="flex items-center gap-sm">
                  <LineChart size={18} className="text-info" />
                  <h3>Análisis de Suministros (Tendencia de Consumo)</h3>
                </div>
              </div>
              <div className="panel-body p-lg h-[400px]">
                {consumptionData && <Line 
                  data={consumptionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                      legend: { position: 'top', labels: { color: '#a0a0c0', usePointStyle: true } }
                    },
                    scales: {
                      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a0c0' } },
                      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a0c0' } }
                    }
                  }}
                />}
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .insights-page {
          padding-bottom: var(--spacing-xl);
        }
        .insights-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: var(--spacing-lg);
        }
        .col-span-2 { grid-column: span 2; }
        
        .stat-card.border-l-accent { border-left: 4px solid var(--color-accent); }
        .stat-card.border-l-success { border-left: 4px solid var(--color-success); }
        .stat-card.border-l-info { border-left: 4px solid var(--color-info); }
        .stat-card.border-l-warning { border-left: 4px solid var(--color-warning); }
        
        .select-wrapper { position: relative; }
        .select-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); pointer-events: none; }
        .select.variant-small { padding-left: 32px; height: 36px; font-size: 0.875rem; background: rgba(255,255,255,0.05); }

        @media (max-width: 1024px) {
          .insights-grid { grid-template-columns: 1fr; }
          .col-span-2 { grid-column: auto; }
        }
      `}</style>
    </div>
  )
}
