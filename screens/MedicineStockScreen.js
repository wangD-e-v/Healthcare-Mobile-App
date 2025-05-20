import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useMedicine } from '../context/MedicineContext';
import * as Notifications from 'expo-notifications';

// Configure notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Create notification channel (Android)
async function setupNotificationChannel() {
  await Notifications.setNotificationChannelAsync('low-stock', {
    name: 'Low Stock Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

const MedicineStockScreen = ({ navigation }) => {
  const theme = useTheme();
  const { medicines, addMedicine, editMedicine, deleteMedicine } = useMedicine();
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage1: '',
    dosage2: '',
    dosage3: '',
    quantity: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(null);

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      await setupNotificationChannel();
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Notification Permission',
          'Please enable notifications for low stock alerts',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Notifications.getPermissionsAsync() }
          ]
        );
      }
    };
    
    initializeNotifications();
    checkLowStock();
  }, []);

  // Check for low stock whenever medicines change
  useEffect(() => {
    checkLowStock();
  }, [medicines]);

  const checkLowStock = async () => {
    const lowStockMedicines = medicines.filter(med => med.quantity <= 3);
    
    if (lowStockMedicines.length > 0 && notificationPermission) {
      // Cancel any existing low stock notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Schedule new notifications for each low stock item
      lowStockMedicines.forEach(async med => {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🟠 Low Stock Alert',
            body: `You're running out of ${med.name}! Only ${med.quantity} left.`,
            sound: 'default',
            data: { medicineId: med.id },
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: { seconds: 1 }, // Show immediately
        });
      });
    }
  };

  const handleAddMedicine = () => {
    if (!newMedicine.name || !newMedicine.quantity) {
      Alert.alert('Error', 'Medicine name and quantity are required');
      return;
    }

    const dosages = [
      newMedicine.dosage1,
      newMedicine.dosage2,
      newMedicine.dosage3
    ].filter(dosage => dosage !== '');

    if (dosages.length === 0) {
      Alert.alert('Error', 'At least one dosage is required');
      return;
    }

    const quantity = parseInt(newMedicine.quantity);
    if (isNaN(quantity)) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    if (editingId) {
      const updatedMedicine = { 
        id: editingId,
        name: newMedicine.name,
        dosages,
        quantity: quantity
      };
      editMedicine(editingId, updatedMedicine);
    } else {
      addMedicine({
        id: Date.now().toString(),
        name: newMedicine.name,
        dosages,
        quantity: quantity
      });
    }

    resetForm();
  };

  const handleEdit = (medicine) => {
    setNewMedicine({
      name: medicine.name,
      dosage1: medicine.dosages[0] || '',
      dosage2: medicine.dosages[1] || '',
      dosage3: medicine.dosages[2] || '',
      quantity: medicine.quantity.toString()
    });
    setEditingId(medicine.id);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Medicine',
      'Are you sure you want to delete this medicine?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteMedicine(id);
            if (editingId === id) {
              resetForm();
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setNewMedicine({ name: '', dosage1: '', dosage2: '', dosage3: '', quantity: '' });
    setEditingId(null);
  };

  return (

    <>
    <View style={styles.header}>
    <Text style={[styles.title, { color: theme.colors.text }]}>MEDICINE STOCK</Text>
    </View>

    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContainer}
    >
      
      
      {/* Add/Edit Form */}
      <View style={[styles.formContainer, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Medicine Name</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            borderColor: theme.colors.placeholder
          }]}
          value={newMedicine.name}
          onChangeText={(text) => setNewMedicine({...newMedicine, name: text})}
          placeholder="e.g. Ibuprofen"
          placeholderTextColor={theme.colors.placeholder}
        />
        
        <Text style={[styles.label, { color: theme.colors.text }]}>Dosages</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            borderColor: theme.colors.placeholder
          }]}
          value={newMedicine.dosage1}
          onChangeText={(text) => setNewMedicine({...newMedicine, dosage1: text})}
          placeholder="Dosage 1 (required)"
          placeholderTextColor={theme.colors.placeholder}
        />
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            borderColor: theme.colors.placeholder
          }]}
          value={newMedicine.dosage2}
          onChangeText={(text) => setNewMedicine({...newMedicine, dosage2: text})}
          placeholder="Dosage 2 (optional)"
          placeholderTextColor={theme.colors.placeholder}
        />
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            borderColor: theme.colors.placeholder
          }]}
          value={newMedicine.dosage3}
          onChangeText={(text) => setNewMedicine({...newMedicine, dosage3: text})}
          placeholder="Dosage 3 (optional)"
          placeholderTextColor={theme.colors.placeholder}
        />
        
        <Text style={[styles.label, { color: theme.colors.text }]}>Quantity</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            borderColor: theme.colors.placeholder
          }]}
          value={newMedicine.quantity}
          onChangeText={(text) => setNewMedicine({...newMedicine, quantity: text})}
          placeholder="e.g. 30"
          placeholderTextColor={theme.colors.placeholder}
          keyboardType="numeric"
        />
        
        <TouchableOpacity 
          style={[styles.addButton, { 
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
          }]}
          onPress={handleAddMedicine}
        >
          <Text style={styles.buttonText}>
            {editingId ? 'UPDATE MEDICINE' : 'ADD MEDICINE'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Medicine List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>
            YOUR MEDICINES ({medicines.length})
          </Text>
          {!notificationPermission && (
            <Text style={[styles.notificationWarning, { color: '#FF5722' }]}>
              Notifications disabled
            </Text>
          )}
        </View>
        
        {medicines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medkit-outline" size={40} color={theme.colors.placeholder} />
            <Text style={[styles.emptyText, { color: theme.colors.placeholder }]}>
              No medicines added yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={medicines}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[
                styles.medicineCard, 
                { 
                  backgroundColor: theme.colors.card,
                  borderLeftWidth: item.quantity <= 3 ? 4 : 0,
                  borderLeftColor: item.quantity <= 3 ? '#ff4444' : 'transparent',
                  shadowColor: item.quantity <= 3 ? '#ff4444' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: item.quantity <= 3 ? 0.3 : 0.1,
                  shadowRadius: item.quantity <= 3 ? 6 : 4,
                }
              ]}>
                <View style={styles.medicineInfo}>
                  <View style={styles.medicineHeader}>
                    <Text style={[styles.medicineName, { color: theme.colors.text }]}>
                      {item.name}
                    </Text>
                    {item.quantity <= 3 && (
                      <View style={styles.lowStockBadge}>
                        <Text style={styles.lowStockText}>LOW</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.dosagesContainer}>
                    {item.dosages.map((dosage, index) => (
                      <Text key={index} style={[styles.dosageText, { color: theme.colors.text }]}>
                        {dosage}{index < item.dosages.length - 1 ? ', ' : ''}
                      </Text>
                    ))}
                  </View>
                  <Text style={[styles.medicineQuantity, { 
                    color: item.quantity <= 3 ? '#ff4444' : 
                          item.quantity <= 10 ? '#FFA500' : 
                          theme.colors.text 
                  }]}>
                    {item.quantity} left {item.quantity <= 3 && '⚠️'}
                  </Text>
                </View>
                
                <View style={styles.medicineActions}>
                  <TouchableOpacity 
                    onPress={() => handleEdit(item)}
                    style={styles.editButton}
                  >
                    <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDelete(item.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
    backgroundColor: '#0078D4',
    paddingTop: 40,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    letterSpacing: 1,
    textAlign: 'center',
  },
  formContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  addButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  listContainer: {
    marginTop: 10,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  notificationWarning: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  medicineCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  lowStockBadge: {
    backgroundColor: '#ff4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lowStockText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dosagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  dosageText: {
    fontSize: 14,
    opacity: 0.8,
  },
  medicineQuantity: {
    fontSize: 14,
    fontWeight: '600',
  },
  medicineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 6,
  },
  deleteButton: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MedicineStockScreen;