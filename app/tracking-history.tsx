import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getVitals, getActiveProfileId } from '../services/supabaseStorage';
import { Vital } from '../types';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;
const BAR_HEIGHT = 150;

type TimeRange = 'daily' | 'weekly' | 'monthly';

export default function TrackingHistoryScreen() {
  const router = useRouter();
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');

  const dailyMetrics = [
    { type: 'sleep', label: 'Sleep', unit: 'hrs', color: '#a78bfa', max: 12 },
    { type: 'water', label: 'Water', unit: 'glasses', color: '#60a5fa', max: 15 },
    { type: 'steps', label: 'Steps', unit: 'steps', color: '#34d399', max: 15000 },
    { type: 'alcohol', label: 'Alcohol', unit: 'drinks', color: '#fbbf24', max: 10 },
    { type: 'cigarettes', label: 'Cigarettes', unit: 'count', color: '#f87171', max: 20 },
  ];

  useEffect(() => {
    loadVitals();
  }, []);

  const loadVitals = async () => {
    const profileId = await getActiveProfileId();
    if (!profileId) return;

    const profileVitals = await getVitals(profileId);
    // Filter only daily tracking vitals
    const dailyVitals = profileVitals.filter(v => v.isDaily);
    setVitals(dailyVitals);
  };

  // Get data for a specific metric based on time range
  const getMetricData = (type: string) => {
    const metricVitals = vitals.filter(v => v.type === type);
    
    if (timeRange === 'daily') {
      // Last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        const dayVitals = metricVitals.filter(v => new Date(v.date).toDateString() === dateStr);
        const value = dayVitals.length > 0 ? dayVitals[dayVitals.length - 1].value : 0;
        last7Days.push({
          label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
          value,
          date: dateStr,
        });
      }
      return last7Days;
    } else if (timeRange === 'weekly') {
      // Last 8 weeks
      const last8Weeks = [];
      for (let i = 7; i >= 0; i--) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - i * 7);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        
        const weekVitals = metricVitals.filter(v => {
          const vDate = new Date(v.date);
          return vDate >= startDate && vDate <= endDate;
        });
        
        const avg = weekVitals.length > 0 
          ? weekVitals.reduce((sum, v) => sum + v.value, 0) / weekVitals.length 
          : 0;
        
        last8Weeks.push({
          label: `W${8 - i}`,
          value: Math.round(avg * 10) / 10,
          date: startDate.toDateString(),
        });
      }
      return last8Weeks;
    } else {
      // Last 6 months
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const monthVitals = metricVitals.filter(v => {
          const vDate = new Date(v.date);
          return vDate.getMonth() === month && vDate.getFullYear() === year;
        });
        
        const avg = monthVitals.length > 0 
          ? monthVitals.reduce((sum, v) => sum + v.value, 0) / monthVitals.length 
          : 0;
        
        last6Months.push({
          label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month],
          value: Math.round(avg * 10) / 10,
          date: date.toDateString(),
        });
      }
      return last6Months;
    }
  };

  const renderBarChart = (metric: typeof dailyMetrics[0]) => {
    const data = getMetricData(metric.type);
    const maxValue = Math.max(...data.map(d => d.value), metric.max);
    
    return (
      <View key={metric.type} style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{metric.label}</Text>
          <Text style={styles.chartUnit}>{metric.unit}</Text>
        </View>
        
        <View style={styles.chart}>
          {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * BAR_HEIGHT : 0;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: metric.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
                {item.value > 0 && (
                  <Text style={styles.barValue}>{item.value}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tracking History</Text>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeSelector}>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === 'daily' && styles.timeRangeButtonActive]}
          onPress={() => setTimeRange('daily')}
        >
          <Text style={[styles.timeRangeText, timeRange === 'daily' && styles.timeRangeTextActive]}>
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === 'weekly' && styles.timeRangeButtonActive]}
          onPress={() => setTimeRange('weekly')}
        >
          <Text style={[styles.timeRangeText, timeRange === 'weekly' && styles.timeRangeTextActive]}>
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === 'monthly' && styles.timeRangeButtonActive]}
          onPress={() => setTimeRange('monthly')}
        >
          <Text style={[styles.timeRangeText, timeRange === 'monthly' && styles.timeRangeTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {dailyMetrics.map(metric => renderBarChart(metric))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backText: {
    color: '#7c3aed',
    fontSize: 16,
    marginBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#7c3aed',
  },
  timeRangeText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  chartContainer: {
    marginBottom: 32,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartUnit: {
    color: '#666',
    fontSize: 14,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_HEIGHT + 50,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: BAR_HEIGHT,
    marginBottom: 8,
  },
  bar: {
    width: '70%',
    borderRadius: 4,
    minHeight: 2,
  },
  barLabel: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  barValue: {
    color: '#ccc',
    fontSize: 10,
    marginTop: 2,
  },
});

