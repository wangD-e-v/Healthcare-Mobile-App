import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO, isToday, isYesterday } from 'date-fns';

// Constants
const MAX_ACTIVITIES = 50; // Increased limit for better history
const ACTIVITY_STORAGE_KEY = 'medicationActivities_v2'; // Versioned key for future migrations

/**
 * Records a new medication activity with enhanced data
 * @param {Object} medication - The medication object
 * @param {'success'|'warning'|'pending'|'skipped'|'updated'} type - Activity type
 * @param {Object} options - Additional options
 * @param {string} [options.customMessage] - Custom message override
 * @param {number} [options.dosageTaken] - Dosage amount taken
 * @param {string} [options.reason] - Reason for warning/skipped status
 */
export const addActivity = async (medication, type, options = {}) => {
  try {
    if (!medication || !medication.id || !medication.name) {
      throw new Error('Invalid medication data');
    }

    const now = new Date();
    const activity = {
      type,
      id: `${now.getTime()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
      medicationId: medication.id,
      medicationName: medication.name,
      dosage: medication.dosage,
      timestamp: now.toISOString(),
      date: format(now, 'yyyy-MM-dd'),
      time: format(now, 'HH:mm'),
      ...(options.dosageTaken && { dosageTaken: options.dosageTaken }),
      ...(options.reason && { reason: options.reason }),
      text: options.customMessage || generateActivityMessage(medication, type, options)
    };

    const activities = await getRecentActivities();
    const updatedActivities = [activity, ...activities].slice(0, MAX_ACTIVITIES);
    
    await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(updatedActivities));
    return activity;
  } catch (error) {
    console.error('Error saving activity:', error);
    throw new Error('Failed to save activity');
  }
};

// Helper to generate activity messages
const generateActivityMessage = (medication, type, options) => {
  const baseMessage = `${medication.name} (${medication.dosage})`;
  
  switch(type) {
    case 'success':
      return options.dosageTaken 
        ? `Took ${options.dosageTaken} of ${baseMessage}`
        : `Took ${baseMessage}`;
    case 'warning':
      return options.reason
        ? `Missed ${baseMessage} - ${options.reason}`
        : `Missed ${baseMessage}`;
    case 'skipped':
      return `Skipped ${baseMessage}` + (options.reason ? ` - ${options.reason}` : '');
    case 'updated':
      return `Updated ${baseMessage}`;
    case 'pending':
    default:
      return `Added ${baseMessage}`;
  }
};

/**
 * Gets all recent activities with enhanced filtering and sorting
 * @param {Object} [options] - Filter options
 * @param {string} [options.medicationId] - Filter by medication ID
 * @param {string} [options.date] - Filter by date (yyyy-MM-dd)
 * @param {string} [options.type] - Filter by activity type
 */
export const getRecentActivities = async (options = {}) => {
  try {
    const savedActivities = await AsyncStorage.getItem(ACTIVITY_STORAGE_KEY);
    let activities = savedActivities ? JSON.parse(savedActivities) : [];

    // Apply filters
    if (options.medicationId) {
      activities = activities.filter(a => a.medicationId === options.medicationId);
    }
    if (options.date) {
      activities = activities.filter(a => a.date === options.date);
    }
    if (options.type) {
      activities = activities.filter(a => a.type === options.type);
    }

    // Sort by newest first
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error getting activities:', error);
    return [];
  }
};

/**
 * Gets today's activities
 */
export const getTodaysActivities = async () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return getRecentActivities({ date: today });
};

/**
 * Gets yesterday's activities
 */
export const getYesterdaysActivities = async () => {
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  return getRecentActivities({ date: yesterday });
};

/**
 * Clears all activity history
 */
export const clearActivities = async () => {
  try {
    await AsyncStorage.removeItem(ACTIVITY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing activities:', error);
    return false;
  }
};

/**
 * Gets activities grouped by date
 * @returns {Object} Activities grouped by date { 'yyyy-MM-dd': [activities] }
 */
export const getActivitiesGroupedByDate = async () => {
  try {
    const activities = await getRecentActivities();
    return activities.reduce((groups, activity) => {
      const date = activity.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
      return groups;
    }, {});
  } catch (error) {
    console.error('Error grouping activities:', error);
    return {};
  }
};

/**
 * Gets medication adherence statistics
 * @param {string} medicationId - Optional medication ID
 * @returns {Object} Adherence stats { taken: number, missed: number, adherenceRate: number }
 */
export const getAdherenceStats = async (medicationId) => {
  try {
    const filter = medicationId ? { medicationId } : {};
    const activities = await getRecentActivities(filter);
    
    const taken = activities.filter(a => a.type === 'success').length;
    const missed = activities.filter(a => a.type === 'warning' || a.type === 'skipped').length;
    const total = taken + missed;
    
    return {
      taken,
      missed,
      adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 100
    };
  } catch (error) {
    console.error('Error calculating adherence:', error);
    return { taken: 0, missed: 0, adherenceRate: 100 };
  }
};

/**
 * Migrates old activity data if needed
 */
const migrateActivityData = async () => {
  try {
    const oldData = await AsyncStorage.getItem('medicationActivities');
    if (oldData) {
      const activities = JSON.parse(oldData);
      await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, oldData);
      await AsyncStorage.removeItem('medicationActivities');
      console.log('Migrated old activity data');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Run migration on first import
migrateActivityData();