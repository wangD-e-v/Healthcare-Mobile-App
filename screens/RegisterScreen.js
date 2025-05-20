import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const { register } = useAuth();
  const theme = useTheme();

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    if (localError) setLocalError(null);
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setLocalError('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setLocalError(null);

    const result = await register(formData);
    setIsLoading(false);

    if (result.success) {
      // Successfully registered and logged in
      navigation.navigate('Main');
    } else {
      setLocalError(result.error);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Create Account</Text>
      
      {localError && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color="#FF3B30" />
          <Text style={styles.errorText}>{localError}</Text>
        </View>
      )}
      
      <Text style={[styles.label, { color: theme.colors.text }]}>Basic Information</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Full Name *"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.name}
          onChangeText={(text) => handleChange('name', text)}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Email *"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Password *"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.password}
          onChangeText={(text) => handleChange('password', text)}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity 
          onPress={() => setShowPassword(!showPassword)}
          style={styles.passwordToggle}
        >
          <Ionicons 
            name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
            size={20} 
            color={theme.colors.placeholder} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Confirm Password *"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.confirmPassword}
          onChangeText={(text) => handleChange('confirmPassword', text)}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity 
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={styles.passwordToggle}
        >
          <Ionicons 
            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
            size={20} 
            color={theme.colors.placeholder} 
          />
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.label, { color: theme.colors.text }]}>Health Information</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Blood Type (e.g., A+)"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.bloodType}
          onChangeText={(text) => handleChange('bloodType', text)}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Medical Conditions (comma separated)"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.medicalConditions}
          onChangeText={(text) => handleChange('medicalConditions', text)}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Allergies (comma separated)"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.allergies}
          onChangeText={(text) => handleChange('allergies', text)}
        />
      </View>
      
      <Text style={[styles.label, { color: theme.colors.text }]}>Personal Information</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Gender"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.gender}
          onChangeText={(text) => handleChange('gender', text)}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Phone Number"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.phoneNumber}
          onChangeText={(text) => handleChange('phoneNumber', text)}
          keyboardType="phone-pad"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Address"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.address}
          onChangeText={(text) => handleChange('address', text)}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Age"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.age}
          onChangeText={(text) => handleChange('age', text)}
          keyboardType="numeric"
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.button, { 
          backgroundColor: theme.colors.primary,
          opacity: isLoading ? 0.7 : 1
        }]} 
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.text }]}>
          Already have an account?
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
            Login
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
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
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 10,
  },
  button: {
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerText: {
    fontSize: 16,
    marginRight: 5,
  },
  footerLink: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#FF3B30',
    marginLeft: 5,
    fontSize: 14,
  },
});

export default RegisterScreen;