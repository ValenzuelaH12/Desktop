import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

import { Profile, Hotel } from '../types'

import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  activeHotelId: string | null;
  activeHotel: Hotel | null;
  setActiveHotelId: (id: string | null) => void;
  availableHotels: Hotel[];
  refreshHotels: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null)
  const [availableHotels, setAvailableHotels] = useState<Hotel[]>([])

  useEffect(() => {
    // Obtener sesión actual
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfileData(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Error fetching session:', err)
        setLoading(false)
      }
    }

    const fetchProfileData = async (userId: string) => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', userId)
          .single()
          
        if (profileError) {
          console.error('Error fetching profile:', profileError)
          return;
        } 

        setProfile(profileData as Profile)

        // Fetch accessible hotels (RLS will automatically filter this down dynamically)
        // If super_admin, it returns all 8. If normal staff, it returns only their 1 hotel.
        const { data: hotelsData, error: hotelsError } = await supabase
          .from('hoteles')
          .select('*')
          .order('nombre');

        if (!hotelsError && hotelsData) {
          setAvailableHotels(hotelsData as Hotel[]);
          // Default to the user's primary hotel if available, otherwise just pick the first one from the list.
          const defaultHotel = profileData.hotel_id || (hotelsData.length > 0 ? hotelsData[0].id : null);
          setActiveHotelId(defaultHotel);
        }

      } catch (error) {
        console.error('Error in fetchProfileData:', error)
      } finally {
        setLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfileData(session.user.id)
        } else {
          setProfile(null)
          setActiveHotelId(null)
          setAvailableHotels([])
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

    const refreshHotels = async () => {
      try {
        const { data: hotelsData, error: hotelsError } = await supabase
          .from('hoteles')
          .select('*')
          .order('nombre');

        if (!hotelsError && hotelsData) {
          setAvailableHotels(hotelsData as Hotel[]);
        }
      } catch (error) {
        console.error('Error refreshing hotels:', error);
      }
    };

  const activeHotel = availableHotels.find(h => h.id === activeHotelId) || null;

    return (
      <AuthContext.Provider value={{ 
        user, profile, loading, activeHotelId, activeHotel, setActiveHotelId, 
        availableHotels, refreshHotels, signIn, signOut 
      }}>
        {children}
      </AuthContext.Provider>
    )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
