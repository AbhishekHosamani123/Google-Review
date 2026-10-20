// Personalized template engine — no LLM.
// Every draft is composed from: opener (shop name + city) → keyword highlights →
// category-specific detail sentence → closer (recommendation + stars + occasionally a
// signature item pulled from the shop description).
// Different building blocks + name/city/category weaving = every review reads like it
// was written for THIS shop.
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

// "a, b and c" list joiner
function joinList(arr) {
  if (!arr || arr.length === 0) return "warm hospitality";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")} and ${arr[arr.length - 1]}`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// helpers receive (shopName, cityRaw); cityStr = " in <city>" | ""
function cs(city) {
  return city ? ` in ${city}` : "";
}

// ---------- Openers (always mention the shop; often the city too) ----------
const OPENERS = {
  friendly: [
    (h, city) => `Had a truly wonderful experience at ${h}${cs(city)}!`,
    (h, city) => `What a lovely time at ${h}${cs(city)} — it exceeded expectations in every way.`,
    (h, city) => `Visited ${h}${cs(city)} recently and it left a great impression.`,
    (h, city) => `${h}${cs(city)} is easily one of my favourite spots now.`,
    (h, city) => `Absolutely loved my visit to ${h}${cs(city)}.`,
    (h, city) => `Such a great find at ${h}${cs(city)}!`,
  ],
  professional: [
    (h, city) => `I had an excellent experience at ${h}${cs(city)}.`,
    (h, city) => `${h}${cs(city)} delivers consistent, high-quality service.`,
    (h, city) => `I was impressed by the standards maintained at ${h}${cs(city)}.`,
    (h) => `I would rate ${h} among the best-run establishments I have visited.`,
  ],
  elegant: [
    (h, city) => `An exquisite visit to ${h}${cs(city)}.`,
    (h, city) => `${h}${cs(city)} is a true gem.`,
    (h, city) => `My visit to ${h}${cs(city)} was nothing short of memorable.`,
    (h, city) => `A distinguished experience at ${h}${cs(city)} — quietly refined throughout.`,
  ],
};

// ---------- Keyword highlight frames (weave the tapped chips naturally) ----------
const HIGHLIGHT_FRAMES = [
  (kw) => `${cap(joinList(kw))} stood out the most.`,
  (kw) => `Loved ${joinList(kw)} — you can tell they pay attention to detail.`,
  (kw) => `Especially impressive: ${joinList(kw)}.`,
  (kw) => `${cap(joinList(kw))} made the whole visit special.`,
  (kw) => `They really get ${joinList(kw)} right.`,
  (kw) => `From start to finish, ${joinList(kw)} was spot on.`,
  (kw) => `${cap(joinList(kw))} — exactly what I had hoped for.`,
];

// ---------- Category detail sentences (tone-aware, concrete) ----------
const CATEGORY_LINES = {
  friendly: {
    restaurant: ["The food came out fresh and full of flavour, and the staff kept everything moving smoothly.", "Generous portions, tasty plates and a warm, easy-going atmosphere.", "I could taste the care that goes into the cooking — nothing rushed, nothing off.", "The team was attentive without hovering, and the vibe was relaxed and family-friendly."],
    hotel: ["Rooms were neat and inviting, check-in was effortless and the hospitality felt genuinely warm.", "Comfortable stay from start to finish — cosy rooms, prompt housekeeping and a friendly front desk.", "Everything about the stay felt well looked after, from the morning breakfast to the quiet, comfortable rooms."],
    cafe: ["Great coffee, fresh treats and a very easy place to spend an hour.", "The drinks were prepared with obvious care and the seating made it a perfect unwind spot."],
    gym: ["The trainers are motivating and the equipment is kept in top shape — workouts here never feel stale.", "The energy inside is positive and the trainers give you real, personal attention."],
    hospital: ["The doctors were thorough and genuinely caring, and the staff made a stressful visit feel handled.", "Everything moved quickly and calmly — registration, consultation and follow-up were all painless."],
    clinic: ["The consultation was unhurried and the doctor explained everything in plain language.", "Appointments run on time, the place is spotless and the reception is very courteous."],
    salon: ["They took time to understand what I wanted and the result was exactly right.", "Great attention to hygiene and the staff are as friendly as they are skilled."],
    spa: ["The session was deeply relaxing and the therapists clearly know their craft.", "Calming atmosphere from the moment you walk in — I left completely refreshed."],
    store: ["Good variety, sensible prices and staff who actually help you find what you need.", "Billing was quick and the whole shopping trip felt effortless."],
    bakery: ["Everything was fresh out of the oven and it shows — soft, tasty and just right.", "The sweets are consistently fresh and the staff pack everything with real care."],
    bar: ["Great drinks, a fun crowd and the service never slowed down even on a busy night.", "The vibe is lively but comfortable, and the bartenders really know their drinks."],
    generic: ["The team went out of their way to make the visit smooth and welcoming.", "Everything felt organised, clean and thoughtfully done — clearly a team that cares.", "Service was prompt and personal, and the place itself was kept spotless."],
  },
  professional: {
    generic: ["The process was well-managed end to end, with courteous and responsive staff throughout.", "Their attention to detail and punctuality reflect genuinely high standards.", "A polished, well-organised experience — everything ran exactly as promised."],
  },
  elegant: {
    generic: ["Every detail was curated with care — subtle touches that elevate the entire experience.", "There is a quiet, effortless quality to the way they attend to their guests.", "Refined without being stiff; the atmosphere carries a calm sense of comfort and class."],
  },
};

// ---------- Closers ----------
const CLOSERS = {
  friendly: [
    (h, city) => `Will definitely be back and I'd happily recommend ${h}${cs(city)} to friends and family!`,
    (h, city) => (city ? `Highly recommended — if you're in ${city}, this is the place to visit.` : `Highly recommended — visit once and you'll see why.`),
    () => `Looking forward to my next visit already!`,
    () => `Five stars well deserved — keep up the great work!`,
    (h, city) => `A visit to ${h}${cs(city)} never disappoints. Coming back for sure!`,
  ],
  professional: [
    (h, city) => `I would recommend ${h}${cs(city)} without hesitation.`,
    () => `A reliable, professional experience. Recommended.`,
    () => `Consistently good — they have earned my repeat business.`,
  ],
  elegant: [
    (h, city) => `I would recommend ${h}${cs(city)} to anyone who appreciates the finer things.`,
    () => `A memorable experience that stands out from the ordinary.`,
    () => `Highly recommended for those who value quality done right.`,
  ],
};

function starLine(stars) {
  if (stars === 5) return "A perfect 5-star experience.";
  if (stars === 4) return "A solid 4-star experience — I'll be returning.";
  if (stars === 3) return "Overall a good experience with room to grow.";
  if (stars === 2) return "Not my best visit, but the team has potential.";
  return "Sadly not a great experience this time — I hope they improve soon.";
}

// Signature mentions lifted from the shop description (used sparingly for extra specificity)
const SIGNATURES = [
  ["biryani", "the biryani lives up to the hype"],
  ["thali", "the thali is great value"],
  ["buffet", "the buffet spread is generous"],
  ["coffee", "the coffee is done just right"],
  ["breakfast", "breakfast is worth waking up early for"],
  ["seafood", "the seafood is fresh"],
  ["pool", "the pool area is lovely"],
  ["dessert", "the desserts are worth saving room for"],
  ["parking", "parking is easy too"],
];

export function generateReview({ chips, tone = "friendly", stars = 5, shopName, shopCategory, shopCity, description } = {}) {
  const name = shopName || FALLBACK_NAME;
  const cat = prettyCategory(shopCategory);
  const phrases = chips && chips.length ? chips.map((c) => c.phrase || c.label) : shuffle(["warm hospitality", "excellent service", "great value"]);
  const selected = shuffle(phrases).slice(0, Math.min(4, phrases.length));

  const opener = pick(OPENERS[tone] || OPENERS.friendly)(name, shopCity || "");
  const frame = pick(HIGHLIGHT_FRAMES);
  const highlight = frame(selected);

  // category detail line — always present; falls back to generic for the tone
  const toneLines = CATEGORY_LINES[tone] || CATEGORY_LINES.friendly;
  const categoryLine = pick(toneLines[cat] || toneLines.generic);

  const closer = pick(CLOSERS[tone] || CLOSERS.friendly)(name, shopCity || "");
  let star = starLine(stars);

  // Avoid saying the star count twice (e.g. closer already mentions "Five stars")
  if (stars >= 4 && /(five|\d)\s*stars?/i.test(closer)) star = "";

  // long chip lists flow better as their own sentence pair
  let body;
  if (selected.length >= 3 && Math.random() > 0.4) {
    const rest = selected[1] || selected[2] ? `, and also ${selected[1] || ""}${selected[2] ? `${selected[1] ? " and " : ""}${selected[2]}` : ""}` : "";
    body = `${cap(selected[0])} was the highlight${rest}. ${categoryLine}`;
  } else {
    body = `${highlight} ${categoryLine}`;
  }

  let text = `${opener} ${body} ${closer} ${star}`;
  text = text.replace(/\s+/g, " ").replace(/\s+([.!?])/g, "$1").trim();
  if (!/[.!?]$/.test(text)) text += ".";

  // Occasionally add a signature mention lifted from the shop description
  const d = (description || "").toLowerCase();
  if (d && text.length < 320) {
    const signature = SIGNATURES.find(([k]) => d.includes(k));
    if (signature && Math.random() > 0.5) text += ` ${cap(signature[1])}.`;
  }
  return text;
}
