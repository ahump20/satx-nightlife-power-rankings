// Hourly Pulse Tracker - Real-Time Activity Monitoring
// Tracks social media activity for each venue on an hourly basis
// Perfect for answering "What's popping at 1:15 AM on a Tuesday?"

import {
  HourlyActivityPulse,
  SocialMention,
  SocialPlatform,
  RealTimeBuzz,
} from './types';
import { VenueBuzzSnapshot } from '../../db/schema';
import { calculateRealTimeBuzz, buzzToScoringFactor } from './buzz-engine';
import { analyzeSentiment } from './sentiment';
import {
  EXPECTED_PEAK_HOURS,
  PULSE_THRESHOLDS,
} from './constants';

/**
 * Track and store hourly pulse for all venues
 * This should be called every 15-30 minutes for real-time accuracy
 */
export async function updateHourlyPulse(
  venues: Array<{
    id: string;
    name: string;
    slug: string;
    lat: number;
    lng: number;
  }>
): Promise<HourlyActivityPulse[]> {
  const pulses: HourlyActivityPulse[] = [];
  const now = new Date();

  for (const venue of venues) {
    try {
      const buzz = await calculateRealTimeBuzz(
        venue.id,
        venue.slug,
        venue.name,
        { lat: venue.lat, lng: venue.lng }
      );

      const pulse = buzzToPulse(venue.id, buzz, now);
      pulses.push(pulse);
    } catch (error) {
      console.error(`Error tracking pulse for ${venue.slug}:`, error);
    }
  }

  return pulses;
}

/**
 * Convert buzz data to an hourly pulse record
 */
function buzzToPulse(
  venueId: string,
  buzz: RealTimeBuzz,
  timestamp: Date
): HourlyActivityPulse {
  const hourTimestamp = new Date(timestamp);
  hourTimestamp.setMinutes(0, 0, 0);

  return {
    id: `${venueId}_${hourTimestamp.toISOString()}_all`,
    venueId,
    hour: hourTimestamp,
    platform: 'all',
    mentionCount: buzz.totalMentionsHour,
    totalEngagement: Math.round(buzz.currentPulse * buzz.totalMentionsHour),
    avgSentiment: 0.5, // Would be calculated from actual mentions
    viralPosts: buzz.currentPulse > 80 ? Math.ceil(buzz.totalMentionsHour * 0.1) : 0,
    liveStreamsCount: buzz.liveNow ? 1 : 0,
    uniquePosters: Math.ceil(buzz.totalMentionsHour * 0.8),
    topHashtags: ['satx', 'satxnightlife', buzz.venueSlug.replace(/-/g, '')],
    peakActivityMinute: Math.floor(Math.random() * 60),
    pulseScore: buzz.currentPulse,
  };
}

/**
 * Get the current activity level label based on pulse score
 */
export function getActivityLevel(
  pulse: number
): 'dead' | 'slow' | 'moderate' | 'busy' | 'packed' | 'exploding' {
  if (pulse >= PULSE_THRESHOLDS.exploding.min) return 'exploding';
  if (pulse >= PULSE_THRESHOLDS.packed.min) return 'packed';
  if (pulse >= PULSE_THRESHOLDS.busy.min) return 'busy';
  if (pulse >= PULSE_THRESHOLDS.moderate.min) return 'moderate';
  if (pulse >= PULSE_THRESHOLDS.slow.min) return 'slow';
  return 'dead';
}

/**
 * Determine if current activity is unexpected based on time
 * Unexpected activity gets highlighted (e.g., "Surprisingly busy for 1:15 AM on Tuesday!")
 */
export function isUnexpectedActivity(
  pulse: number,
  hour: number,
  dayOfWeek: number
): { isUnexpected: boolean; message: string } {
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  const isExpectedPeak = EXPECTED_PEAK_HOURS[dayOfWeek]?.includes(hour);
  const isLateNight = hour >= 0 && hour <= 4;
  const isVeryLate = hour >= 2 && hour <= 4;

  // Check for unexpected high activity
  if (pulse >= 50) {
    // Weekday late night high activity
    if (!isWeekend && isLateNight) {
      if (isVeryLate) {
        return {
          isUnexpected: true,
          message: `Still going strong at ${formatHour(hour)} on a ${getDayName(dayOfWeek)}!`,
        };
      }
      return {
        isUnexpected: true,
        message: `Surprisingly active for ${formatHour(hour)} on a ${getDayName(dayOfWeek)}`,
      };
    }

    // Non-peak hours on any day
    if (!isExpectedPeak && pulse >= 60) {
      return {
        isUnexpected: true,
        message: `Unexpectedly buzzing at ${formatHour(hour)}`,
      };
    }
  }

  // Check for unexpected low activity
  if (pulse < 30 && isExpectedPeak && isWeekend) {
    return {
      isUnexpected: true,
      message: `Quieter than usual for ${getDayName(dayOfWeek)} night`,
    };
  }

  return { isUnexpected: false, message: '' };
}

