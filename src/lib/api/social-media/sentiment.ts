// Sentiment Analysis for Social Media Content
// Lightweight keyword-based sentiment analysis for nightlife posts

import { SentimentResult } from './types';
import { HIGH_ACTIVITY_KEYWORDS, LOW_ACTIVITY_KEYWORDS, NIGHTLIFE_KEYWORDS } from './constants';

/**
 * Positive sentiment keywords for nightlife context
 */
const POSITIVE_KEYWORDS = [
  // General positive
  'amazing', 'awesome', 'best', 'love', 'loved', 'loving', 'great', 'perfect',
  'incredible', 'fantastic', 'wonderful', 'excellent', 'outstanding', 'brilliant',
  'superb', 'phenomenal', 'exceptional', 'magnificent', 'sublime', 'divine',

  // Fun/Party
  'fun', 'lit', 'fire', 'vibes', 'vibe', 'vibey', 'vibin', 'hype', 'hyped',
  'popping', 'poppin', 'turnt', 'turnup', 'wild', 'crazy', 'insane', 'epic',
  'legendary', 'iconic', 'unforgettable', 'memorable', 'unreal', 'dope',

  // Social
  'friends', 'squad', 'crew', 'fam', 'family', 'bday', 'birthday', 'celebrate',
  'celebration', 'cheers', 'toast', 'toasting', 'party', 'partying',

  // Quality
  'delicious', 'tasty', 'yummy', 'good', 'nice', 'cool', 'chill', 'solid',
  'quality', 'classy', 'fancy', 'upscale', 'premium', 'crafted', 'artisan',

  // Recommendations
  'recommend', 'recommended', 'must', 'favorite', 'fave', 'goat', 'goated',
  'comeback', 'return', 'returning', 'again', 'always', 'obsessed',

  // Atmosphere
  'beautiful', 'gorgeous', 'stunning', 'cozy', 'intimate', 'romantic',
  'aesthetic', 'instagrammable', 'photogenic', 'scenic', 'view', 'views',

  // Service
  'friendly', 'welcoming', 'helpful', 'attentive', 'quick', 'fast',
  'professional', 'courteous', 'knowledgeable', 'expert',

  // Emojis (text versions)
  '🔥', '❤️', '😍', '🥰', '💯', '👏', '🙌', '✨', '💫', '🎉', '🍻', '🥂',
];

/**
 * Negative sentiment keywords for nightlife context
 */
const NEGATIVE_KEYWORDS = [
  // General negative
  'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'hated', 'hating',
  'disappointing', 'disappointed', 'disappoints', 'trash', 'garbage', 'waste',
  'regret', 'mistake', 'never', 'avoid', 'skip', 'pass', 'overrated',

  // Service issues
  'rude', 'slow', 'ignored', 'waited', 'waiting', 'forever', 'hours',
  'unprofessional', 'disrespectful', 'dismissive', 'careless', 'neglected',

  // Quality issues
  'weak', 'watered', 'overpriced', 'expensive', 'ripoff', 'scam',
  'stale', 'cold', 'warm', 'gross', 'nasty', 'disgusting',

  // Atmosphere issues
  'empty', 'dead', 'boring', 'lame', 'quiet', 'ghost', 'crickets',
  'loud', 'noisy', 'crowded', 'packed', 'stuffed', 'cramped', 'tiny',
  'dirty', 'filthy', 'sticky', 'smelly', 'sketchy', 'unsafe',

  // Experience issues
  'fight', 'fighting', 'drama', 'kicked', 'bounced', 'refused', 'denied',
  'sick', 'ill', 'poisoned', 'hangover', 'regrets',

  // Emojis (text versions)
  '👎', '💀', '😤', '😡', '🤮', '👻',
];

/**
 * Intensity modifiers that amplify sentiment
 */
const INTENSITY_AMPLIFIERS = [
  'very', 'really', 'so', 'super', 'extremely', 'absolutely', 'totally',
  'completely', 'utterly', 'seriously', 'literally', 'genuinely', 'truly',
  'honestly', 'actually', 'definitely', 'certainly', 'undoubtedly',
];

/**
 * Negation words that flip sentiment
 */
