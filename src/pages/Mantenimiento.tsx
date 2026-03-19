import { Settings } from 'lucide-react'

export default function Mantenimiento() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-muted">
      <Settings size={48} className="animate-spin-slow mb-md opacity-20" />
      <h2 className="text-xl font-black uppercase tracking-widest opacity-40">Módulo en Reconstrucción</h2>
      <p className="text-sm">Esperando nuevas especificaciones...</p>
    </div>
  )
}
