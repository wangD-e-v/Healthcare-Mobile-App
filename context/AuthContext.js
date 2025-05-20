import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          // Ensure medicalConditions and allergies are arrays
          setUser({
            ...parsedUser,
            medicalConditions: Array.isArray(parsedUser.medicalConditions) 
              ? parsedUser.medicalConditions 
              : parsedUser.medicalConditions?.split(',')?.map(item => item.trim()) || [],
            allergies: Array.isArray(parsedUser.allergies) 
              ? parsedUser.allergies 
              : parsedUser.allergies?.split(',')?.map(item => item.trim()) || []
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const register = async (userData) => {
    try {
      // Check if user already exists
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      
      if (users.some(u => u.email === userData.email)) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Create new user with properly formatted arrays
      const { confirmPassword, ...newUser } = {
        ...userData,
        medicalConditions: userData.medicalConditions 
          ? userData.medicalConditions.split(',').map(item => item.trim()) 
          : [],
        allergies: userData.allergies 
          ? userData.allergies.split(',').map(item => item.trim()) 
          : []
      };
      
      // Add new user
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      
      // Log in the new user immediately
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const login = async (email, password) => {
    try {
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      
      const foundUser = users.find(u => u.email === email && u.password === password);
      
      if (!foundUser) {
        return { success: false, error: 'Invalid email or password' };
      }

      await AsyncStorage.setItem('user', JSON.stringify(foundUser));
      setUser(foundUser);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      const existingUsers = await AsyncStorage.getItem('users');
      const currentUser = await AsyncStorage.getItem('user');
      
      if (!existingUsers || !currentUser) {
        throw new Error('User data not found');
      }

      const users = JSON.parse(existingUsers);
      const user = JSON.parse(currentUser);
      
      // Update user data with proper array formatting
      const updatedUser = { 
        ...user, 
        ...updatedData,
        medicalConditions: typeof updatedData.medicalConditions === 'string'
          ? updatedData.medicalConditions.split(',').map(item => item.trim())
          : updatedData.medicalConditions || [],
        allergies: typeof updatedData.allergies === 'string'
          ? updatedData.allergies.split(',').map(item => item.trim())
          : updatedData.allergies || []
      };
      
      // Update in users array
      const updatedUsers = users.map(u => 
        u.email === user.email ? updatedUser : u
      );
      
      // Save updates
      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      setUser(updatedUser);
      return { success: true };
    } catch (err) {
      console.error('Update profile error:', err);
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        register,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);