const NEGATION_WORDS = [
  'not', "n't", 'no', 'never', 'none', 'neither', 'nobody', 'nothing',
  'nowhere', 'without', "wasn't", "isn't", "aren't", "weren't", "don't",
  "doesn't", "didn't", "won't", "wouldn't", "couldn't", "shouldn't",
];

/**
 * Analyze sentiment of text content
 */
export function analyzeSentiment(text: string): SentimentResult {
  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\s+/);

  let positiveScore = 0;
  let negativeScore = 0;
  const detectedKeywords: string[] = [];

  // Track negation context
  let negationActive = false;
  let intensityMultiplier = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^\w]/g, '');

    // Check for negation
    if (NEGATION_WORDS.some(neg => words[i].includes(neg))) {
      negationActive = true;
      continue;
    }

    // Check for intensity amplifiers
    if (INTENSITY_AMPLIFIERS.includes(word)) {
      intensityMultiplier = 1.5;
      continue;
    }

    // Check positive keywords
    if (POSITIVE_KEYWORDS.includes(word)) {
      if (negationActive) {
        negativeScore += 1 * intensityMultiplier;
      } else {
        positiveScore += 1 * intensityMultiplier;
      }
      detectedKeywords.push(word);
    }

    // Check negative keywords
    if (NEGATIVE_KEYWORDS.includes(word)) {
      if (negationActive) {
        positiveScore += 1 * intensityMultiplier;
      } else {
        negativeScore += 1 * intensityMultiplier;
      }
      detectedKeywords.push(word);
    }

    // Check high activity keywords (positive for nightlife)
    if (HIGH_ACTIVITY_KEYWORDS.includes(word)) {
      positiveScore += 0.5 * intensityMultiplier;
      detectedKeywords.push(word);
    }

    // Check low activity keywords (slightly negative for nightlife)
    if (LOW_ACTIVITY_KEYWORDS.includes(word)) {
      negativeScore += 0.3 * intensityMultiplier;
      detectedKeywords.push(word);
    }

    // Reset modifiers after processing a sentiment word
    if (POSITIVE_KEYWORDS.includes(word) || NEGATIVE_KEYWORDS.includes(word)) {
      negationActive = false;
      intensityMultiplier = 1;
    }

    // Reset negation after 3 words
    if (negationActive && i > 0 && !NEGATION_WORDS.some(neg => words[i - 1]?.includes(neg))) {
      negationActive = false;
    }
  }

  // Check for emoji sentiment (direct in text)
  for (const emoji of POSITIVE_KEYWORDS.filter(k => k.length <= 2)) {
    const count = (text.match(new RegExp(emoji, 'g')) || []).length;
    positiveScore += count * 0.5;
  }
  for (const emoji of NEGATIVE_KEYWORDS.filter(k => k.length <= 2)) {
    const count = (text.match(new RegExp(emoji, 'g')) || []).length;
    negativeScore += count * 0.5;
  }

  // Calculate final score (-1 to 1)
  const totalScore = positiveScore + negativeScore;
  let score = 0;

  if (totalScore > 0) {
    score = (positiveScore - negativeScore) / totalScore;
  }

  // Determine label and confidence
  let label: 'positive' | 'negative' | 'neutral';
  let confidence: number;

  if (Math.abs(score) < 0.2) {
    label = 'neutral';
    confidence = 1 - Math.abs(score) * 2;
  } else if (score > 0) {
    label = 'positive';
    confidence = Math.min(1, score + 0.3);
  } else {
    label = 'negative';
    confidence = Math.min(1, Math.abs(score) + 0.3);
  }

  return {
    score,
    label,
    confidence,
    keywords: [...new Set(detectedKeywords)].slice(0, 10),
  };
}

/**
 * Analyze activity level from text
 * Returns a score indicating how busy/active a venue seems
 */
