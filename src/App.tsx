import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Incidencias from './pages/Incidencias'
import Chat from './pages/Chat'
import Controles from './pages/Controles'
import Billing from './pages/Billing'
import Configuracion from './pages/Configuracion'
import Lecturas from './pages/Lecturas'
import Inventory from './pages/Inventory'
import Inspecciones from './pages/Inspecciones'
import Calendario from './pages/Calendario'
import VInsights from './pages/VInsights'
import GuestPortal from './pages/GuestPortal'
import AssetDetail from './pages/AssetDetail'
import SuperAdmin from './pages/SuperAdmin'

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Cargando V-Suite...</p>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  return children
}

// Bloqueo por suscripción
const SubscriptionGuard = ({ children }) => {
  const { activeHotel, loading, profile } = useAuth()
  const location = useLocation()
  
  if (loading) return null
  
  // Evitar bucle si ya estamos en billing
  if (location.pathname === '/billing') return children
  
  // Super Admins y Direccion siempre acceden (para evitar bloqueos totales accidentales)
  if (profile?.rol === 'super_admin' || profile?.rol === 'direccion') return children
  
  const isActive = activeHotel?.subscription_status === 'active' || 
                   activeHotel?.subscription_status === 'trialing'
                   
  if (!isActive) {
    return <Navigate to="/billing" replace />
  }
  
  return children
}

// Componente para proteger por permisos
const PermissionRoute = ({ children, moduleId }) => {
  const { profile, loading } = useAuth()
  
  if (loading) return null
  
  // Admins tienen acceso total
  if (profile?.rol === 'admin' || profile?.rol === 'direccion' || profile?.rol === 'super_admin') {
    return children
  }
  
  // Si no tiene el permiso, redirigir al dashboard
  if (!profile?.permisos?.includes(moduleId)) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Iniciando sesión...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" /> : <Login />} 
      />
      
      {/* Rutas Públicas para Huéspedes */}
      <Route path="/guest" element={<GuestPortal />} />
      <Route path="/guest/:room" element={<GuestPortal />} />
      <Route path="/guest/:hotelId/:room" element={<GuestPortal />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <SubscriptionGuard>
            <Layout />
          </SubscriptionGuard>
        </ProtectedRoute>
      }>
        <Route index element={<PermissionRoute moduleId="dashboard"><Dashboard /></PermissionRoute>} />
        <Route path="superadmin" element={<PermissionRoute moduleId="cadenas"><SuperAdmin /></PermissionRoute>} />
        <Route path="incidencias" element={<PermissionRoute moduleId="incidencias"><Incidencias /></PermissionRoute>} />
        <Route path="chat" element={<PermissionRoute moduleId="chat"><Chat /></PermissionRoute>} />
        <Route path="billing" element={<Billing />} />
        <Route path="controles" element={<Controles />} />
        <Route path="configuracion" element={<PermissionRoute moduleId="configuracion"><Configuracion /></PermissionRoute>} />
        <Route path="lecturas" element={<PermissionRoute moduleId="lecturas"><Lecturas /></PermissionRoute>} />
        <Route path="inventario" element={<PermissionRoute moduleId="inventario"><Inventory /></PermissionRoute>} />
        <Route path="inspecciones" element={<PermissionRoute moduleId="inspecciones"><Inspecciones /></PermissionRoute>} />
        <Route path="calendario" element={<PermissionRoute moduleId="inspecciones"><Calendario /></PermissionRoute>} />
        <Route path="insights" element={<PermissionRoute moduleId="insights"><VInsights /></PermissionRoute>} />
        <Route path="asset/:id" element={<AssetDetail />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

import { ToastProvider } from './components/Toast'
import { SyncManager } from './components/SyncManager'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de caché por defecto
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <SyncManager />
              <AppRoutes />
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
