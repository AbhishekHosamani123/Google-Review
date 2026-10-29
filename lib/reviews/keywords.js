// Presets per shop category — used when shop has no custom keywords
export const KEYWORDS = [
  { id: "clean", label: "Spotless & Clean", phrase: "spotlessly clean and hygienic" },
  { id: "staff", label: "Friendly Staff", phrase: "friendly and helpful staff" },
  { id: "service", label: "Excellent Service", phrase: "excellent and prompt service" },
  { id: "value", label: "Great Value", phrase: "great value for money" },
  { id: "ambiance", label: "Beautiful Ambiance", phrase: "beautiful ambiance and comfort" },
  { id: "hospitality", label: "Warm Hospitality", phrase: "warm hospitality" },
  { id: "professional", label: "Professional", phrase: "professional and well-managed" },
  { id: "location", label: "Great Location", phrase: "great location and accessibility" },
];

export const CATEGORY_PRESETS = {
  Hotel: [
    { label: "Spotless Rooms", phrase: "spotlessly clean rooms" },
    { label: "Comfortable Stay", phrase: "comfortable and relaxing stay" },
    { label: "Warm Hospitality", phrase: "warm hospitality" },
    { label: "Tasty Breakfast", phrase: "tasty breakfast spread" },
    { label: "Great Location", phrase: "great location" },
    { label: "Excellent Service", phrase: "excellent and prompt service" },
  ],
  Restaurant: [
    { label: "Delicious Food", phrase: "delicious food" },
    { label: "Quick Service", phrase: "quick and attentive service" },
    { label: "Family Friendly", phrase: "family-friendly atmosphere" },
    { label: "Great Ambiance", phrase: "great ambiance" },
    { label: "Hygienic", phrase: "hygienic and well-maintained" },
    { label: "Value for Money", phrase: "great value for money" },
  ],
  Cafe: [
    { label: "Great Coffee", phrase: "great coffee and treats" },
    { label: "Cozy Ambiance", phrase: "cozy and welcoming ambiance" },
    { label: "Friendly Baristas", phrase: "friendly baristas" },
    { label: "Quick Service", phrase: "quick service" },
  ],
  Gym: [
    { label: "Clean Equipment", phrase: "clean and well-maintained equipment" },
    { label: "Expert Trainers", phrase: "expert and motivating trainers" },
    { label: "Good Ambiance", phrase: "energetic and positive ambiance" },
    { label: "Well Managed", phrase: "well-managed facility" },
  ],
  Hospital: [
    { label: "Caring Staff", phrase: "caring and attentive staff" },
    { label: "Clean & Hygienic", phrase: "clean and hygienic environment" },
    { label: "Professional Doctors", phrase: "professional and skilled doctors" },
    { label: "Quick Response", phrase: "quick response and care" },
  ],
  Clinic: [
    { label: "Professional Care", phrase: "professional and attentive care" },
    { label: "Clean Clinic", phrase: "clean and well-maintained clinic" },
    { label: "Helpful Staff", phrase: "helpful and courteous staff" },
  ],
  Salon: [
    { label: "Skilled Staff", phrase: "skilled and friendly staff" },
    { label: "Hygienic", phrase: "hygienic and well-maintained" },
    { label: "Great Service", phrase: "great service and attention" },
  ],
  Spa: [
    { label: "Relaxing Experience", phrase: "relaxing and rejuvenating experience" },
    { label: "Professional Therapists", phrase: "professional therapists" },
    { label: "Calm Ambiance", phrase: "calm and beautiful ambiance" },
  ],
  Store: [
    { label: "Great Collection", phrase: "great collection and variety" },
    { label: "Helpful Staff", phrase: "helpful staff" },
    { label: "Fair Pricing", phrase: "fair pricing and value" },
  ],
  Bakery: [
    { label: "Fresh Bakes", phrase: "delicious and fresh bakes" },
    { label: "Perfect Sweets", phrase: "perfect and delightful sweets" },
    { label: "Nice Variety", phrase: "nice variety of treats" },
    { label: "Everyday Fresh", phrase: "fresh every single day" },
    { label: "Reasonable Price", phrase: "reasonable prices" },
    { label: "Friendly Staff", phrase: "friendly staff" },
  ],
  Bar: [
    { label: "Great Drinks", phrase: "great drinks and selection" },
    { label: "Lively Vibe", phrase: "lively and fun vibe" },
    { label: "Good Music", phrase: "good music" },
    { label: "Quick Service", phrase: "quick service" },
    { label: "Friendly Bartenders", phrase: "friendly bartenders" },
    { label: "Good Seating", phrase: "good seating" },
  ],
};

