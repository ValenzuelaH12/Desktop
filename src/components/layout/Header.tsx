import { Bell, Search, Menu, X, AlertTriangle, Clock, ChevronRight, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { db } from '../../lib/db'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext'
import { MessageSquare } from 'lucide-react'
import { HotelSelector } from './HotelSelector'

export default function Header({ toggleSidebar }) {
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const { totalUnread: totalChatUnread, chatNotifications, dismissNotification, clearChannelUnread } = useNotifications()
  const [seenNotificationIds, setSeenNotificationIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('vsuite_seen_notifications')
    return saved ? JSON.parse(saved) : []
  })

  // Search global
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const fetchNotifications = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: incs } = await supabase
        .from('incidencias')
        .select('id, title, priority, created_at')
        .in('status', ['pending', 'in-progress'])
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: mantos } = await supabase
        .from('mantenimiento_preventivo')
        .select('id, titulo, proxima_fecha')
        .lte('proxima_fecha', today)
        .limit(5)

      const formattedNotifications = [
        ...chatNotifications.map(n => ({ ...n, icon: MessageSquare })),
        ...(incs || []).map(i => ({
          id: `inc-${i.id}`, type: 'incidencia', title: i.title,
          subtitle: `Prioridad ${i.priority}`,
          time: new Date(i.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          link: '/incidencias', icon: AlertTriangle,
          color: i.priority === 'high' ? 'danger' : 'warning'
        })),
        ...(mantos || []).map(m => ({
          id: `manto-${m.id}`, type: 'mantenimiento', title: m.titulo,
          subtitle: `Vence: ${m.proxima_fecha}`, time: 'Hoy',
          link: '/planificacion', icon: Clock, color: 'info'
        }))
      ]
      setNotifications(formattedNotifications.filter(n => !seenNotificationIds.includes(n.id)))
    } catch (error) { console.error('Error fetching notifications:', error) }
  }

  const handleNotificationClick = (n) => {
    // Si es chat, limpiar unread del canal
    if (n.type === 'chat') {
      const channelId = n.title.replace('Mensaje en ', '')
      clearChannelUnread(channelId)
    }
    
    // Marcar como vista (para persistencia local)
    const newSeen = [...seenNotificationIds, n.id]
    setSeenNotificationIds(newSeen)
    localStorage.setItem('vsuite_seen_notifications', JSON.stringify(newSeen))
    
    // Remover del estado global si es de chat
    dismissNotification(n.id)
    
    navigate(n.link)
    setShowNotifications(false)
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    
    // Listeners de Red
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [seenNotificationIds])

  useEffect(() => {
    const fetchPendingCount = async () => {
      const count = await db.offline_mutations.count();
      setPendingSyncCount(count);
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      setShowSearch(false)
      return
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      setShowSearch(true)
      const q = searchQuery.trim().toLowerCase()
      const results = []
      try {
        const { data: incs } = await supabase
          .from('incidencias')
          .select('id, title, location, status, priority')
          .or(`title.ilike.%${q}%,location.ilike.%${q}%`)
          .limit(5)
        if (incs) results.push(...incs.map(i => ({ ...i, _type: 'incidencia', _link: '/incidencias' })))

        const { data: inv } = await supabase
          .from('inventario')
          .select('id, nombre, categoria, stock_actual')
          .or(`nombre.ilike.%${q}%,categoria.ilike.%${q}%`)
          .limit(5)
        if (inv) results.push(...inv.map(i => ({ ...i, _type: 'inventario', _link: '/inventario' })))

        const { data: rooms } = await supabase
          .from('habitaciones')
          .select('id, nombre')
          .ilike('nombre', `%${q}%`)
          .limit(5)
        if (rooms) results.push(...rooms.map(r => ({ ...r, _type: 'habitacion', _link: '/configuracion' })))

      } catch(e) { console.error(e) }
      setSearchResults(results)
      setSearchLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearchSelect = (link) => {
    navigate(link)
    setSearchQuery('')
    setShowSearch(false)
  }

  return (
    <header className="header glass border-b">
      <div className="header-left">
        <button className="btn-icon btn-ghost mobile-menu-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>

        <div className="search-bar" style={{ position: 'relative' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar incidencias, habitaciones, inventario..." 
            className="search-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
          />
          {showSearch && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'rgba(15,15,35,0.97)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 200,
              maxHeight: '320px', overflowY: 'auto'
            }}>
              {searchLoading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#6b6b8d', fontSize: '0.8rem' }}>Buscando...</div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#6b6b8d', fontSize: '0.8rem' }}>Sin resultados para "{searchQuery}"</div>
              ) : (
                searchResults.map((r, idx) => (
                  <div key={idx} style={{
                    padding: '0.6rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s'
                  }} onMouseDown={() => handleSearchSelect(r._link)}
                     onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                     onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '2px 6px', borderRadius: '4px', flexShrink: 0,
                      background: r._type === 'incidencia' ? 'rgba(239,68,68,0.15)' : r._type === 'inventario' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                      color: r._type === 'incidencia' ? '#f87171' : r._type === 'inventario' ? '#4ade80' : '#a5b4fc'
                    }}>{r._type === 'incidencia' ? 'INC' : r._type === 'inventario' ? 'INV' : 'HAB'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title || r.nombre}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6b6b8d' }}>
                        {r._type === 'incidencia' ? `${r.location} · ${r.status}` : r._type === 'inventario' ? `${r.categoria} · Stock: ${r.stock_actual}` : ''}
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: '#6b6b8d', flexShrink: 0 }} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* NETWORK STATUS INDICATOR */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isOnline ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'}`}>
          {isOnline ? (
            <>
              <Wifi size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider hidden md:block">Online</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider">Modo Offline</span>
            </>
          )}
          {pendingSyncCount > 0 && (
            <div className="flex items-center gap-1.5 pl-2 ml-2 border-l border-current">
              <RefreshCw size={12} className="animate-spin" />
              <span className="text-[10px] font-bold">{pendingSyncCount}</span>
            </div>
          )}
        </div>

        <HotelSelector />
        <div className="relative">
          <button 
            className={`notification-btn relative ${showNotifications ? 'active' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {(notifications.length + totalChatUnread) > 0 && (
              <span className="notification-badge">{notifications.length + totalChatUnread}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown glass animate-slide-down">
              <div className="dropdown-header">
                <h3>Notificaciones</h3>
                <span className="badge badge-neutral text-xxs">{notifications.length + totalChatUnread} Pendientes</span>
              </div>
              
              <div className="dropdown-body">
                {notifications.length === 0 ? (
                  <div className="p-xl text-center text-muted">
                    <p className="text-sm">No tienes notificaciones pendientes</p>
                  </div>
                ) : (
                  notifications.map(n => {
                    const Icon = n.icon
                    return (
                      <div 
                        key={n.id} 
                        className="notification-item"
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className={`notification-icon text-${n.color}`}>
                          <Icon size={18} />
                        </div>
                        <div className="notification-content">
                          <p className="notification-title">{n.title}</p>
                          <p className="notification-subtitle">{n.subtitle}</p>
                          <span className="notification-time">{n.time}</span>
                        </div>
                        <ChevronRight size={14} className="text-muted" />
                      </div>
                    )
                  })
                )}
              </div>
              
              <div className="dropdown-footer">
                <button className="btn btn-ghost btn-sm w-full" onClick={() => setShowNotifications(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .header {
          height: var(--header-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--spacing-lg);
          position: fixed;
          top: 0;
          right: 0;
          left: var(--sidebar-width);
          z-index: 90;
          background: rgba(10, 10, 26, 0.6) !important;
        }

        .border-b { border-bottom: 1px solid var(--color-border); }

        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .search-bar {
          position: relative;
          display: flex;
          align-items: center;
          width: 300px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: var(--color-text-muted);
        }

        .search-input {
          width: 100%;
          padding: 0.625rem 1rem 0.625rem 2.5rem;
          background: var(--color-bg-input);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          transition: all var(--transition-fast);
        }

        .search-input:focus {
          border-color: var(--color-accent);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px var(--color-accent-light);
        }

        .notification-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
          background: var(--color-bg-glass);
          border: 1px solid var(--color-border);
        }

        .notification-btn:hover {
          color: var(--color-text-primary);
          background: var(--color-bg-glass-hover);
          transform: translateY(-1px);
        }
        
        .relative { position: relative; }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--color-danger);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid var(--color-bg-primary);
          animation: pulse 2s infinite;
        }

        .mobile-menu-btn {
          display: none;
        }

        .notification-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 320px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-2xl);
          background: rgba(15, 15, 35, 0.95);
          backdrop-filter: blur(12px);
          overflow: hidden;
          z-index: 100;
        }

        .dropdown-header {
          padding: var(--spacing-md) var(--spacing-lg);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.03);
        }

        .dropdown-header h3 {
          font-size: var(--font-size-sm);
          font-weight: 700;
        }

        .dropdown-body {
          max-height: 360px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
          padding: var(--spacing-md) var(--spacing-lg);
          border-bottom: 1px solid var(--color-border);
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .notification-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }

        .notification-content {
          flex: 1;
        }

        .notification-title {
          font-size: var(--font-size-sm);
          font-weight: 600;
          margin-bottom: 2px;
          color: var(--color-text-primary);
        }

        .notification-subtitle {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-bottom: 4px;
        }

        .notification-time {
          font-size: 0.7rem;
          color: var(--color-accent);
          font-weight: 600;
        }

        .dropdown-footer {
          padding: var(--spacing-sm);
          background: rgba(0, 0, 0, 0.1);
          border-top: 1px solid var(--color-border);
        }

        .text-danger { color: #f87171; }
        .text-warning { color: #fbbf24; }
        .text-info { color: #38bdf8; }
        .text-xxs { font-size: 0.65rem; }

        @media (max-width: 768px) {
          .header {
            left: 0;
            padding: 0 var(--spacing-md);
          }
          .mobile-menu-btn {
            display: flex;
          }
          .search-bar {
            display: none;
          }
          .notification-dropdown {
            position: fixed;
            top: var(--header-height);
            right: var(--spacing-md);
            left: var(--spacing-md);
            width: auto;
            max-width: calc(100vw - 2 * var(--spacing-md));
          }
        }
      `}</style>
    </header>
  )
}
