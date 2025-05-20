import React, { createContext, useState, useContext } from 'react';

// Create the context
export const ThemeContext = createContext();

// Create a provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = {
    colors: {
      primary: '#4a90e2',
      secondary: '#2d3748',
      background: isDarkMode ? '#121212' : '#f5f5f5',
      card: isDarkMode ? '#1e1e1e' : '#ffffff',
      text: isDarkMode ? '#ffffff' : '#000000',
      border: isDarkMode ? '#333333' : '#e2e8f0',
      placeholder: isDarkMode ? '#666666' : '#a0aec0',
      notification: '#ff3b30',
    },
    spacing: {
      small: 8,
      medium: 16,
      large: 24,
    },
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Create a custom hook for using the theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};