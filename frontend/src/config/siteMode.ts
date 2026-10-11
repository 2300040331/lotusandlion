/**
 * Lotus & Lion - Site Visibility Configuration
 *
 * SITE_MODE Options:
 * - "LIVE"        : Public visitors see the full, live Lotus & Lion website.
 * - "COMING_SOON" : Public visitors see only the Coming Soon page.
 */

export type SiteMode = 'COMING_SOON' | 'LIVE';

export const SITE_MODE: SiteMode = 'LIVE';
