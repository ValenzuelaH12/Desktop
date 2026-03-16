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

    console.log(`Iniciando sincronización de ${queue.length} elementos...`)
    
    for (const item of queue) {
      try {
        let error = null
        
        if (item.action === 'insert') {
          const { error: insertError } = await supabase.from(item.table).insert([item.data])
          error = insertError
        } else if (item.action === 'update') {
          const { error: updateError } = await supabase.from(item.table).update(item.data).eq('id', item.data.id)
          error = updateError
        }

        if (!error) {
          await dbService.removeFromSyncQueue(item.id!)
          console.log(`Elemento ${item.id} sincronizado con éxito.`)
        } else {
          console.error(`Error sincronizando elemento ${item.id}:`, error)
        }
      } catch (err) {
        console.error(`Fallo crítico en sincronización de elemento ${item.id}:`, err)
      }
    }

    toast.success('Sincronización finalizada. Todos los datos están al día.')
  }

  return null // Componente puramente lógico
}
