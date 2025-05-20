import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MedicineContext = createContext();

export const MedicineProvider = ({ children }) => {
  const [medicines, setMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load medicines from storage on startup
  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const storedMedicines = await AsyncStorage.getItem('@medicines');
        if (storedMedicines) {
          setMedicines(JSON.parse(storedMedicines));
        }
      } catch (error) {
        console.error('Failed to load medicines:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMedicines();
  }, []);

  // Save medicines to storage whenever they change
  useEffect(() => {
    const saveMedicines = async () => {
      if (!isLoading) {
        try {
          await AsyncStorage.setItem('@medicines', JSON.stringify(medicines));
        } catch (error) {
          console.error('Failed to save medicines:', error);
        Alert.alert('Error', 'Failed to save medicine data');
        // Consider implementing retry logic here
        }
      }
    };

    saveMedicines();
  }, [medicines, isLoading]);

  const updateStock = async (medicineId, quantityUsed) => {
    setMedicines(prev => prev.map(med => {
      if (med.id === medicineId) {
        const newQuantity = med.quantity + quantityUsed; // Note: quantityUsed can be positive or negative
        return { 
          ...med, 
          quantity: Math.max(0, newQuantity) // Prevent negative quantities
        };
      }
      return med;
    }));
  };

  const addMedicine = async (newMedicine) => {
    const medicineWithId = {
      ...newMedicine,
      id: Date.now().toString(),
      quantity: Number(newMedicine.quantity) || 0,
    };

    setMedicines(prev => [...prev, medicineWithId]);
    return medicineWithId; // Return the added medicine for immediate use
  };

  const editMedicine = (id, updatedMedicine) => {
    setMedicines(prev => prev.map(med => 
      med.id === id ? { ...updatedMedicine, id } : med
    ));
  };

  const deleteMedicine = async (id) => {
    setMedicines(prev => prev.filter(med => med.id !== id));
  };

  return (
    <MedicineContext.Provider 
      value={{ 
        medicines, 
        isLoading,
        updateStock,
        addMedicine,
        editMedicine,
        deleteMedicine
      }}
    >
      {children}
    </MedicineContext.Provider>
  );
};

export const useMedicine = () => useContext(MedicineContext);