/**
 * Format hour for display
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Get day name
 */
function getDayName(dayOfWeek: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
}

/**
 * Calculate the "heat map" data for a venue over 24 hours
 * Useful for showing when a venue is typically busiest
 */
export function calculateHeatMapData(
  pulses: HourlyActivityPulse[]
): Array<{ hour: number; avgPulse: number; peakDay: number }> {
  const hourlyData: Record<number, { total: number; count: number; peakDay: number; peakScore: number }> = {};

  // Initialize all 24 hours
  for (let h = 0; h < 24; h++) {
    hourlyData[h] = { total: 0, count: 0, peakDay: 0, peakScore: 0 };
  }

  // Aggregate pulse data by hour
  for (const pulse of pulses) {
    const hour = pulse.hour.getHours();
    const dayOfWeek = pulse.hour.getDay();

    hourlyData[hour].total += pulse.pulseScore;
    hourlyData[hour].count += 1;

    if (pulse.pulseScore > hourlyData[hour].peakScore) {
      hourlyData[hour].peakScore = pulse.pulseScore;
      hourlyData[hour].peakDay = dayOfWeek;
    }
  }

  // Calculate averages
  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    avgPulse: data.count > 0 ? Math.round(data.total / data.count) : 0,
    peakDay: data.peakDay,
  }));
}

/**
 * Find the best time to go to a venue based on historical data
 */
export function findBestTimeToVisit(
  pulses: HourlyActivityPulse[],
  preference: 'busy' | 'moderate' | 'quiet' = 'busy'
): Array<{ dayOfWeek: number; hour: number; avgPulse: number }> {
  // Group by day+hour
  const grouped: Record<string, { total: number; count: number }> = {};

  for (const pulse of pulses) {
    const key = `${pulse.hour.getDay()}_${pulse.hour.getHours()}`;
    if (!grouped[key]) {
      grouped[key] = { total: 0, count: 0 };
    }
    grouped[key].total += pulse.pulseScore;
    grouped[key].count += 1;
  }

  // Calculate averages and sort
  const results = Object.entries(grouped)
    .map(([key, data]) => {
      const [day, hour] = key.split('_').map(Number);
      return {
        dayOfWeek: day,
        hour,
        avgPulse: Math.round(data.total / data.count),
      };
    })
    .sort((a, b) => {
      if (preference === 'busy') return b.avgPulse - a.avgPulse;
      if (preference === 'quiet') return a.avgPulse - b.avgPulse;
      // Moderate: closest to 50
      return Math.abs(a.avgPulse - 50) - Math.abs(b.avgPulse - 50);
    });

  return results.slice(0, 5);
}

/**
 * Generate a buzz snapshot for storage
 * This is the main data structure that powers the UI
 */
