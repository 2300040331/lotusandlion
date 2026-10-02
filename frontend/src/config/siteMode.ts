/**
 * Lotus & Lion - Site Visibility Configuration
 *
 * SITE_MODE Options:
 * - "COMING_SOON" : Public visitors see only the luxury Coming Soon page.
 *                   Existing website remains 100% intact and preserved in backend/admin.
 * - "LIVE"        : Public visitors see the full, live Lotus & Lion website.
 *
 * To toggle:
 * 1. Change SITE_MODE below to "LIVE" or "COMING_SOON", OR
 * 2. Set the environment variable NEXT_PUBLIC_SITE_MODE=LIVE (or COMING_SOON)
 */

export type SiteMode = 'COMING_SOON' | 'LIVE';

// Default mode is COMING_SOON (can be overridden by NEXT_PUBLIC_SITE_MODE)
export const SITE_MODE: SiteMode =
  (process.env.NEXT_PUBLIC_SITE_MODE as SiteMode) || 'COMING_SOON';
