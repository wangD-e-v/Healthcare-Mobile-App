import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const ProfileScreen = ({ navigation }) => {
  const { user, updateProfile, logout } = useAuth();
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bloodType: user?.bloodType || '',
    medicalConditions: user?.medicalConditions?.join(', ') || '',
    allergies: user?.allergies?.join(', ') || '',
    gender: user?.gender || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    age: user?.age?.toString() || '',
    profilePicture: user?.profilePicture || null,
  });

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to set a profile picture');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        // Compress and resize the image
        const manipResult = await manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 300 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );
        
        setFormData({
          ...formData,
          profilePicture: manipResult.uri,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedData = {
        ...formData,
        medicalConditions: formData.medicalConditions.split(',').map(item => item.trim()),
        allergies: formData.allergies.split(',').map(item => item.trim()),
        age: formData.age ? parseInt(formData.age) : null,
      };

      const result = await updateProfile(updatedData);
      
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => logout(), style: 'destructive' },
      ]
    );
  };

  return (

    <>
<View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>MY PROFILE</Text>
        {isEditing ? (
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text style={[styles.saveButton, { color: 'white'}]}>Save</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Ionicons name="pencil" size={20} color= 'white' />
          </TouchableOpacity>
        )}
      </View>


    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      

      <TouchableOpacity 
        style={styles.profileImageContainer} 
        onPress={isEditing ? pickImage : null}
        disabled={!isEditing}
      >
        {formData.profilePicture ? (
          <Image 
            source={{ uri: formData.profilePicture }} 
            style={styles.profileImage}
          />
        ) : (
          <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="person" size={40} color="white" />
          </View>
        )}
        {isEditing && (
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="white" />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Personal Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Name</Text>
          {isEditing ? (
            <TextInput
              style={[styles.editableInput, { color: theme.colors.text }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          ) : (
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.name || '--'}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Email</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.email || '--'}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Gender</Text>
          {isEditing ? (
            <TextInput
              style={[styles.editableInput, { color: theme.colors.text }]}
              value={formData.gender}
              onChangeText={(text) => setFormData({ ...formData, gender: text })}
            />
          ) : (
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.gender || '--'}</Text>
          )}
        </View>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Age</Text>
          {isEditing ? (
            <TextInput
              style={[styles.editableInput, { color: theme.colors.text }]}
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              keyboardType="numeric"
            />
          ) : (
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.age || '--'}</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Contact Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Phone</Text>
          {isEditing ? (
            <TextInput
              style={[styles.editableInput, { color: theme.colors.text }]}
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.phoneNumber || '--'}</Text>
          )}
        </View>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Address</Text>
          {isEditing ? (
            <TextInput
              style={[styles.editableInput, { color: theme.colors.text }]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
            />
          ) : (
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.address || '--'}</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Health Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Blood Type</Text>
          {isEditing ? (
            <TextInput
              style={[styles.editableInput, { color: theme.colors.text }]}
              value={formData.bloodType}
              onChangeText={(text) => setFormData({ ...formData, bloodType: text })}
            />
          ) : (
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.bloodType || '--'}</Text>
          )}
        </View>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Medical Conditions</Text>
          {isEditing ? (
            <TextInput
              style={[styles.editableInput, { color: theme.colors.text }]}
              value={formData.medicalConditions}
              onChangeText={(text) => setFormData({ ...formData, medicalConditions: text })}
              multiline
            />
          ) : (
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {user?.medicalConditions?.join(', ') || 'None'}
            </Text>
          )}
        </View>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Allergies</Text>
          {isEditing ? (
            <TextInput
              style={[styles.editableInput, { color: theme.colors.text }]}
              value={formData.allergies}
              onChangeText={(text) => setFormData({ ...formData, allergies: text })}
              multiline
            />
          ) : (
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {user?.allergies?.join(', ') || 'None'}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: theme.colors.notification }]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
 header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
    backgroundColor: '#0078D4',
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 60,
   
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#e2e8f0',
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4a90e2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  infoItem: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  editableInput: {
    fontSize: 16,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 5,
  },
  logoutButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 19,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;