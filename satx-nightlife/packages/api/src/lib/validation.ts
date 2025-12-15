/**
 * Validation Utilities
 * Input sanitization and validation helpers
 */

import { z } from 'zod';

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Validate and sanitize slug
 */
export function validateSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

/**
 * Generate slug from name
 */
export function generateSlug(name: string): string {
  return validateSlug(name);
}

/**
 * Validate coordinates
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (basic US format)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Validate time string (HH:MM format)
 */
export function isValidTime(time: string): boolean {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;

  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Validate date string (YYYY-MM-DD format)
 */
export function isValidDate(date: string): boolean {
  const parsed = Date.parse(date);
  if (isNaN(parsed)) return false;

  // Check format
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  venueCreate: z.object({
    name: z.string().min(2).max(200).transform(sanitizeString),
    address: z.string().min(5).max(500).transform(sanitizeString),
    city: z.string().min(2).max(100).transform(sanitizeString),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    category: z.enum([
      'bar',
      'cocktail_lounge',
      'brewery',
      'winery',
      'sports_bar',
      'dive_bar',
      'rooftop',
      'live_music',
      'club',
      'restaurant_bar',
    ]),
    phone: z.string().optional().refine((v) => !v || isValidPhone(v)),
    website: z.string().optional().refine((v) => !v || isValidUrl(v)),
    priceLevel: z.number().min(1).max(4).optional(),
  }),

  dealCreate: z.object({
    venue_id: z.string().uuid(),
    title: z.string().min(3).max(200).transform(sanitizeString),
    description: z.string().max(1000).optional().transform((v) => (v ? sanitizeString(v) : v)),
    deal_type: z.enum(['happy_hour', 'daily_special', 'event', 'student', 'industry', 'limited_time']),
    day_of_week: z.number().min(0).max(6).optional(),
    start_time: z.string().optional().refine((v) => !v || isValidTime(v)),
    end_time: z.string().optional().refine((v) => !v || isValidTime(v)),
    discount_percent: z.number().min(0).max(100).optional(),
    discount_amount: z.number().min(0).optional(),
    tags: z.array(z.string().max(50).transform(sanitizeString)).max(10).optional(),
  }),

  submissionCreate: z.object({
    venue_id: z.string().uuid().optional(),
    venue_name_submitted: z.string().min(2).max(200).transform(sanitizeString).optional(),
    submission_type: z.enum(['deal', 'venue_update', 'new_venue']),
    data: z.record(z.unknown()),
  }),
};

/**
 * Parse and validate with error formatting
 */
export function parseWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return { success: false, errors };
}
