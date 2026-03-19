import { useEffect, useState } from 'react'
import { dbService, OfflineSync } from '../lib/db'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'

export const SyncManager = () => {
  const toast = useToast()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncData()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Intento inicial de sincronización si estamos online
    if (navigator.onLine) {
      syncData()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncData = async () => {
    const queue = await dbService.getSyncQueue()
    if (queue.length === 0) return

    console.log(`[SyncManager] Sincronizando ${queue.length} elementos...`)
    let successCount = 0
    let failCount = 0
    
    for (const item of queue) {
      try {
        let error = null
        
        if (item.action === 'insert') {
          const { error: insertError } = await supabase.from(item.table).insert([item.data])
          error = insertError
        } else if (item.action === 'update') {
          // Si hay una tabla específica con ID, lo usamos. 
          // En Supabase, update necesita un filtro.
          const id = item.data.id
          const { error: updateError } = await supabase.from(item.table).update(item.data).eq('id', id)
          error = updateError
        } else if (item.action === 'delete') {
          const id = item.data.id
          const { error: deleteError } = await supabase.from(item.table).delete().eq('id', id)
          error = deleteError
        }

        if (!error) {
          await dbService.removeFromSyncQueue(item.id!)
          successCount++
        } else {
          console.error(`[SyncManager] Error en elemento ${item.id} (${item.table}):`, error)
          failCount++
        }
      } catch (err) {
        console.error(`[SyncManager] Fallo crítico en elemento ${item.id}:`, err)
        failCount++
      }
    }

    if (successCount > 0) {
      toast.success(`Sincronización: ${successCount} cambios enviados correctamente.`)
    }
    if (failCount > 0) {
      toast.error(`Sincronización: ${failCount} elementos fallaron. Se reintentarán más tarde.`)
    }
  }

  return null // Componente puramente lógico
}
