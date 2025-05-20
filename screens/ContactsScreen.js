import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const ContactsScreen = () => {
  const [contacts, setContacts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
    isEmergency: false,
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const theme = useTheme();

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }

    if (isEditMode) {
      // Update existing contact
      setContacts(contacts.map(contact => 
        contact.id === editingContactId ? { ...newContact, id: editingContactId } : contact
      ));
    } else {
      // Add new contact
      setContacts([...contacts, { ...newContact, id: Date.now().toString() }]);
    }

    setIsModalVisible(false);
    setNewContact({
      name: '',
      phone: '',
      relationship: '',
      isEmergency: false,
    });
    setIsEditMode(false);
    setEditingContactId(null);
  };

  const handleEditContact = (contact) => {
    setIsEditMode(true);
    setEditingContactId(contact.id);
    setNewContact({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      isEmergency: contact.isEmergency,
    });
    setIsModalVisible(true);
  };

  const confirmDeleteContact = (id) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteContact(id) },
      ]
    );
  };

  const deleteContact = (id) => {
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Emergency Contacts</Text>

        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={50} color={theme.colors.placeholder} />
            <Text style={[styles.emptyText, { color: theme.colors.placeholder }]}>
              No contacts added yet
            </Text>
          </View>
        ) : (
          contacts.map((contact, index) => (
            <View key={index} style={[styles.contactCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.contactHeader}>
                <Text style={[styles.contactName, { color: theme.colors.text }]}>
                  {contact.name} {contact.isEmergency && '🚨'}
                </Text>
                <View style={styles.contactActions}>
                  <TouchableOpacity onPress={() => handleEditContact(contact)}>
                    <Ionicons name="create-outline" size={20} color={theme.colors.primary} style={styles.actionIcon} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDeleteContact(contact.id)}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" style={styles.actionIcon} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.contactDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="call-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.detailText, { color: theme.colors.text }]}>
                    {contact.phone}
                  </Text>
                </View>
                {contact.relationship && (
                  <View style={styles.detailItem}>
                    <Ionicons name="people-outline" size={16} color={theme.colors.primary} />
                    <Text style={[styles.detailText, { color: theme.colors.text }]}>
                      {contact.relationship}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          setIsEditMode(false);
          setEditingContactId(null);
          setNewContact({
            name: '',
            phone: '',
            relationship: '',
            isEmergency: false,
          });
          setIsModalVisible(true);
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Add/Edit Contact Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {isEditMode ? 'Edit Contact' : 'Add New Contact'}
            </Text>

            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Name *"
              placeholderTextColor={theme.colors.placeholder}
              value={newContact.name}
              onChangeText={(text) => setNewContact({ ...newContact, name: text })}
            />

            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Phone Number *"
              placeholderTextColor={theme.colors.placeholder}
              value={newContact.phone}
              onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
              keyboardType="phone-pad"
            />

            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Relationship (e.g., Doctor, Family)"
              placeholderTextColor={theme.colors.placeholder}
              value={newContact.relationship}
              onChangeText={(text) => setNewContact({ ...newContact, relationship: text })}
            />

            <TouchableOpacity
              style={[styles.emergencyToggle, {
                backgroundColor: newContact.isEmergency ? '#FF5252' : theme.colors.background,
                borderColor: theme.colors.border
              }]}
              onPress={() => setNewContact({ ...newContact, isEmergency: !newContact.isEmergency })}
            >
              <Ionicons 
                name={newContact.isEmergency ? 'alert-circle' : 'alert-circle-outline'} 
                size={20} 
                color={newContact.isEmergency ? 'white' : theme.colors.text} 
              />
              <Text style={[
                styles.emergencyText,
                { color: newContact.isEmergency ? 'white' : theme.colors.text }
              ]}>
                Emergency Contact
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.background }]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddContact}
              >
                <Text style={styles.modalButtonText}>
                  {isEditMode ? 'Update Contact' : 'Add Contact'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 44,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
  },
  contactCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactActions: {
    flexDirection: 'row',
  },
  actionIcon: {
    marginLeft: 15,
  },
  contactDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
    width: '100%',
  },
  detailText: {
    marginLeft: 5,
    fontSize: 14,
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
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  emergencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
  },
  emergencyText: {
    marginLeft: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ContactsScreen;