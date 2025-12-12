import { create } from 'zustand';
import { FamilyMember } from '../types';
import { getFamilyMembers, createFamilyMember, updateFamilyMember } from '../services/api';

interface ProfileState {
  profiles: FamilyMember[];
  activeProfileId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Computed
  activeProfile: () => FamilyMember | null;
  
  // Actions
  fetchProfiles: () => Promise<void>;
  setActiveProfile: (profileId: string) => void;
  addProfile: (profile: Omit<FamilyMember, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<FamilyMember>;
  updateProfile: (id: string, updates: Partial<FamilyMember>) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  isLoading: false,
  error: null,

  activeProfile: () => {
    const { profiles, activeProfileId } = get();
    return profiles.find((p) => p.id === activeProfileId) ?? null;
  },

  fetchProfiles: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const profiles = await getFamilyMembers();
      
      set({ 
        profiles,
        isLoading: false,
        // Set first profile as active if none selected
        activeProfileId: get().activeProfileId ?? profiles[0]?.id ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch profiles';
      set({ isLoading: false, error: message });
    }
  },

  setActiveProfile: (profileId: string) => {
    set({ activeProfileId: profileId });
  },

  addProfile: async (profile) => {
    set({ isLoading: true, error: null });
    
    try {
      const newProfile = await createFamilyMember(profile);
      
      set((state) => ({ 
        profiles: [...state.profiles, newProfile],
        isLoading: false,
      }));
      
      return newProfile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create profile';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  updateProfile: async (id: string, updates: Partial<FamilyMember>) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedProfile = await updateFamilyMember(id, updates);
      
      set((state) => ({ 
        profiles: state.profiles.map((p) => 
          p.id === id ? updatedProfile : p
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      set({ isLoading: false, error: message });
      throw error;
    }
  },
}));

