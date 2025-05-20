import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Easing,
  StatusBar,
  viewportHeight
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Svg, Circle } from 'react-native-svg';
import { vi } from 'date-fns/locale';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const ANIMATION_DURATION = 800;
const GAUGE_SIZE = 180;
const GAUGE_RADIUS = 80;


class HealthStatsScreen extends Component {
  state = {
    medications: [],
    isLoading: true,
    error: null,
    refreshing: false,
    fadeAnim: new Animated.Value(0),
    scaleAnim: new Animated.Value(0.8),
  };

  componentDidMount() {
    this.loadMedications();
    this.animateEntrance();
  }

  
  renderHeader = () => {
    const { medications } = this.state;
    
    return (
      <>
        <StatusBar backgroundColor="#0078D4" barStyle="light-content" />
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Health Analytics</Text>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="filter" size={20} color="#0078D4" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerTabs}>
            <TouchableOpacity style={styles.activeTab}>
              <Text style={styles.activeTabText}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.inactiveTab}>
              <Text style={styles.inactiveTabText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  animateEntrance = () => {
    Animated.parallel([
      Animated.timing(this.state.fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(this.state.scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  loadMedications = async () => {
    try {
      this.setState({ isLoading: true, error: null });
      const savedMedications = await AsyncStorage.getItem('medications');
      
      const medications = savedMedications ? JSON.parse(savedMedications) : [];
      this.setState({ 
        medications, 
        isLoading: false, 
        refreshing: false 
      });
    } catch (error) {
      this.setState({ 
        error: 'Failed to load medication data', 
        isLoading: false,
        refreshing: false,
      });
      console.error('Error loading medications:', error);
    }
  };

  handleRefresh = () => {
    this.setState({ refreshing: true }, this.loadMedications);
  };

  calculateMedicationAdherence = () => {
    const { medications } = this.state;
    if (medications.length === 0) return 100;

    const today = new Date();
    const activeMeds = medications.filter(med => {
      const start = new Date(med.startDate);
      const duration = parseInt(med.duration, 10);
      const expiryDate = new Date(start);
      expiryDate.setDate(start.getDate() + duration);
      return expiryDate >= today;
    });

    return Math.round((activeMeds.length / medications.length) * 100);
  };

  getDosageDistribution = () => {
    const { medications } = this.state;
    const counts = {
      Low: 0,
      Medium: 0,
      High: 0,
      Unknown: 0,
    };

    medications.forEach(med => {
      const dosageNumMatch = med.dosage.match(/\d+/);
      const dosageNum = dosageNumMatch ? parseInt(dosageNumMatch[0], 10) : null;
      
      if (dosageNum === null) {
        counts.Unknown += 1;
      } else if (dosageNum < 250) {
        counts.Low += 1;
      } else if (dosageNum <= 500) {
        counts.Medium += 1;
      } else {
        counts.High += 1;
      }
    });

    return counts;
  };

  getTimeDistribution = () => {
    const { medications } = this.state;
    const timeSlots = {
      Morning: 0,
      Afternoon: 0,
      Evening: 0,
    };

    medications.forEach(med => {
      const [hourStr] = med.time.split(':');
      const hour = parseInt(hourStr, 10);
      const period = med.time.includes('AM') ? 'AM' : 'PM';

      if (period === 'AM') {
        timeSlots.Morning += 1;
      } else if (hour < 4 || hour === 12) {
        timeSlots.Afternoon += 1;
      } else if (hour < 8) {
        timeSlots.Evening += 1;
      }
    });

    return timeSlots;
  };

  renderDosageChart = () => {
    const dosageData = this.getDosageDistribution();
    const data = [
      {
        name: "Low",
        count: dosageData.Low,
        color: "#4CAF50",
        legendFontColor: "#FFF",
        legendFontSize: 12
      },
      {
        name: "Medium",
        count: dosageData.Medium,
        color: "#FFC107",
        legendFontColor: "#FFF",
        legendFontSize: 12
      },
      {
        name: "High",
        count: dosageData.High,
        color: "#F44336",
        legendFontColor: "#FFF",
        legendFontSize: 12
      },
      {
        name: "Unknown",
        count: dosageData.Unknown,
        color: "#9E9E9E",
        legendFontColor: "#FFF",
        legendFontSize: 12
      }
    ];

    return (
      <Animated.View 
        style={[
          styles.chartContainer,
          this.getAnimatedStyle(),
        ]}
      >
        <Text style={styles.chartTitle}>DOSAGE DISTRIBUTION</Text>
        <PieChart
          data={data}
          width={CHART_WIDTH}
          height={200}
          chartConfig={chartConfig}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          hasLegend
        />
      </Animated.View>
    );
  };

  renderTimeChart = () => {
    const timeData = this.getTimeDistribution();
    const data = {
      labels: ["Morning", "Afternoon", "Evening"],
      datasets: [{
        data: Object.values(timeData),
        color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
        strokeWidth: 2
      }]
    };

    return (
      <Animated.View 
        style={[
          styles.chartContainer,
          this.getAnimatedStyle(),
        ]}
      >
        <Text style={styles.chartTitle}>MEDICATION TIMES</Text>
        <BarChart
          data={data}
          width={CHART_WIDTH}
          height={220}
          chartConfig={chartConfig}
          style={styles.barChartStyle}
        />
      </Animated.View>
    );
  };

  renderAdherenceGauge = () => {
    const adherencePercent = this.calculateMedicationAdherence();
    const circumference = 2 * Math.PI * GAUGE_RADIUS;
    const strokeDashoffset = circumference - (circumference * adherencePercent) / 100;

    return (
      <Animated.View 
        style={[
          styles.gaugeContainer,
          this.getAnimatedStyle(),
        ]}
      >
        <Text style={styles.chartTitle}>ADHERENCE RATE</Text>
        <View style={styles.gauge}>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={GAUGE_RADIUS}
              stroke="#333"
              strokeWidth={12}
              fill="transparent"
            />
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={GAUGE_RADIUS}
              stroke="#4CAF50"
              strokeWidth={12}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform={`rotate(-90, ${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2})`}
            />
          </Svg>
          <Text style={styles.gaugeText}>{adherencePercent}%</Text>
        </View>
        <Text style={styles.gaugeSubtext}>of medications are active</Text>
      </Animated.View>
    );
  };

  getAnimatedStyle = () => ({
    opacity: this.state.fadeAnim,
    transform: [{ scale: this.state.scaleAnim }],
  });

  renderHeader = () => {
    const { medications } = this.state;

    return (
      <Animated.View style={[styles.header, this.getAnimatedStyle()]}>
        <Ionicons name="heart" size={24} color="#FFF" />
        <Text style={styles.headerTitle}>HEALTH ANALYTICS</Text>
        <View style={styles.headerStats}>
          <View style={styles.statPill}>
            <Text style={styles.statPillText}>{medications.length}</Text>
            <Text style={styles.statPillLabel}>MEDS</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007bff" />
      <Text style={styles.loadingText}>ANALYZING HEALTH DATA</Text>
    </View>
  );

  renderError = () => (
    <View style={styles.loadingContainer}>
      <Ionicons name="alert-circle-outline" size={50} color="#F44336" />
      <Text style={styles.errorText}>{this.state.error}</Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={this.handleRefresh}
      >
        <Ionicons name="refresh" size={24} color="#007bff" />
        <Text style={styles.refreshText}>TRY AGAIN</Text>
      </TouchableOpacity>
    </View>
  );

  renderContent = () => (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={this.state.refreshing}
          onRefresh={this.handleRefresh}
          colors={['#007bff']}
          tintColor="#007bff"
        />
      }
    >
      {this.renderAdherenceGauge()}
      {this.renderDosageChart()}
      {this.renderTimeChart()}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Last updated: {new Date().toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );

  render() {
    const { isLoading, error, refreshing } = this.state;

    if (isLoading && !refreshing) {
      return this.renderLoading();
    }

    if (error) {
      return this.renderError();
    }

    return (
      <>
        {this.renderHeader()}
        {this.renderContent()}
      </>
    );
  }
}

// Shared chart configuration
const chartConfig = {
  backgroundColor: '#121212',
  backgroundGradientFrom: '#121212',
  backgroundGradientTo: '#121212',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#007bff",
  },
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    padding: 20,
    flex: viewportHeight,
    justifyContent: 'center',
    overflow: 'hidden',

  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    overflow: 'hidden',
  },
  loadingText: {
    color: 'white',
    marginTop: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerContainer: {
    backgroundColor: '#0078D4',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0078D4',
    paddingTop: 35,
    overflow: 'hidden',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  
  statPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  statPillText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  statPillLabel: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  chartContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  chartTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 1,
    opacity: 0.8,
  },
  barChartStyle: {

    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    padding: 0,
    borderWidth: 1,
    borderColor: 'black',
    overflow: 'hidden',
    
    
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  gauge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  gaugeText: {
    position: 'absolute',
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  gaugeSubtext: {
    color: '#AAA',
    fontSize: 14,
    marginTop: -10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
  },
  refreshText: {
    color: '#007bff',
    marginLeft: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: '#555',
    fontSize: 12,
  },
});

export default HealthStatsScreen;