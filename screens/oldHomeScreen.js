import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Modal,
  TextInput,
  Alert,
  RefreshControl 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRecentActivities } from '../services/activityService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const theme = useTheme();
  
  // State for modals and contacts
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [tipsModalVisible, setTipsModalVisible] = useState(false);
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Dr. Empleo', phone: '+63 912 345 6789', relation: 'Primary Care' },
    { id: 2, name: 'Emergency', phone: '911', relation: 'Emergency' }
  ]);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', relation: '' });
  const [recentActivities, setRecentActivities] = useState([]);
  const [medicationsCount, setMedicationsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Pre-written healthcare tips
  const healthTips = [
    "Drink at least 8 glasses of water daily to stay hydrated.",
    "Get at least 7-8 hours of sleep each night for optimal health.",
    "Wash your hands frequently to prevent the spread of germs.",
    "Exercise for at least 30 minutes most days of the week.",
    "Eat a balanced diet with plenty of fruits and vegetables."
  ];

  // Load data from storage
  const loadData = async () => {
    setRefreshing(true);
    try {
      // Load activities using the service
      const activities = await getRecentActivities();
      setRecentActivities(activities);

      // Load medications count
      const savedMedications = await AsyncStorage.getItem('medications');
      if (savedMedications) {
        const parsedMedications = JSON.parse(savedMedications);
        setMedicationsCount(parsedMedications.length);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  // Format time for display
  const formatTime = (timestamp) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Get appropriate icon for activity type
  const getActivityIcon = (type) => {
    switch(type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'alert-circle';
      case 'pending': return 'time-outline';
      default: return 'information-circle';
    }
  };

  // Get appropriate color for activity type
  const getActivityColor = (type) => {
    switch(type) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FFC107';
      case 'pending': return '#FF5722';
      default: return '#9E9E9E';
    }
  };

  // Health cards with dynamic counts
  const healthCards = [
    {
      title: 'Medications',
      icon: 'medkit-outline',
      count: medicationsCount,
      onPress: () => navigation.navigate('Medications'),
    },
    {
      title: 'Health Stats',
      icon: 'stats-chart-outline',
      description: 'View your metrics',
      onPress: () => navigation.navigate('HealthStats'),
    },
    {
      title: 'Contacts',
      icon: 'call-outline',
      count: contacts.length,
      onPress: () => setContactsModalVisible(true),
    },
    {
      title: 'Healthcare Tips',
      icon: 'card-outline',
      count: healthTips.length,
      onPress: () => setTipsModalVisible(true),
    },
  ];

  // Contact CRUD operations
  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      phone: contact.phone,
      relation: contact.relation
    });
  };

  const handleSaveContact = () => {
    if (!contactForm.name || !contactForm.phone) {
      Alert.alert('Error', 'Name and phone are required');
      return;
    }

    if (editingContact) {
      setContacts(contacts.map(c => 
        c.id === editingContact.id ? { ...c, ...contactForm } : c
      ));
    } else {
      const newContact = {
        id: contacts.length + 1,
        ...contactForm
      };
      setContacts([...contacts, newContact]);
    }
    
    setEditingContact(null);
    setContactForm({ name: '', phone: '', relation: '' });
  };

  const handleDeleteContact = (id) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setContacts(contacts.filter(c => c.id !== id));
            if (editingContact && editingContact.id === id) {
              setEditingContact(null);
              setContactForm({ name: '', phone: '', relation: '' });
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 20 }]}
      contentContainerStyle={[styles.contentContainer, {
        paddingBottom: insets.bottom + 20
      }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={loadData}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>
            Good {getTimeOfDay()},
          </Text>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {user?.name || 'User'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileButton}
        >
          <Ionicons 
            name="person-circle-outline" 
            size={32} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Quick Access Section */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Quick Access
      </Text>
      <View style={styles.cardContainer}>
        {healthCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.card, 
              { 
                backgroundColor: theme.colors.card,
                width: CARD_WIDTH,
                height: CARD_WIDTH * 0.9
              }
            ]}
            onPress={card.onPress}
            activeOpacity={0.8}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name={card.icon}
                  size={24}
                  color={theme.colors.primary}
                />
                {card.count !== undefined && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{card.count}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                {card.title}
              </Text>
              {card.description && (
                <Text style={[styles.cardDescription, { color: theme.colors.placeholder }]}>
                  {card.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Recent Activity Section */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Recent Activity
      </Text>
      <View style={[styles.activityCard, { backgroundColor: theme.colors.card }]}>
        {recentActivities.length > 0 ? (
          recentActivities.slice(0, 5).map((activity) => (
            <View 
              key={activity.id}
              style={[
                styles.activityItem,
                { borderBottomColor: theme.colors.border }
              ]}
            >
              <Ionicons 
                name={getActivityIcon(activity.type)} 
                size={20} 
                color={getActivityColor(activity.type)} 
              />
              <View style={styles.activityTextContainer}>
                <Text style={[styles.activityText, { color: theme.colors.text }]}>
                  {activity.text}
                </Text>
                <Text style={[styles.activityTime, { color: theme.colors.placeholder }]}>
                  {formatTime(activity.timestamp)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyActivity}>
            <Ionicons name="time-outline" size={24} color={theme.colors.placeholder} />
            <Text style={[styles.emptyActivityText, { color: theme.colors.placeholder }]}>
              No recent medication activities
            </Text>
          </View>
        )}
      </View>

      {/* Contacts Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={contactsModalVisible}
        onRequestClose={() => setContactsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Emergency Contacts</Text>
              <TouchableOpacity onPress={() => setContactsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Contact Form */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.placeholder
                }]}
                value={contactForm.name}
                onChangeText={(text) => setContactForm({...contactForm, name: text})}
                placeholder="Contact name"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Phone</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.placeholder
                }]}
                value={contactForm.phone}
                onChangeText={(text) => setContactForm({...contactForm, phone: text})}
                placeholder="Phone number"
                placeholderTextColor={theme.colors.placeholder}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Relation</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.placeholder
                }]}
                value={contactForm.relation}
                onChangeText={(text) => setContactForm({...contactForm, relation: text})}
                placeholder="Relation (e.g. Doctor)"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveContact}
              >
                <Text style={styles.buttonText}>{editingContact ? 'Update' : 'Add'} Contact</Text>
              </TouchableOpacity>
              
              {!editingContact && (
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton, { borderColor: theme.colors.primary }]}
                  onPress={() => setContactForm({ name: '', phone: '', relation: '' })}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Contacts List */}
            <ScrollView style={styles.contactsList}>
              {contacts.map(contact => (
                <View key={contact.id} style={[styles.contactItem, { 
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.placeholder
                }]}>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: theme.colors.text }]}>{contact.name}</Text>
                    <Text style={[styles.contactDetail, { color: theme.colors.text }]}>{contact.phone}</Text>
                    {contact.relation && (
                      <Text style={[styles.contactDetail, { color: theme.colors.placeholder }]}>
                        {contact.relation}
                      </Text>
                    )}
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity onPress={() => handleEditContact(contact)}>
                      <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteContact(contact.id)}>
                      <Ionicons name="trash-outline" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Health Tips Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={tipsModalVisible}
        onRequestClose={() => setTipsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Healthcare Tips</Text>
              <TouchableOpacity onPress={() => setTipsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {healthTips.map((tip, index) => (
                <View key={index} style={[styles.tipCard, { backgroundColor: theme.colors.card }]}>
                  <Ionicons name="bulb-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.tipText, { color: theme.colors.text }]}>{tip}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Helper function to get time of day greeting
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 44,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    opacity: 0.8,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  cardDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activityCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 100,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  activityText: {
    fontSize: 14,
  },
  activityTime: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyActivityText: {
    marginLeft: 8,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    marginRight: 10,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  contactsList: {
    marginTop: 10,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contactDetail: {
    fontSize: 14,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 15,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  tipText: {
    marginLeft: 10,
    flex: 1,
  },
});

export default HomeScreen;