export function analyzeActivityLevel(text: string): {
  level: 'dead' | 'slow' | 'moderate' | 'busy' | 'packed' | 'exploding';
  score: number; // 0-100
  indicators: string[];
} {
  const normalizedText = text.toLowerCase();
  const indicators: string[] = [];
  let activityScore = 50; // Start neutral

  // Check for high activity keywords
  for (const keyword of HIGH_ACTIVITY_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
      activityScore += 10;
      indicators.push(keyword);
    }
  }

  // Check for low activity keywords
  for (const keyword of LOW_ACTIVITY_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
      activityScore -= 15;
      indicators.push(keyword);
    }
  }

  // Check for line/wait mentions (indicates busy)
  if (/\b(line|wait|queue|door)\b/.test(normalizedText)) {
    if (!/\bno (line|wait)\b/.test(normalizedText)) {
      activityScore += 20;
      indicators.push('wait mentioned');
    }
  }

  // Check for people mentions
  const peopleMatch = normalizedText.match(/\b(\d+)\s*(people|folks|friends|crew)\b/);
  if (peopleMatch) {
    const count = parseInt(peopleMatch[1]);
    if (count > 20) {
      activityScore += 25;
      indicators.push(`${count} people`);
    } else if (count > 10) {
      activityScore += 15;
      indicators.push(`${count} people`);
    }
  }

  // Clamp score
  activityScore = Math.max(0, Math.min(100, activityScore));

  // Determine level
  let level: 'dead' | 'slow' | 'moderate' | 'busy' | 'packed' | 'exploding';
  if (activityScore < 10) level = 'dead';
  else if (activityScore < 30) level = 'slow';
  else if (activityScore < 50) level = 'moderate';
  else if (activityScore < 70) level = 'busy';
  else if (activityScore < 85) level = 'packed';
  else level = 'exploding';

  return {
    level,
    score: activityScore,
    indicators: [...new Set(indicators)],
  };
}

/**
 * Extract vibes/atmosphere from text
 */
export function extractVibes(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const vibes: string[] = [];

  const vibeKeywords: Record<string, string[]> = {
    'chill': ['chill', 'relaxed', 'relaxing', 'calm', 'mellow', 'lowkey', 'laid back', 'cozy'],
    'energetic': ['hype', 'hyped', 'energy', 'energetic', 'wild', 'crazy', 'turnt', 'lit'],
    'classy': ['classy', 'upscale', 'fancy', 'elegant', 'sophisticated', 'refined', 'posh'],
    'casual': ['casual', 'dive', 'neighborhood', 'local', 'friendly', 'welcoming'],
    'romantic': ['romantic', 'intimate', 'date', 'couples', 'candlelit', 'cozy'],
    'party': ['party', 'dancing', 'dance floor', 'dj', 'club', 'clubbing', 'rave'],
    'live music': ['live music', 'band', 'concert', 'acoustic', 'jazz', 'blues'],
    'sports': ['sports', 'game', 'football', 'basketball', 'ufc', 'fight'],
    'trendy': ['trendy', 'hip', 'cool', 'instagram', 'influencer', 'aesthetic'],
  };

  for (const [vibe, keywords] of Object.entries(vibeKeywords)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        vibes.push(vibe);
        break;
      }
    }
  }

  return [...new Set(vibes)];
}

/**
 * Analyze overall post quality for ranking
 * Higher quality posts should have more weight in scoring
 */
export function analyzePostQuality(
  text: string,
  likeCount: number,
  commentCount: number,
  authorFollowers: number
): number {
  let quality = 50; // Base quality

  // Text length bonus (thoughtful posts)
  if (text.length > 200) quality += 10;
  else if (text.length > 100) quality += 5;
  else if (text.length < 20) quality -= 10;

  // Hashtag balance (too many = spammy)
  const hashtagCount = (text.match(/#/g) || []).length;
  if (hashtagCount > 10) quality -= 15;
  else if (hashtagCount > 5) quality -= 5;

  // Engagement signals
  if (likeCount > 1000) quality += 20;
  else if (likeCount > 100) quality += 10;
  else if (likeCount > 10) quality += 5;

  if (commentCount > 50) quality += 15;
  else if (commentCount > 10) quality += 10;
  else if (commentCount > 5) quality += 5;

  // Author credibility
  if (authorFollowers > 100000) quality += 20;
  else if (authorFollowers > 10000) quality += 15;
  else if (authorFollowers > 1000) quality += 10;

  return Math.max(0, Math.min(100, quality));
}
