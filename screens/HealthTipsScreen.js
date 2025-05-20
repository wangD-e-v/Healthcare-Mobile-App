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

const HealthTipsScreen = () => {
  const [tips, setTips] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTip, setNewTip] = useState({
    title: '',
    description: '',
    category: 'General',
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTipId, setEditingTipId] = useState(null);
  const theme = useTheme();

  const categories = ['General', 'Nutrition', 'Exercise', 'Mental Health', 'First Aid'];

  const handleAddTip = () => {
    if (!newTip.title || !newTip.description) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }

    if (isEditMode) {
      // Update existing tip
      setTips(tips.map(tip => 
        tip.id === editingTipId ? { ...newTip, id: editingTipId } : tip
      ));
    } else {
      // Add new tip
      setTips([...tips, { ...newTip, id: Date.now().toString() }]);
    }

    setIsModalVisible(false);
    setNewTip({
      title: '',
      description: '',
      category: 'General',
    });
    setIsEditMode(false);
    setEditingTipId(null);
  };

  const handleEditTip = (tip) => {
    setIsEditMode(true);
    setEditingTipId(tip.id);
    setNewTip({
      title: tip.title,
      description: tip.description,
      category: tip.category,
    });
    setIsModalVisible(true);
  };

  const confirmDeleteTip = (id) => {
    Alert.alert(
      'Delete Health Tip',
      'Are you sure you want to delete this health tip?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTip(id) },
      ]
    );
  };

  const deleteTip = (id) => {
    setTips(tips.filter(tip => tip.id !== id));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Health Care Tips</Text>

        {tips.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={50} color={theme.colors.placeholder} />
            <Text style={[styles.emptyText, { color: theme.colors.placeholder }]}>
              No health tips added yet
            </Text>
          </View>
        ) : (
          tips.map((tip, index) => (
            <View key={index} style={[styles.tipCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.tipHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{tip.category}</Text>
                </View>
                <View style={styles.tipActions}>
                  <TouchableOpacity onPress={() => handleEditTip(tip)}>
                    <Ionicons name="create-outline" size={20} color={theme.colors.primary} style={styles.actionIcon} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDeleteTip(tip.id)}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" style={styles.actionIcon} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.tipTitle, { color: theme.colors.text }]}>
                {tip.title}
              </Text>
              <Text style={[styles.tipDescription, { color: theme.colors.text }]}>
                {tip.description}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          setIsEditMode(false);
          setEditingTipId(null);
          setNewTip({
            title: '',
            description: '',
            category: 'General',
          });
          setIsModalVisible(true);
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Add/Edit Tip Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {isEditMode ? 'Edit Health Tip' : 'Add New Health Tip'}
            </Text>

            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Title *"
              placeholderTextColor={theme.colors.placeholder}
              value={newTip.title}
              onChangeText={(text) => setNewTip({ ...newTip, title: text })}
            />

            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                height: 100,
                textAlignVertical: 'top',
              }]}
              placeholder="Description *"
              placeholderTextColor={theme.colors.placeholder}
              value={newTip.description}
              onChangeText={(text) => setNewTip({ ...newTip, description: text })}
              multiline
            />

            <View style={styles.categoryContainer}>
              <Text style={[styles.categoryLabel, { color: theme.colors.text }]}>Category:</Text>
              <View style={styles.categoryOptions}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      newTip.category === category && { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={() => setNewTip({ ...newTip, category })}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        newTip.category === category && { color: 'white' },
                        { color: theme.colors.text },
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.background }]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddTip}
              >
                <Text style={styles.modalButtonText}>
                  {isEditMode ? 'Update Tip' : 'Add Tip'}
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
  tipCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tipActions: {
    flexDirection: 'row',
  },
  actionIcon: {
    marginLeft: 15,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  categoryContainer: {
    marginBottom: 15,
  },
  categoryLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryOption: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryOptionText: {
    fontSize: 14,
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

export default HealthTipsScreen;