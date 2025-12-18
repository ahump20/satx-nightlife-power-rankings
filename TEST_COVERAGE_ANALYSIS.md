# Test Coverage Analysis

## Executive Summary

**Current Test Coverage: 0%**

This codebase has no test files, no testing framework configured, and no CI/CD test automation. This analysis identifies critical areas requiring test coverage and provides prioritized recommendations.

---

## Current State

### Missing Infrastructure
- No test framework (Jest, Vitest, etc.)
- No test scripts in `package.json`
- No `.test.ts` or `.spec.ts` files
- No `__tests__` directories
- No CI/CD testing pipeline

---

## Priority 1: Critical Business Logic (High Impact, High Risk)

### 1. Scoring Algorithm (`src/lib/scoring/algorithm.ts`)

**Why it's critical:** This is the core business logic that determines venue rankings. Any bugs here directly impact user experience and venue fairness.

**Functions requiring tests:**

| Function | Risk | Test Cases Needed |
|----------|------|-------------------|
| `calculatePowerScore()` | High | Complete scoring calculation with all inputs |
| `normalizeRating()` | High | Ratings below 3.0 (penalty), ratings 3.0-5.0, edge cases (0, 5) |
| `calculateReviewVelocity()` | Medium | Zero total reviews, high velocity, low velocity |
| `calculateDealsScore()` | Medium | No deals, multiple deals, happy hour bonus, max cap |
| `calculateProximityScore()` | High | Within 1 mile, at boundary (25 miles), exponential decay |
| `calculateTrendingScore()` | Medium | Rank improved, rank declined, no change, extreme changes |
| `generateScoreExplanation()` | Low | All explanation branches |

**Example test scenarios:**
```typescript
// Edge cases to test
- Venue with null Google rating (should use 0)
- Venue with null Yelp rating (should use 0)
- Distance exactly 1 mile (should return 100)
- Distance exactly 25 miles (should return 0)
- Rating of exactly 3.0 (boundary condition)
- Maximum deals score capping at 100
- Trending score with ±50 rank changes
```

### 2. Sentiment Analysis (`src/lib/api/social-media/sentiment.ts`)

**Why it's critical:** Sentiment analysis affects social buzz scores, which influence rankings.

**Functions requiring tests:**

| Function | Risk | Test Cases Needed |
|----------|------|-------------------|
| `analyzeSentiment()` | High | Positive text, negative text, mixed sentiment |
| Negation handling | High | "not good", "wasn't bad", double negation |
| Intensity amplifiers | Medium | "very good" vs "good", "extremely bad" |
| Emoji detection | Low | Fire emoji 🔥, thumbs down 👎 |

**Example test scenarios:**
```typescript
// Sentiment edge cases
- "This place is not good" → negative (negation flips positive)
- "The service wasn't bad" → positive (negation flips negative)
- "It was really really amazing" → strong positive
- Mixed: "Great drinks but terrible service"
- Empty string input
- Only emojis
```

### 3. Distance Calculations (`src/hooks/useDistance.ts`)

**Why it's critical:** Distance affects proximity scores and venue sorting. Haversine formula errors would show wrong distances to users.

**Functions requiring tests:**

| Function | Risk | Test Cases Needed |
|----------|------|-------------------|
| `calculateDistance()` | High | Known distances, same point, antipodal points |
| `toRad()` | Low | 0°, 90°, 180°, 360° |
| `formatDistance()` | Medium | < 0.1 mi (feet), < 10 mi (1 decimal), ≥ 10 mi (rounded) |

**Example test scenarios:**
```typescript
// Known distances for validation
- San Antonio downtown to Pearl District (~1.5 miles)
- Same coordinates (0 distance)
- Very small distances (< 100 feet)
- Large distances (25+ miles)
```

---

## Priority 2: API Integrations (Medium Impact, Medium Risk)

### 4. Yelp API (`src/lib/api/yelp.ts`)

**Functions requiring tests:**
- `searchYelpVenues()` - Mock API responses, error handling
- `getYelpBusinessDetails()` - Business data mapping
- `matchVenueToYelp()` - Fuzzy name matching logic
- `mapYelpCategoryToVenueCategory()` - Category mapping accuracy

**Test approach:** Use mocked API responses to test data transformation and error handling.

### 5. Social Buzz Engine (`src/lib/api/social-media/buzz-engine.ts`)

**Functions requiring tests:**
- `calculateRealTimeBuzz()` - Buzz score calculation
- `calculatePulseScore()` - Social pulse aggregation
- `buzzToScoringFactor()` - Buzz to score conversion

---

## Priority 3: React Components & Hooks (Medium Impact, Lower Risk)

### 6. Custom Hooks

| Hook | File | Tests Needed |
|------|------|--------------|
| `useGeolocation` | `src/hooks/useGeolocation.ts` | Permission denied, success, cached location |
| `useVenues` | `src/hooks/useVenues.ts` | Loading states, error states, data transformation |
| `useSocialBuzz` | `src/hooks/useSocialBuzz.ts` | Real-time updates, fallback values |

### 7. React Components

| Component | Priority | Test Focus |
|-----------|----------|------------|
| `PowerRankings.tsx` | High | Filtering logic, sorting, venue display |
| `TonightTopBar.tsx` | Medium | Top 5 selection, distance integration |
| `VenueCard.tsx` | Medium | Props rendering, variant styling |
| `TrendingMovers.tsx` | Medium | Up/down mover calculation |

