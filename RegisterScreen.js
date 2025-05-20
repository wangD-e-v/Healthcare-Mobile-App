import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    bloodType: '',
    medicalConditions: '',
    allergies: '',
    gender: '',
    phoneNumber: '',
    address: '',
    age: '',
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const theme = useTheme();

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRegister = async () => {
    const { password, confirmPassword, ...userData } = formData;
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!formData.email || !formData.password || !formData.name) {
      setError('Please fill in required fields');
      return;
    }

    const success = await register(userData);
    if (!success) {
      setError('Registration failed');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Create Account</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <Text style={[styles.label, { color: theme.colors.text }]}>Basic Information</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
        placeholder="Full Name"
        placeholderTextColor={theme.colors.placeholder}
        value={formData.name}
        onChangeText={(text) => handleChange('name', text)}
      />
      
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
        placeholder="Email"
        placeholderTextColor={theme.colors.placeholder}
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
        placeholder="Password"
        placeholderTextColor={theme.colors.placeholder}
        value={formData.password}
        onChangeText={(text) => handleChange('password', text)}
        secureTextEntry
      />
      
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
        placeholder="Confirm Password"
        placeholderTextColor={theme.colors.placeholder}
        value={formData.confirmPassword}
        onChangeText={(text) => handleChange('confirmPassword', text)}
        secureTextEntry
      />
      
      <Text style={[styles.label, { color: theme.colors.text }]}>Health Information</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
        placeholder="Blood Type (e.g., A+)"
        placeholderTextColor={theme.colors.placeholder}
        value={formData.bloodType}
        onChangeText={(text) => handleChange('bloodType', text)}
      />
      
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
        placeholder="Medical Conditions (comma separated)"
        placeholderTextColor={theme.colors.placeholder}
        value={formData.medicalConditions}
        onChangeText={(text) => handleChange('medicalConditions', text)}
      />
      
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
        placeholder="Allergies (comma separated)"
        placeholderTextColor={theme.colors.placeholder}
        value={formData.allergies}
        onChangeText={(text) => handleChange('allergies', text)}
      />
      
      <Text style={[styles.label, { color: theme.colors.text }]}>Personal Information</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
        placeholder="Gender"
        placeholderTextColor={theme.colors.placeholder}
        value={formData.gender}
        onChangeText={(text) => handleChange('gender', text)}
      />
      
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
        placeholder="Phone Number"
        placeholderTextColor={theme.colors.placeholder}
        value={formData.phoneNumber}
        onChangeText={(text) => handleChange('phoneNumber', text)}
        keyboardType="phone-pad"
      />
      
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
        placeholder="Address"
        placeholderTextColor={theme.colors.placeholder}
        value={formData.address}
        onChangeText={(text) => handleChange('address', text)}
      />
      
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
        placeholder="Age"
        placeholderTextColor={theme.colors.placeholder}
        value={formData.age}
        onChangeText={(text) => handleChange('age', text)}
        keyboardType="numeric"
      />
      
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={[styles.link, { color: theme.colors.primary }]}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4a90e2',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    textAlign: 'center',
    fontSize: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },
});

export default RegisterScreen;