export function getPresetKeywords(category) {
  if (!category) return KEYWORDS;
  return CATEGORY_PRESETS[category] || KEYWORDS;
}

// Extended pool for "Generate more keywords" — extra customer-safe chip labels per category
export const EXTRA_KEYWORDS = {
  Hotel: ["Comfy Beds", "Spotless Rooms", "Friendly Staff", "Tasty Breakfast", "Great Location", "Beautiful View", "Smooth Check-in", "Quiet & Peaceful", "Good Parking", "Family Friendly", "Great Value", "Relaxing Stay", "Helpful Front Desk"],
  Restaurant: ["Fresh Ingredients", "Authentic Taste", "Nice Presentation", "Polite Staff", "Clean Washrooms", "Good for Groups", "Easy Parking", "Comfortable Seating", "Perfect Spice Level", "Great Ambiance", "Quick Service", "Family Friendly"],
  Cafe: ["Good Music", "Free Wi-Fi", "Fresh Bakes", "Nice Seating", "Clean Space", "Chill Vibe", "Great Coffee", "Friendly Baristas", "Quick Service", "Cozy Corners"],
  Bakery: ["Fresh Bakes", "Tasty Snacks", "Nice Variety", "Everyday Fresh", "Good Packaging", "Reasonable Price", "Perfect Sweets", "Friendly Staff", "Clean Display"],
  Gym: ["Well Equipped", "Flexible Timings", "Motivating Music", "Clean Washrooms", "Helpful Front Desk", "Personal Attention", "Good Vibe", "Well Managed", "Expert Trainers", "Clean Equipment"],
  Hospital: ["Short Waiting Time", "Clear Explanation", "Good Facilities", "Attentive Nurses", "Smooth Admission", "Caring Follow-up", "Caring Staff", "Clean & Hygienic", "Professional Doctors", "Quick Response"],
  Clinic: ["Quick Appointment", "Clear Diagnosis", "Friendly Reception", "Well Organized", "Reasonable Fees", "Professional Care", "Clean Clinic", "Helpful Staff"],
  Salon: ["Relaxing Wash", "Good Products", "Perfect Style", "Friendly Team", "Easy Booking", "Style Advice", "Skilled Staff", "Hygienic", "Great Service"],
  Spa: ["Professional Therapists", "Clean Rooms", "Good Packages", "Friendly Staff", "Perfect Massage", "Peaceful Vibe", "Relaxing Experience", "Calm Ambiance"],
  Store: ["Quick Billing", "Good Variety", "Easy Exchange", "Nice Display", "Quality Products", "Well Stocked", "Comfortable Shopping", "Fair Pricing", "Helpful Staff"],
  Bar: ["Great Drinks", "Good Music", "Lively Vibe", "Quick Service", "Friendly Bartenders", "Good Seating", "Nice Crowd"],
  Other: ["Friendly Staff", "Excellent Service", "Clean & Tidy", "Great Value", "Professional", "Great Location", "Warm Welcome", "Well Managed", "Quick Service", "Great Quality", "Responsive Team"],
};

export function moreKeywords(category, exclude = [], count = 6) {
  const base = EXTRA_KEYWORDS[category] || EXTRA_KEYWORDS.Other;
  const excl = new Set(exclude.map((s) => s.toLowerCase()));
  return base.filter((k) => !excl.has(k.toLowerCase())).sort(() => Math.random() - 0.5).slice(0, count);
}


export const TONES = [
  { id: "friendly", label: "Friendly", icon: "sentiment_satisfied", desc: "Warm & casual" },
  { id: "professional", label: "Professional", icon: "business_center", desc: "Polished" },
  { id: "luxurious", label: "Elegant", icon: "diamond", desc: "Refined" },
];

export const CATEGORY_OPTIONS = [
  "Restaurant",
  "Hotel",
  "Cafe",
  "Bakery",
  "Gym",
  "Hospital",
  "Clinic",
  "Salon",
  "Spa",
  "Store",
  "Bar",
  "Other",
];