---

## Priority 4: Integration & E2E Tests (Lower Priority Initially)

### Integration Tests
1. Scoring algorithm + venue data flow
2. Geolocation + distance + proximity scoring
3. Social buzz + sentiment + final ranking

### E2E Tests (Playwright/Cypress)
1. User visits homepage → sees ranked venues
2. User enables location → venues re-sort by distance
3. User filters by category → correct venues shown
4. User views venue details → all data displays correctly

---

## Recommended Test Setup

### 1. Install Testing Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw
```

### 2. Add Test Scripts to `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 3. Create `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 4. Suggested File Structure

```
src/
├── lib/
│   ├── scoring/
│   │   ├── algorithm.ts
│   │   └── algorithm.test.ts     # Unit tests
│   └── api/
│       └── social-media/
│           ├── sentiment.ts
│           └── sentiment.test.ts  # Unit tests
├── hooks/
│   ├── useDistance.ts
│   └── useDistance.test.ts       # Hook tests
├── components/
│   ├── PowerRankings.tsx
│   └── PowerRankings.test.tsx    # Component tests
└── test/
    ├── setup.ts                   # Test setup
    ├── mocks/                     # Mock data
    └── utils/                     # Test utilities
```

---

## Test Coverage Goals

| Phase | Timeline | Target Coverage | Focus |
|-------|----------|-----------------|-------|
| Phase 1 | Immediate | 30% | Scoring algorithm, sentiment analysis |
| Phase 2 | Short-term | 50% | Distance utils, API integrations |
| Phase 3 | Medium-term | 70% | React components, hooks |
| Phase 4 | Long-term | 80%+ | E2E tests, edge cases |

---

## Risk Assessment Without Tests

| Area | Risk Level | Impact if Bug |
|------|------------|---------------|
| Scoring Algorithm | **CRITICAL** | Wrong rankings, unfair venue treatment |
| Distance Calculation | **HIGH** | Wrong distance shown, bad proximity scores |
| Sentiment Analysis | **HIGH** | Incorrect social buzz scores |
| API Integrations | **MEDIUM** | Missing data, failed fetches |
| UI Components | **LOW** | Visual bugs, UX issues |

---

## Immediate Action Items

1. **Set up Vitest** with React Testing Library
2. **Write tests for `algorithm.ts`** - highest impact
3. **Write tests for `useDistance.ts`** - pure functions, easy to test
4. **Add test script to package.json**
5. **Set up GitHub Actions** for CI test runs

---

## Sample Test Files to Create First

### `src/lib/scoring/algorithm.test.ts`
```typescript
import { describe, it, expect } from 'vitest'
import { calculatePowerScore, SCORING_WEIGHTS } from './algorithm'

describe('Scoring Algorithm', () => {
  describe('calculatePowerScore', () => {
    it('should calculate score with all inputs provided', () => {
      const input = {
        venueSlug: 'test-venue',
        googleRating: 4.5,
        yelpRating: 4.0,
        recentReviewCount: 10,
        totalReviewCount: 100,
        activeDealsCount: 2,
        hasHappyHourNow: true,
        hasEventTonight: false,
        isOpenNow: true,
        userDistance: 2.5,
        previousRank: 10,
        currentRank: 5,
        expertBoostMultiplier: 1.0,
        socialBuzzScore: 75,
      }

      const result = calculatePowerScore(input)

      expect(result.powerScore).toBeGreaterThan(0)
      expect(result.powerScore).toBeLessThanOrEqual(100)
      expect(result.breakdown).toBeDefined()
      expect(result.explanation).toBeDefined()
    })

    it('should handle null ratings gracefully', () => {
      const input = {
        venueSlug: 'test-venue',
        googleRating: null,
        yelpRating: null,
        // ... other fields
      }

      const result = calculatePowerScore(input)
      expect(result.breakdown.googleRatingScore).toBe(0)
      expect(result.breakdown.yelpRatingScore).toBe(0)
    })
  })

  describe('normalizeRating', () => {
    it('should penalize ratings below 3.0', () => {
      // Test implementation
    })

    it('should scale ratings 3.0-5.0 linearly', () => {
      // Test implementation
    })
  })
})
```

### `src/hooks/useDistance.test.ts`
```typescript
import { describe, it, expect } from 'vitest'
import { formatDistance } from './useDistance'

describe('Distance Utilities', () => {
  describe('formatDistance', () => {
    it('should format distances under 0.1 miles as feet', () => {
      expect(formatDistance(0.05)).toBe('264 ft')
    })

    it('should format distances under 10 miles with one decimal', () => {
      expect(formatDistance(5.5)).toBe('5.5 mi')
    })

    it('should round distances 10+ miles', () => {
      expect(formatDistance(15.7)).toBe('16 mi')
    })
  })
})
```

---

## Conclusion

The codebase has **zero test coverage**, which poses significant risk to:
- Ranking accuracy and fairness
- Distance calculations
- Social sentiment scoring

**Recommended immediate action:** Start with unit tests for the scoring algorithm (`algorithm.ts`) as this is the highest-impact, highest-risk code in the application.
