import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  getProfiles,
  getActiveProfileId,
  setActiveProfileId,
} from '../services/supabaseStorage';
import { Profile } from '../types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfile] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  // Reload profiles when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadProfiles();
    }, [])
  );

  const loadProfiles = async () => {
    const loadedProfiles = await getProfiles();
    setProfiles(loadedProfiles);
    
    if (loadedProfiles.length > 0) {
      const active = await getActiveProfileId();
      
      // If no active profile or active profile doesn't exist, select first one
      const activeExists = active && loadedProfiles.some(p => p.id === active);
      
      if (!active || !activeExists) {
        // Auto-select first profile
        const firstProfileId = loadedProfiles[0].id;
        setActiveProfile(firstProfileId);
        await setActiveProfileId(firstProfileId);
        console.log('Auto-selected first profile:', loadedProfiles[0].name);
      } else {
        setActiveProfile(active);
      }
    }
  };

  const handleProfileSelect = async (profileId: string) => {
    setActiveProfile(profileId);
    await setActiveProfileId(profileId);
  };

  const handleMicPress = () => {
    if (!activeProfileId) return;
    router.push('/record');
  };

  const handleProfilePress = () => {
    if (!activeProfileId) return;
    router.push('/profile');
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  return (
    <View style={styles.container}>
      {/* Profile Selector */}
      <View style={styles.profileSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.profilePill,
                activeProfileId === profile.id && styles.profilePillActive,
              ]}
              onPress={() => handleProfileSelect(profile.id)}
            >
              <Text
                style={[
                  styles.profileText,
                  activeProfileId === profile.id && styles.profileTextActive,
                ]}
              >
                {profile.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            style={styles.profilePillAdd}
            onPress={() => router.push('/add-profile')}
          >
            <Text style={styles.profileText}>+</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Center Mic Button */}
      <View style={styles.centerSection}>
        <TouchableOpacity style={styles.micButton} onPress={handleMicPress}>
          <View style={styles.micIcon}>
            <Text style={styles.micIconText}>🎤</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.helpText}>How can I help?</Text>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomSection}>
        <TouchableOpacity onPress={handleProfilePress}>
          <Text style={styles.linkText}>Profile & Insights →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  profilePill: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    marginRight: 12,
  },
  profilePillActive: {
    backgroundColor: '#7c3aed',
  },
  profilePillAdd: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    marginRight: 12,
  },
  profileText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  profileTextActive: {
    color: '#fff',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  micIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIconText: {
    fontSize: 60,
  },
  helpText: {
    marginTop: 24,
    fontSize: 18,
    color: '#666',
  },
  bottomSection: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  linkText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '600',
  },
});

