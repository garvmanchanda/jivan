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
import { colors, typography, spacing, borderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;
const BAR_HEIGHT = 120;

type TimeRange = 'daily' | 'weekly' | 'monthly';

export default function TrackingHistoryScreen() {
  const router = useRouter();
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');

  const dailyMetrics = [
    { type: 'sleep', label: 'Sleep', unit: 'hrs', color: colors.primaryLight, icon: '😴', max: 12 },
    { type: 'water', label: 'Water', unit: 'glasses', color: colors.accentBlue, icon: '💧', max: 15 },
    { type: 'steps', label: 'Steps', unit: 'steps', color: colors.accentGreen, icon: '👟', max: 15000 },
    { type: 'alcohol', label: 'Alcohol', unit: 'drinks', color: colors.accentYellow, icon: '🍺', max: 10 },
    { type: 'cigarettes', label: 'Cigarettes', unit: 'count', color: colors.accentRed, icon: '🚬', max: 20 },
  ];

  useEffect(() => {
    loadVitals();
  }, []);

  const loadVitals = async () => {
    const profileId = await getActiveProfileId();
    if (!profileId) return;

    const profileVitals = await getVitals(profileId);
    const dailyVitals = profileVitals.filter(v => v.isDaily);
    setVitals(dailyVitals);
  };

  const getMetricData = (type: string) => {
    const metricVitals = vitals.filter(v => v.type === type);
    
    if (timeRange === 'daily') {
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
    const maxValue = Math.max(...data.map(d => d.value), metric.max * 0.5);
    const latestValue = data[data.length - 1]?.value || 0;
    
    return (
      <View key={metric.type} style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartHeaderLeft}>
            <Text style={styles.chartIcon}>{metric.icon}</Text>
            <View>
              <Text style={styles.chartTitle}>{metric.label}</Text>
              <Text style={styles.chartValue}>
                {latestValue > 0 ? `${latestValue.toLocaleString()} ${metric.unit}` : 'No data'}
              </Text>
            </View>
          </View>
          <View style={[styles.chartBadge, { backgroundColor: `${metric.color}20` }]}>
            <Text style={[styles.chartBadgeText, { color: metric.color }]}>
              {timeRange === 'daily' ? '7D' : timeRange === 'weekly' ? '8W' : '6M'}
            </Text>
          </View>
        </View>
        
        <View style={styles.chart}>
          {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * BAR_HEIGHT : 0;
            const isLast = index === data.length - 1;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 4),
                        backgroundColor: isLast ? metric.color : `${metric.color}60`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, isLast && styles.barLabelActive]}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tracking History</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
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
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {dailyMetrics.map(metric => renderBarChart(metric))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: colors.textPrimary,
    fontSize: 24,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  timeRangeContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: colors.primary,
  },
  timeRangeText: {
    color: colors.textMuted,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  timeRangeTextActive: {
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  chartTitle: {
    color: colors.textPrimary,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    marginBottom: 2,
  },
  chartValue: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  chartBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  chartBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_HEIGHT + 30,
    paddingTop: spacing.sm,
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
    marginBottom: spacing.sm,
  },
  bar: {
    width: '60%',
    borderRadius: borderRadius.sm,
    minHeight: 4,
  },
  barLabel: {
    color: colors.textMuted,
    fontSize: typography.xs,
  },
  barLabelActive: {
    color: colors.textPrimary,
    fontWeight: typography.semibold,
  },
});