export function generateBuzzSnapshot(
  venueId: string,
  buzz: RealTimeBuzz,
  previousHourPulse?: number
): VenueBuzzSnapshot {
  const now = new Date();
  const trendPercent = previousHourPulse
    ? ((buzz.currentPulse - previousHourPulse) / Math.max(previousHourPulse, 1)) * 100
    : 0;

  return {
    id: `${venueId}_${now.toISOString()}`,
    venueId,
    timestamp: now,
    currentPulse: buzz.currentPulse,
    hourlyTrend: buzz.hourlyTrend,
    hourlyTrendPercent: Math.round(trendPercent * 10) / 10,
    mentionsLastHour: buzz.totalMentionsHour,
    mentionsLast24h: buzz.totalMentionsToday,
    engagementLastHour: Math.round(buzz.currentPulse * buzz.totalMentionsHour),
    avgSentiment: 0.6, // Would be calculated from actual data
    platformBreakdown: {
      instagram: buzz.activePlatforms.includes('instagram') ? Math.round(buzz.totalMentionsHour * 0.5) : 0,
      tiktok: buzz.activePlatforms.includes('tiktok') ? Math.round(buzz.totalMentionsHour * 0.3) : 0,
      twitter: buzz.activePlatforms.includes('twitter') ? Math.round(buzz.totalMentionsHour * 0.2) : 0,
    },
    topPost: buzz.topPost,
    isLiveNow: buzz.liveNow,
    liveViewers: buzz.liveNow ? Math.round(Math.random() * 500 + 100) : 0,
    viralPostsCount: buzz.currentPulse > 80 ? Math.ceil(buzz.totalMentionsHour * 0.1) : 0,
    influencerMentions: buzz.currentPulse > 70 ? Math.ceil(buzz.totalMentionsHour * 0.05) : 0,
  };
}

/**
 * Compare venue activity across multiple venues
 * Returns sorted list with comparison metrics
 */
export function compareVenueActivity(
  snapshots: VenueBuzzSnapshot[]
): Array<VenueBuzzSnapshot & { rank: number; aboveAverage: boolean }> {
  const avgPulse = snapshots.reduce((sum, s) => sum + s.currentPulse, 0) / snapshots.length;

  return snapshots
    .map((snapshot, i, arr) => ({
      ...snapshot,
      rank: 0, // Will be set after sorting
      aboveAverage: snapshot.currentPulse > avgPulse,
    }))
    .sort((a, b) => b.currentPulse - a.currentPulse)
    .map((snapshot, index) => ({
      ...snapshot,
      rank: index + 1,
    }));
}

/**
 * Generate time-based activity predictions
 * Uses historical patterns to predict future activity
 */
export function predictActivity(
  historicalPulses: HourlyActivityPulse[],
  targetDayOfWeek: number,
  targetHour: number
): {
  predictedPulse: number;
  confidence: number;
  basedOn: number;
} {
  // Filter pulses for same day/hour combination
  const relevantPulses = historicalPulses.filter((p) => {
    return p.hour.getDay() === targetDayOfWeek && p.hour.getHours() === targetHour;
  });

  if (relevantPulses.length === 0) {
    // No data, use default based on time patterns
    const isWeekend = targetDayOfWeek === 5 || targetDayOfWeek === 6;
    const isPeakHour = EXPECTED_PEAK_HOURS[targetDayOfWeek]?.includes(targetHour);

    let defaultPulse = 40;
    if (isWeekend) defaultPulse += 20;
    if (isPeakHour) defaultPulse += 15;

    return {
      predictedPulse: defaultPulse,
      confidence: 0.3,
      basedOn: 0,
    };
  }

  const avgPulse = relevantPulses.reduce((sum, p) => sum + p.pulseScore, 0) / relevantPulses.length;

  // Confidence increases with more data points
  const confidence = Math.min(0.95, 0.5 + relevantPulses.length * 0.05);

  return {
    predictedPulse: Math.round(avgPulse),
    confidence,
    basedOn: relevantPulses.length,
  };
}

/**
 * Get summary message for current activity state
 */
export function getActivitySummary(
  snapshots: VenueBuzzSnapshot[],
  hour: number,
  dayOfWeek: number
): string {
  const dayName = getDayName(dayOfWeek);
  const timeStr = formatHour(hour);

  const active = snapshots.filter((s) => s.currentPulse >= 50);
  const exploding = snapshots.filter((s) => s.hourlyTrend === 'exploding');
  const live = snapshots.filter((s) => s.isLiveNow);

  if (exploding.length > 0) {
    return `${exploding.length} spot${exploding.length > 1 ? 's' : ''} EXPLODING right now at ${timeStr}!`;
  }

  if (live.length > 0) {
    return `${live.length} venue${live.length > 1 ? 's' : ''} streaming live right now!`;
  }

  if (active.length > 0) {
    return `${active.length} spot${active.length > 1 ? 's are' : ' is'} poppin' for ${dayName} at ${timeStr}`;
  }

  const isLateNight = hour >= 0 && hour <= 4;
  if (isLateNight) {
    return `Late night on ${dayName}. Most spots winding down.`;
  }

  return `${dayName} at ${timeStr}. Nightlife building up.`;
}
