export const SITE_NAME = "ReviewHub";
export const DEFAULT_RATING = "4.8";
export const DEFAULT_REVIEW_COUNT = "1284";
export const DEFAULT_HERO = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80&auto=format&fit=crop";
export function getReviewUrlFromShop(shop) { return shop?.google_review_url || ""; }
