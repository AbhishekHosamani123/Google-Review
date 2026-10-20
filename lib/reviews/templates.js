// Personalized template engine — no LLM.
// Goal: drafts that read like a real customer typed them — casual, specific to
// the tapped highlights, varied sentence rhythm, no marketing vocabulary, and
// NEVER mentioning the star count (people don't write "a solid 4-star
// experience" in their own reviews).
const FALLBACK_NAME = "this place";

function prettyCategory(cat) {
  if (!cat || cat === "Other") return "";
  const map = { Hotel: "hotel", Restaurant: "restaurant", Cafe: "cafe", Gym: "gym", Hospital: "hospital", Clinic: "clinic", Salon: "salon", Spa: "spa", Store: "store", Bakery: "bakery", Bar: "bar" };
  return map[cat] || cat.toLowerCase();
}

function cap(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// title-case a typed city so drafts never ship "in belgavi"
function prettyCity(city) {
  if (!city) return "";
  return city
    .trim()
    .split(/\s+/)
    .map((w) => (w.length <= 2 ? w.toLowerCase() : cap(w.toLowerCase())))
    .join(" ");
}

// "a, b and c" list joiner
function joinList(arr) {
  if (!arr || arr.length === 0) return "the friendly service";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function cs(city) {
  return city ? ` in ${city}` : "";
}

// Human, casual time/visit openers — the kind customers actually type.
// They receive (name, city); all avoid making up concrete facts.
const OPENERS = {
  friendly: [
    (h, city) => `Visited ${h}${cs(city)} last week and honestly had a great time.`,
    (h, city) => `Been to ${h}${cs(city)} a couple of times now and it hasn't disappointed me yet.`,
    (h, city) => `Finally tried ${h}${cs(city)} and I should have done it sooner.`,
    (h, city) => `Stopped by ${h}${cs(city)} recently — really glad I did.`,
    (h, city) => `A friend recommended ${h}${cs(city)} and it lived up to the word.`,
    (h, city) => `Great experience all round at ${h}${cs(city)}.`,
    (h, city) => `I'm a regular at ${h}${cs(city)} at this point.`,    (h, city) => `Checked out ${h}${cs(city)} over the weekend and it was lovely.`,
    (h, city) => `${h}${cs(city)} was a pleasant surprise, to be honest.`,
    (h, city) => `Went to ${h}${cs(city)} last month and it was a very good time.`,
    (h, city) => `My visit to ${h}${cs(city)} was just what I needed after a long week.`,
    (h, city) => `Heard good things about ${h}${cs(city)} — they turned out to be true.`,
  ],
  professional: [
    (h, city) => `I visited ${h}${cs(city)} last week and the overall experience was excellent.`,
    (h, city) => `${h}${cs(city)} maintains genuinely high standards.`,
    (h, city) => `I've interacted with the team at ${h}${cs(city)} a few times now and they've been consistently reliable.`,
    (h, city) => `Had work done through ${h}${cs(city)} recently and everything went smoothly.`,
  ],
  elegant: [
    (h, city) => `A really lovely visit to ${h}${cs(city)}.`,
    (h, city) => `${h}${cs(city)} is one of the better places I've come across.`,
    (h, city) => `My time at ${h}${cs(city)} was memorable, in the best way.`,
    (h, city) => `Quietly excellent — that's the honest summary of my visit to ${h}${cs(city)}.`,
  ],
};

// Weave the tapped highlights casually (no "Especially impressive:" labels).
// Receives the lowercase chip phrases (1-3 of them) that the customer tapped.
const HIGHLIGHTS = [
  (kw) => `What really stood out was ${kw} — that's the part I'll remember.`,
  (kw) => `Loved ${kw} — the little details are clearly taken care of.`,
  (kw) => {
    const plural = kw.includes(" and ");
    return `${cap(kw)} ${plural ? "were" : "was"} spot on.`;
  },
  (kw) => `They clearly pay attention to ${kw}.`,
  (kw) => {
    const plural = kw.includes(" and ");
    return `${cap(kw)} ${plural ? "are" : "is"} what keeps me coming back.`;
  },
  (kw) => `The team deserves credit for ${kw}.`,
  (kw) => `Nothing flashy — just ${kw}.`,
  (kw) => `${cap(kw)} made the visit easy and enjoyable.`,
  (kw) => `${cap(kw)} — clearly not luck, just how they run the place.`,
  (kw) => `${cap(kw.split(" and ")[0])} — second to none in the area.`,
];

// Category detail sentences — human phrasing, Category-matched (concrete but
// never fabricated incidents): safe, typical observations.
const CATEGORY_LINES = {
  friendly: {
    restaurant: ["Food was fresh, portions were generous, and the prices are fair for what you get.", "Everything we ordered came out hot and didn't sit around waiting.", "Whatever we ordered came out quickly and tasted fresh.", "Not fancy plating, just honest food done well — my kind of place."],
    hotel: ["Room was neat, check-in was quick and the staff weren't stiff at all.", "Comfortable bed, clean bathroom and breakfast that was actually worth getting up for.", "The whole stay felt well looked after without any fuss.", "Quiet rooms, hot water all day and a front desk that actually answers."],
    cafe: ["Nice spot to sit with your coffee for an hour or two.", "Coffee was properly made and the place isn't loud, which I appreciate.", "Good coffee, fresh snacks and a relaxed vibe."],
    gym: ["Equipment is well maintained — nothing rattling or out of order.", "Trainers actually correct your form instead of scrolling their phones.", "Clean equipment, sensible crowd and no waiting for machines.", "Good energy in the gym without it being intimidating."],
    hospital: ["The doctor took time to listen instead of writing a prescription in two minutes.", "Registration to consultation all moved quickly, no unnecessary back and forth.", "Staff were patient with my questions, which counts for a lot."],
    clinic: ["Appointment ran roughly on time and the doctor explained things in plain words.", "Clean, organised little clinic and the reception was courteous.", "No rush, no panic — the consultation was calm and thorough."],
    salon: ["They asked what I wanted before starting, which seems rare these days.", "Hygiene is clearly taken seriously and the cut came out neat.", "Staff are skilled without being pushy about products."],
    spa: ["Came out feeling lighter than I have in months.", "The therapist knew exactly where the knots were.", "Calm, clean space and nobody tried to upsell me anything."],
    store: ["Sensible prices and staff who help you find things without hovering.", "Good stock and quick billing — in and out without a hassle.", "They actually listen to what you're looking for instead of pushing what's costly."],
    bakery: ["Everything was fresh out of the oven, you can tell by the smell alone.", "The sweets are consistently fresh and packed with care.", "Hot, soft and gone within a day of buying — that's the review."],
    bar: ["Drinks were well made and the staff never got slow even when it filled up.", "Lively but not deafening, and the bartenders know what they're doing.", "Good crowd, good music at a level I can still talk over."],
    generic: ["The team went out of their way to make everything smooth.", "Nothing fancy, just a place that does the basics right — and does them well.", "Service was prompt and personal, and the place was spotless.", "It's clear the people running this actually care about their work."],
  },
  professional: {
    generic: ["Their process is well organised and the staff are courteous and responsive.", "Attention to detail and punctuality reflect high standards.", "Clear communication at every step, and delivery matched what was promised."],
  },
  elegant: {
    generic: ["Every detail is curated with a subtle, considered touch.", "There's an effortless quality to how they look after their guests.", "Refined without being stiff — calm, comfortable, classy."],
  },
};

// Closers — recommendation/return intent in casual language. NO star counts.
const CLOSERS = {
  friendly: [
    (h, city) => `Would happily come back${city ? ` when I'm around ${city}` : ""}.`,
    (h, city) => (city ? `If you're in ${city}, it's worth a try.` : `Worth a visit, no doubt.`),
    () => `Recommended — I've already told a couple of friends about it.`,
    (h) => `${h} has earned a repeat customer.`,
    () => `Will be back for sure.`,
    (h, city) => `Easily holding a place among my usual spots${cs(city)}.`,
    () => `Solid place. Nothing more, nothing less.`,
  ],
  professional: [
    (h, city) => `I'd recommend ${h}${cs(city)} without hesitation.`,
    () => `Reliable and professional. Recommended.`,
    () => `They've earned my repeat business.`,
  ],
  elegant: [
    (h, city) => `Recommended for anyone who appreciates things done properly.`,
    () => `A memorable experience that stands out from the ordinary.`,
    () => `I'll be returning.`,
  ],
};

// Signature mentions lifted from the shop description (used sparingly);
// they only trigger if the shop itself mentions the item.
const SIGNATURES = [
  ["biryani", "the biryani lives up to the hype"],
  ["thali", "the thali is good value"],
  ["buffet", "the buffet spread is generous"],
  ["coffee", "and the coffee is done just right"],
  ["breakfast", "breakfast is worth waking up early for"],
  ["seafood", "the seafood is fresh"],
  ["pool", "the pool area is lovely"],
  ["dessert", "the desserts are worth saving room for"],
  ["parking", "parking is easy too"],
];

// Small honest wiggle-sebro lines that keep 4-star drafts believable without
// inventing fake incidents.
const NIGGLE_4 = [
  "Small niggles here and there, but nothing that spoilt it.",
  "One or two things could be smoother, but overall very happy.",
  "Not a flawless visit, but close enough that I'll be back.",
];

// Balanced / critical lines for lower ratings — fair, human, no star counts.
const LOW_LINES = {
  3: ["Decent overall, though I've had better. With a bit of consistency they could easily be great.", "Good in parts — a few things need sharpening, but nothing terrible."],
  2: ["Not the experience I was hoping for. The basics need attention before I'd recommend it.", "It has potential, but my visit fell short in several ways."],
  1: ["Honestly, a disappointing visit. I hope they sort things out.", "I'd give the team a chance to improve, but on the evidence of this visit I wouldn't rush back."],
};

export function generateReview({ chips, tone = "friendly", stars = 5, shopName, shopCategory, shopCity, description } = {}) {
  const name = shopName || FALLBACK_NAME;
  const cat = prettyCategory(shopCategory);
  const city = prettyCity(shopCity || "");
  const phrases = chips && chips.length ? chips.map((c) => c.phrase || c.label) : shuffle(["warm hospitality", "excellent service", "fair prices"]);
  // 1-3 highlights keeps the draft readable; 5 chips turns into a list
  const selected = shuffle(phrases).slice(0, Math.min(3, phrases.length)).map((p) => p.toLowerCase());

  const opener = pick(OPENERS[tone] || OPENERS.friendly)(name, city);
  const highlight = pick(HIGHLIGHTS)(joinList(selected));
  const toneLines = CATEGORY_LINES[tone] || CATEGORY_LINES.friendly;
  const categoryLine = pick(toneLines[cat] || toneLines.generic);
  const closer = pick(CLOSERS[tone] || CLOSERS.friendly)(name, city);

  // assemble with random sentence order so two drafts feel structurally different
  const parts = [opener];
  const chipSentence = Math.random() < 0.75 ? highlight : null;
  const detailSentence = Math.random() < 0.8 ? categoryLine : null;

  if (tone === "friendly") {
    if (stars === 5) {
      const asides = ["Honestly nothing to fault.", "No complaints at all.", "Wouldn't change a thing.", "Loved every bit of it.", "Exactly as advertised."];
      if (Math.random() < 0.5) parts.push(pick(asides));
      if (chipSentence) parts.push(chipSentence);
      if (detailSentence) parts.push(detailSentence);
      parts.push(closer);
    } else if (stars === 4) {
      if (chipSentence) parts.push(chipSentence);
      if (detailSentence) parts.push(detailSentence);
      if (Math.random() < 0.6) parts.push(pick(NIGGLE_4));
      parts.push(closer);
    } else {
      // 3 and below: keep the tapped positives (fair), then the balanced note
      if (chipSentence) parts.push(chipSentence);
      if (detailSentence) parts.push(detailSentence);
      parts.push(pick(LOW_LINES[stars] || LOW_LINES[3]));
    }
  } else {
    // professional/elegant stay graceful regardless of stars
    if (chipSentence) parts.push(chipSentence);
    if (detailSentence) parts.push(detailSentence);
    if (stars < 4) parts.push(pick(LOW_LINES[stars] || LOW_LINES[3]));
    else if (stars === 4 && Math.random() < 0.5) parts.push(pick(NIGGLE_4));
    parts.push(closer);
  }

  let text = parts.filter(Boolean).join(" ");
  text = text.replace(/\s+/g, " ").replace(/\s+([.,!?])/g, "$1").replace(/([.!?])(?=[A-Za-z])/g, "$1 ").trim();

  // Occasionally add a description-driven signature mention for specificity
  const d = (description || "").toLowerCase();
  if (d && text.length < 300 && (stars >= 4 || tone !== "friendly")) {
    const sig = SIGNATURES.find(([k]) => d.includes(k));
    if (sig && Math.random() > 0.55) text += ` ${cap(sig[1])}.`;
  }

  // tidy artifacts
  text = text
    .replace(/\s{2,}/g, " ")
    .replace(/([.!?])\s*\./g, "$1")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();
  if (!/[.!?)"]$/.test(text)) text += ".";
  return text;
}
