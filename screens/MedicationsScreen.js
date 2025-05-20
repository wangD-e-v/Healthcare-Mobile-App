import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  navigation
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { useMedicine } from '../context/MedicineContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function setupNotificationChannel() {
  await Notifications.setNotificationChannelAsync('medication-reminders', {
    name: 'Medication Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

const MedicationsScreen = () => {
  const theme = useTheme();
  const { medicines, updateStock } = useMedicine();
  const [medications, setMedications] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [availableDosages, setAvailableDosages] = useState([]);
  const [quantityToUse, setQuantityToUse] = useState('1');
  
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: 'Once',
    duration: '1',
    time: '08:00 AM',
    startDate: new Date(),
  });
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMedId, setEditingMedId] = useState(null);
  const [calendarPermission, setCalendarPermission] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await setupNotificationChannel();
      await loadMedications();
      await requestPermissions();
    };
    initialize();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status: calendarStatus } = await Calendar.requestCalendarPermissionsAsync();
      setCalendarPermission(calendarStatus === 'granted');

      const { status: notifStatus } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      setNotificationPermission(notifStatus === 'granted');

      if (calendarStatus !== 'granted' || notifStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Please enable calendar and notification access for full functionality',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Calendar.openSettingsAsync() }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const loadMedications = async () => {
    try {
      const savedMedications = await AsyncStorage.getItem('medications');
      if (savedMedications) {
        const parsedMedications = JSON.parse(savedMedications);
        setMedications(parsedMedications);

        parsedMedications.forEach(async (med) => {
          await scheduleNotification(med);
        });
      }
    } catch (error) {
      console.error('Error loading medications:', error);
      Alert.alert('Error', 'Failed to load medications');
    }
  };

  const saveMedications = async (meds) => {
    try {
      await AsyncStorage.setItem('medications', JSON.stringify(meds));
    } catch (error) {
      console.error('Error saving medications:', error);
      throw error;
    }
  };

 // Update the scheduleNotification function in MedicationsScreen.js
