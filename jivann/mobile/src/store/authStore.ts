import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { analytics } from '../services/analytics';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth initialization error:', error);
        set({ isLoading: false, isInitialized: true });
        return;
      }
      
      if (session) {
        set({ 
          user: session.user, 
          session,
          isLoading: false,
          isInitialized: true,
        });
        
        // Initialize analytics with user
        analytics.initialize(session.user.id);
        analytics.identify(session.user.id, {
          email: session.user.email,
        });
      } else {
        set({ isLoading: false, isInitialized: true });
      }
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ 
          user: session?.user ?? null, 
          session,
        });
        
        if (session?.user) {
          analytics.identify(session.user.id);
        } else {
          analytics.reset();
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ 
        user: data.user, 
        session: data.session,
        isLoading: false,
      });
      
      analytics.initialize(data.user.id);
      analytics.identify(data.user.id, { email });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        set({ 
          user: data.user, 
          session: data.session,
          isLoading: false,
        });
        
        analytics.initialize(data.user.id);
        analytics.identify(data.user.id, { email, full_name: fullName });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    
    try {
      await supabase.auth.signOut();
      analytics.reset();
      set({ 
        user: null, 
        session: null,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));

