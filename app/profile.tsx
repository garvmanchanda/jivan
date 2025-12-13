import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getProfiles,
  getActiveProfileId,
  getVitals,
  saveVital,
  getConversations,
  deleteProfile,
  updateProfileAge,
} from '../services/supabaseStorage';
import { Profile, Vital, Conversation } from '../types';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingVital, setEditingVital] = useState<{
    type: string;
    label: string;
    unit: string;
    isDaily: boolean;
  } | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    const profileId = await getActiveProfileId();
    if (!profileId) return;

    const profiles = await getProfiles();
    const currentProfile = profiles.find(p => p.id === profileId);
    setProfile(currentProfile || null);

    const profileVitals = await getVitals(profileId);
    setVitals(profileVitals);

    const profileConversations = await getConversations(profileId);
    setConversations(profileConversations.slice(0, 10)); // Last 10
  };

  const handleEditVital = (type: string, label: string, unit: string, isDaily: boolean, currentValue?: number) => {
    setEditingVital({ type, label, unit, isDaily });
    setEditValue(currentValue ? currentValue.toString() : '');
    setEditModalVisible(true);
  };

  const handleSaveVital = async () => {
    if (!profile || !editingVital || !editValue) {
      Alert.alert('Error', 'Please enter a value');
      return;
    }

    const value = parseFloat(editValue);
    if (isNaN(value)) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    const newVital: Vital = {
      type: editingVital.type as any,
      value,
      unit: editingVital.unit,
      date: new Date().toISOString(),
      isDaily: editingVital.isDaily,
    };

    await saveVital(profile.id, newVital);
    
    // If updating age, also update the profile's age field
    if (editingVital.type === 'age') {
      await updateProfileAge(profile.id, Math.floor(value));
    }
    
    setEditModalVisible(false);
    setEditValue('');
    setEditingVital(null);
    loadProfileData();
  };

  const handleDeleteProfile = () => {
    if (!profile) return;

    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete ${profile.name}'s profile? You will not be able to recover this data.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfile(profile.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete profile. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Define all vital types
  const vitalTypes = [
    { type: 'weight', label: 'Weight', unit: 'kg', isDaily: false },
    { type: 'height', label: 'Height', unit: 'cm', isDaily: false },
    { type: 'age', label: 'Age', unit: 'years', isDaily: false },
    { type: 'sleep', label: 'Sleep', unit: 'hrs', isDaily: true },
    { type: 'water', label: 'Water', unit: 'glasses', isDaily: true },
    { type: 'alcohol', label: 'Alcohol', unit: 'drinks', isDaily: true },
    { type: 'cigarettes', label: 'Cigarettes', unit: 'count', isDaily: true },
    { type: 'steps', label: 'Steps', unit: 'steps', isDaily: true },
  ];

  // Get latest vitals by type
  const getLatestVital = (type: string) => {
    const filtered = vitals.filter(v => v.type === type);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  };

  // Get today's vitals (for daily tracking)
  const getTodayVital = (type: string) => {
    const today = new Date().toDateString();
    const filtered = vitals.filter(v => v.type === type && new Date(v.date).toDateString() === today);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  };

  // Separate static and daily vitals
  const staticVitals = vitalTypes.filter(v => !v.isDaily);
  const dailyVitals = vitalTypes.filter(v => v.isDaily);

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteProfile}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileAge}>{profile.age} years</Text>
        </View>

        {/* Health Journey Banner */}
        <TouchableOpacity
          style={styles.journeyBanner}
          onPress={() => router.push({
            pathname: '/health-journey',
            params: { profileId: profile.id, profileName: profile.name },
          })}
        >
          <View style={styles.journeyContent}>
            <Text style={styles.journeyIcon}>🌟</Text>
            <View style={styles.journeyText}>
              <Text style={styles.journeyTitle}>View Health Journey</Text>
              <Text style={styles.journeySubtitle}>Track issues, insights & timeline</Text>
            </View>
            <Text style={styles.journeyArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Static Vitals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFILE INFO</Text>
          {staticVitals.map((vitalType) => {
            const vital = getLatestVital(vitalType.type);
            return (
              <TouchableOpacity
                key={vitalType.type}
                style={styles.vitalRow}
                onPress={() => handleEditVital(vitalType.type, vitalType.label, vitalType.unit, false, vital?.value)}
              >
                <Text style={styles.vitalRowLabel}>{vitalType.label}</Text>
                <View style={styles.vitalRowRight}>
                  <Text style={styles.vitalRowValue}>
                    {vital ? `${vital.value} ${vitalType.unit}` : 'Add'}
                  </Text>
                  <Text style={styles.vitalRowEdit}>✎</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Daily Tracking Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S TRACKING</Text>
            <TouchableOpacity onPress={() => router.push('/tracking-history')}>
              <Text style={styles.viewHistoryLink}>View History →</Text>
            </TouchableOpacity>
          </View>
          {dailyVitals.map((vitalType) => {
            const vital = getTodayVital(vitalType.type);
            return (
              <TouchableOpacity
                key={vitalType.type}
                style={styles.vitalRow}
                onPress={() => handleEditVital(vitalType.type, vitalType.label, vitalType.unit, true, vital?.value)}
              >
                <Text style={styles.vitalRowLabel}>{vitalType.label}</Text>
                <View style={styles.vitalRowRight}>
                  <Text style={styles.vitalRowValue}>
                    {vital ? `${vital.value} ${vitalType.unit}` : 'Add'}
                  </Text>
                  <Text style={styles.vitalRowEdit}>✎</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent Conversations */}
        {conversations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENT</Text>
            {conversations.map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={styles.conversationItem}
                onPress={() => router.push({
                  pathname: '/response',
                  params: { conversationId: conv.id },
                })}
              >
                <Text style={styles.conversationTime}>
                  {new Date(conv.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.conversationText} numberOfLines={1}>
                  {conv.query}
                </Text>
                <Text style={styles.viewDetails}>View details →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingVital ? `Edit ${editingVital.label}` : 'Edit Vital'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={`Enter ${editingVital?.label.toLowerCase()} in ${editingVital?.unit}`}
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={editValue}
              onChangeText={setEditValue}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditValue('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveVital}
              >
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 0,
  },
  backText: {
    color: '#7c3aed',
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    marginBottom: 32,
  },
  profileName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileAge: {
    color: '#666',
    fontSize: 16,
  },
  journeyBanner: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  journeyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  journeyText: {
    flex: 1,
  },
  journeyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  journeySubtitle: {
    color: '#4A90E2',
    fontSize: 13,
  },
  journeyArrow: {
    color: '#4A90E2',
    fontSize: 24,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  viewHistoryLink: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '600',
  },
  vitalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  vitalRowLabel: {
    color: '#fff',
    fontSize: 16,
  },
  vitalRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vitalRowValue: {
    color: '#ccc',
    fontSize: 16,
    marginRight: 8,
  },
  vitalRowEdit: {
    color: '#7c3aed',
    fontSize: 18,
  },
  conversationItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  conversationTime: {
    color: '#7c3aed',
    fontSize: 12,
    marginBottom: 4,
  },
  conversationText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  viewDetails: {
    color: '#7c3aed',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#2a2a2a',
    marginRight: 8,
  },
  modalButtonSave: {
    backgroundColor: '#7c3aed',
    marginLeft: 8,
  },
  modalButtonText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSave: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