const scheduleNotification = async (medication) => {
  if (!notificationPermission) return null;

  try {
    // Cancel existing notification
    if (medication.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(medication.notificationId);
    }

    // Calculate notification time (same as before)
    const [time, period] = medication.time.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const scheduledDate = new Date(medication.startDate);
    scheduledDate.setHours(hours, minutes, 0, 0);

    if (scheduledDate <= new Date()) return null;

    // Android-specific notification configuration
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 Time for ${medication.name}`,
        body: `Dosage: ${medication.dosage}\nSwipe down for options`,
        sound: true,
        vibrate: [0, 250, 250, 250],
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { 
          medicationId: medication.id,
          screen: 'Home'
        },
        categoryIdentifier: 'MEDICATION_REMINDER',
      },
      trigger: scheduledDate,
    });

    return notificationId;
  } catch (error) {
    console.error('Notification scheduling error:', error);
    return null;
  }
};


  const createCalendarEvent = async (medication) => {
    if (!calendarPermission) return;

    try {
      const calendars = await Calendar.getCalendarsAsync();
      const calendar = calendars.find(c => c.allowsModifications) || calendars[0];

      if (!calendar) return;

      const [time, period] = medication.time.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const startDate = new Date(medication.startDate);
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes

      await Calendar.createEventAsync(calendar.id, {
        title: `Take ${medication.name} (${medication.dosage})`,
        startDate,
        endDate,
        alarms: [{ relativeOffset: -10 }],
        recurrenceRule: undefined,
      });
    } catch (error) {
      console.error('Error creating calendar event:', error);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setNewMedication({ ...newMedication, startDate: selectedDate });
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      setNewMedication({ ...newMedication, time: timeString });
    }
  };

  const handleEditMedication = (medication) => {
    setIsEditMode(true);
    setEditingMedId(medication.id);
    setNewMedication({
      name: medication.name,
      dosage: medication.dosage,
      frequency: 'Once',
      duration: '1',
      time: medication.time,
      startDate: new Date(medication.startDate),
    });
    setDate(new Date(medication.startDate));
    setIsModalVisible(true);
  };

  const confirmDeleteMedication = (index) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMedication(index) },
      ],
      { cancelable: true }
    );
  };

  const deleteMedication = async (index) => {
    try {
      const updatedMedications = [...medications];
      const [removedMed] = updatedMedications.splice(index, 1);
      if (removedMed.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(removedMed.notificationId);
      }
      setMedications(updatedMedications);
      await saveMedications(updatedMedications);
    } catch (error) {
      console.error('Error deleting medication:', error);
      Alert.alert('Error', 'Failed to delete medication');
    }
  };

  const addOrUpdateMedication = async () => {
  try {
    // === 1. VALIDATION ===
    if (!selectedMedicine) {
      Alert.alert('Action Required', 'Please select a medicine from your list');
      return;
    }

    const quantity = parseInt(quantityToUse);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid quantity (must be greater than 0)');
      return;
    }

    const selectedMed = medicines.find(m => m.id === selectedMedicine);
    if (!selectedMed) {
      Alert.alert('Not Found', 'The selected medicine was not found in your inventory');
      return;
    }

    if (quantity > selectedMed.quantity) {
      Alert.alert(
        'Insufficient Stock', 
        `You only have ${selectedMed.quantity} ${selectedMed.name} available`
      );
      return;
    }

    if (!newMedication.dosage) {
      Alert.alert('Missing Information', 'Please select a dosage for this medication');
      return;
    }

    setIsLoading(true);

    // === 2. PREPARE DATA ===
    const medicationId = isEditMode ? editingMedId : Date.now().toString();
    const medicationWithId = {
      ...newMedication,
      id: medicationId,
      medicineId: selectedMedicine,
      medicineName: selectedMed.name,
      quantityUsed: quantity,
      frequency: newMedication.frequency || 'Once',
      duration: newMedication.duration || '1',
      notificationId: null,
      isTaken: false,
      createdAt: new Date().toISOString(),
      needsAction: !isEditMode,
    };

    // === 3. ATOMIC OPERATIONS ===
    // Update stock FIRST (critical operation)
    await updateStock(selectedMedicine, -quantity);

    // Update medications list
    const updatedMedications = isEditMode
      ? medications.map(med => (med.id === medicationId ? medicationWithId : med))
      : [...medications, medicationWithId];
    
    await saveMedications(updatedMedications);
    setMedications(updatedMedications);

    // === 4. SECONDARY OPERATIONS ===
    // Schedule notification (non-critical)
    try {
      const notificationId = await scheduleNotification(medicationWithId);
      if (notificationId) {
        medicationWithId.notificationId = notificationId;
        const finalMeds = updatedMedications.map(med => 
          med.id === medicationId ? medicationWithId : med
        );
        await saveMedications(finalMeds);
      }
    } catch (notifError) {
      Alert.alert(
        'Notice', 
        'Medication saved, but reminder setup failed. Check notification permissions.'
      );
    }

    // Add to calendar (non-critical)
    if (calendarPermission) {
      try {
        await createCalendarEvent(medicationWithId);
      } catch (calendarError) {
        console.warn('Calendar sync failed:', calendarError);
      }
    }

    // === 5. SUCCESS ===
    resetForm();
    Alert.alert(
      'Success',
      `${selectedMed.name} ${isEditMode ? 'updated' : 'added'} successfully`
    );

  } catch (error) {
    // === ERROR HANDLING ===
    console.error('Operation failed:', error);
    Alert.alert(
      'Error',
      error.message || `Could not ${isEditMode ? 'update' : 'add'} medication. Please try again.`
    );
  } finally {
    setIsLoading(false);
  }
};
  const resetForm = () => {
    setNewMedication({
      name: '',
      dosage: '',
      frequency: 'Once',
      duration: '1',
      time: '08:00 AM',
      startDate: new Date(),
    });
    setDate(new Date());
    setSelectedMedicine(null);
    setAvailableDosages([]);
    setQuantityToUse('1');
    setIsModalVisible(false);
    setIsEditMode(false);
    setEditingMedId(null);
  };

  return (
    <>
<View style={styles.header}>
<Text style={[styles.title, { color: theme.colors.text }]}>MY MEDICATIONS</Text>
</View>
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        

        {medications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medkit-outline" size={50} color={theme.colors.placeholder} />
            <Text style={[styles.emptyText, { color: theme.colors.placeholder }]}>
              No medications added yet
            </Text>
          </View>
        ) : (
          medications.map((med, index) => (
            <View key={index} style={[styles.medicationCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.medicationHeader}>
                <Text style={[styles.medicationName, { color: theme.colors.text }]}>{med.name}</Text>
                <View style={styles.medicationActions}>
                  <TouchableOpacity onPress={() => handleEditMedication(med)}>
                    <Ionicons name="create-outline" size={20} color={theme.colors.primary} style={styles.actionIcon} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDeleteMedication(index)}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" style={styles.actionIcon} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.medicationDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="flask-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.detailText, { color: theme.colors.text }]}>
                    {med.dosage}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.detailText, { color: theme.colors.text }]}>
                    {med.time}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.detailText, { color: theme.colors.text }]}>
                    Starts: {new Date(med.startDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.reminderStatus}>
                <Ionicons
                  name="notifications-outline"
                  size={16}
                  color={notificationPermission ? '#4CAF50' : theme.colors.placeholder}
                />
                <Text style={[
                  styles.reminderText,
                  { color: notificationPermission ? '#4CAF50' : theme.colors.placeholder }
                ]}>
                  {notificationPermission ? 'Reminder set' : 'No notification permission'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          setIsEditMode(false);
          setEditingMedId(null);
          resetForm();
          setIsModalVisible(true);
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {isEditMode ? 'Edit Medication' : 'Add New Medication'}
            </Text>

            <View style={styles.pickerContainer}>
              <Text style={[styles.pickerLabel, { color: theme.colors.text }]}>Select Medicine:</Text>
              <View style={[styles.picker, { backgroundColor: theme.colors.background }]}>
                <Picker
                  selectedValue={selectedMedicine}
                  onValueChange={(itemValue) => {
                    setSelectedMedicine(itemValue);
                    const med = medicines.find(m => m.id === itemValue);
                    setAvailableDosages(med?.dosages || []);
                    setNewMedication(prev => ({
                      ...prev,
                      name: med?.name || '',
                      dosage: med?.dosages[0] || ''
                    }));
                  }}
                  style={{ color: theme.colors.text }}
                >
                  <Picker.Item label="Select Medicine" value={null} />
                  {medicines.map(med => (
                    <Picker.Item 
                      key={med.id} 
                      label={`${med.name} (${med.quantity} left)`} 
                      value={med.id} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {selectedMedicine && (
              <View style={styles.pickerContainer}>
                <Text style={[styles.pickerLabel, { color: theme.colors.text }]}>Dosage:</Text>
                <View style={[styles.picker, { backgroundColor: theme.colors.background }]}>
                  <Picker
                    selectedValue={newMedication.dosage}
                    onValueChange={(itemValue) => setNewMedication({...newMedication, dosage: itemValue})}
                    style={{ color: theme.colors.text }}
                  >
                    {availableDosages.map(dosage => (
                      <Picker.Item key={dosage} label={dosage} value={dosage} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Quantity to use *"
              placeholderTextColor={theme.colors.placeholder}
              value={quantityToUse}
              onChangeText={setQuantityToUse}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                justifyContent: 'center',
              }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: theme.colors.text }}>
                Start Date: {date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            <TouchableOpacity
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                justifyContent: 'center',
              }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={{ color: theme.colors.text }}>
                Time: {newMedication.time}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
                is24Hour={false}
              />
            )}

            {!notificationPermission && (
              <Text style={[styles.warningText, { color: '#FF5722' }]}>
                Notification permission not granted - reminders won't work when app is closed
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.background }]}
                onPress={resetForm}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, {
                  backgroundColor: theme.colors.primary,
                  opacity: isLoading ? 0.7 : 1
                }]}
                onPress={addOrUpdateMedication}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>
                    {isEditMode ? 'Update' : 'Add Medication'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingBottom: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
  },
  medicationCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
  },
  medicationActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionIcon: {
    padding: 5,
  },
  medicationDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  reminderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  reminderText: {
    fontSize: 12,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
  },
  warningText: {
    fontSize: 12,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MedicationsScreen;