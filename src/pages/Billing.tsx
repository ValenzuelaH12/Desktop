import { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Check, 
  Shield, 
  Clock, 
  Zap, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { paymentService, SubscriptionInfo } from '../services/paymentService'
import { planService } from '../services/planService'
import { usePlanes } from '../hooks/usePlanes'

export default function Billing() {
  const { profile } = useAuth()
  const { planes, isLoading: planesLoading } = usePlanes()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const iconMap: Record<string, any> = {
    Clock, Zap, Shield, TrendingUp, AlertCircle
  }

  useEffect(() => {
    loadData()
  }, [profile?.hotel_id])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const subData = profile?.hotel_id ? await paymentService.getSubscriptionInfo(profile.hotel_id) : null
      setSubscription(subData)
    } catch (err) {
      console.error('Error loading billing data:', err)
    } finally {
      setIsLoading(false)
    }
  }


  const handleSubscribe = async (plan: string) => {
    try {
      const checkoutUrl = await paymentService.createCheckoutSession(profile.hotel_id, `${plan}_${billingCycle}`)
      window.location.href = checkoutUrl
    } catch (err) {
      alert('Error al iniciar el pago con Stripe. Por favor, contacte a soporte.')
    }
  }

  if (isLoading || planesLoading) return <div className="p-xl text-center">Cargando facturación...</div>

  return (
    <div className="p-lg md:p-xl space-y-xl animate-fade-in max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-lg">
        <div className="flex items-center gap-lg">
          <div className="p-3 bg-primary/20 text-primary rounded-2xl border border-primary/30">
            <CreditCard size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
              V-<span className="text-primary">BILLING</span>
            </h1>
            <p className="text-muted text-sm font-bold uppercase tracking-widest opacity-60">Escala tu hotel al siguiente nivel</p>
          </div>
        </div>

        {/* Toggle Facturación */}
        <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10">
          <button 
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${billingCycle === 'monthly' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-white'}`}
          >
            MENSUAL
          </button>
          <button 
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${billingCycle === 'yearly' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-white'}`}
          >
            ANUAL <span className="ml-1 text-[8px] text-success opacity-80">-20%</span>
          </button>
        </div>
      </div>

      {subscription?.subscription_status === 'past_due' && (
        <div className="p-lg bg-danger/10 border border-danger/20 rounded-2xl flex items-center gap-md">
          <AlertCircle className="text-danger" size={24} />
          <div className="flex-1">
            <h4 className="text-white font-bold text-sm uppercase">Atención: Pago Pendiente</h4>
            <p className="text-muted text-xs">Actualiza tu método de pago para mantener el acceso Pro.</p>
          </div>
        </div>
      )}

      {/* Grid de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {planes.map((p) => {
          const price = billingCycle === 'monthly' ? p.precio_mensual : p.precio_anual
          const Icon = iconMap[p.icon] || Zap
          return (
            <div 
              key={p.id} 
              className={`v-glass-card p-xl relative overflow-hidden transition-all duration-500 hover:scale-[1.02] border border-white/5 ${
                p.destacado ? 'border-accent/40 bg-accent/5 shadow-[0_0_40px_rgba(99,102,241,0.1)]' : ''
              }`}
            >
              <div className="flex flex-col h-full gap-xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl bg-${p.color}/10 text-${p.color} border border-${p.color}/20`}>
                      <Icon size={26} />
                    </div>
                    {p.destacado && (
                      <span className="bg-accent text-white text-[8px] font-black p-1 px-3 rounded-full tracking-widest uppercase">
                        RECOMENDADO
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{p.nombre}</h3>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1 italic">{p.descripcion}</p>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="text-4xl font-black text-white">{price}€</span>
                      <span className="text-muted text-[10px] font-black uppercase tracking-widest">/ Mes</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="text-[10px] text-success font-bold uppercase mt-1">Facturado anualmente</div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <ul className="space-y-3">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted/80">
                        <Check size={14} className="text-success mt-1 shrink-0" />
                        <span className="text-xs font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={() => handleSubscribe(p.id)}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
                    p.destacado 
                      ? 'v-button-primary shadow-lg shadow-accent/20' 
                      : 'v-button-secondary border border-white/10'
                  } ${subscription?.plan === p.id ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105'}`}
                  disabled={subscription?.plan === p.id}
                >
                  {subscription?.plan === p.id ? 'Membresía Actual' : `Elegir ${p.nombre}`}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detalles de la suscripción actual */}
      {subscription && (
        <div className="v-glass-card p-lg border-t-4 border-primary">
          <div className="flex flex-col md:flex-row justify-between items-center gap-md">
            <div className="flex items-center gap-md">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <TrendingUp size={24} className="text-primary" />
              </div>
              <div>
                <h4 className="text-white font-bold uppercase tracking-tight">Estado de Cuenta</h4>
                <p className="text-muted text-xs font-medium">Hotel ID: {profile?.hotel_id}</p>
              </div>
            </div>
            
            <div className="flex gap-xl text-center md:text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Plan Actual</span>
                <div className="text-white font-bold uppercase">{subscription.plan}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Renovación</span>
                <div className="text-white font-bold">
                  {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'Próximamente'}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Estado</span>
                <div>
                  <span className={`badge ${subscription.subscription_status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {subscription.subscription_status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
