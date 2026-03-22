import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileNav from './MobileNav'
import QuickActions from './QuickActions'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Layout() {
  const { profile } = useAuth()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'))

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  useEffect(() => {
    if (!profile) return

    // Solicitar permiso de notificaciones
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [profile])

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''} text-primary bg-primary`}>
      <div className="bg-animated"></div>
      
      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
      
      <div className="main-wrapper">
        <Header toggleSidebar={toggleSidebar} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <MobileNav />
      <QuickActions />

      {/* Overlay para cerrar sidebar en móvil */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={closeSidebar}
      ></div>

      <style>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .main-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-left: var(--sidebar-width);
          min-height: 100vh;
          width: 100%;
          transition: margin-left 0.4s ease;
        }

        .main-content {
          flex: 1;
          padding: calc(var(--header-height) + var(--spacing-xl)) var(--spacing-xl);
          width: 100%;
        }

        @media (max-width: 768px) {
          .main-wrapper {
            margin-left: 0;
          }
          .main-content {
            padding: calc(var(--header-height) + var(--spacing-md)) var(--spacing-md) 100px;
          }
        }
      `}</style>
    </div>
  )
}
