// Resolves whatever Google link the admin pastes into the shop editor to the
// concrete target a customer will land on, so ShopForm can store a clean,
// stable URL instead of a shortener hop.
//
// Accepted inputs (all https Google hosts):
//   search.google.com/local/writereview?placeid=ChIJ...   -> "writereview" (1-tap dialog)
//   g.page/r/<id>/review                                  -> "direct-review" (1-tap dialog, GBP "Ask for reviews" link)
//   share.google/<code>                                   -> follows Google's redirect chain server-side
//   www.goo.gl / maps.app.goo.gl                          -> " (same)
//   google.com/maps/place/...                             -> "listing" (place page: Review button is on it)
//   google.com/search?...kgmid=/g/...                     -> "listing" (Knowledge panel: Review button is on it)
export async function POST(req) {
  // same-origin guard: only our own dashboard should call this
  const origin = req.headers.get("origin");
  const host = req.headers.get("host") || "";
  if (origin) {
    try {
      if (new URL(origin).host !== host.split("/")[0]) {
        return Response.json({ error: "cross-origin" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "bad origin" }, { status: 403 });
    }
  }

  let url = "";
  try {
    const body = await req.json();
    url = String(body?.url || "").trim();
  } catch {
    return Response.json({ error: "bad body" }, { status: 400 });
  }
  if (!/^https:\/\//i.test(url)) return Response.json({ error: "https only" }, { status: 400 });

  let inputHost = "";
  try {
    inputHost = new URL(url).hostname.toLowerCase();
  } catch {
    return Response.json({ error: "bad url" }, { status: 400 });
  }
  const okHosts = [
    "share.google", "g.page", "goo.gl", "google.com", "search.google.com", "maps.google.com",
  ];
  if (!okHosts.some((h) => inputHost === h || inputHost.endsWith("." + h))) {
    return Response.json({ error: "not a Google link" }, { status: 400 });
  }

  const PLACEID = /placeid=(ChIJ[A-Za-z0-9_\-]+)/;

  // A Google place ID (ChIJ...) is a base64url protobuf of the two hexes that
  // Maps URLs carry as data=!1s0x<hex1>:0x<hex2>:
  //   0a 12 09 <hex1 little-endian> 11 <hex2 little-endian>
  // So we can synthesize the 1-tap writereview link from any Maps URL that has
  // the pair — no scraping of Google's bot-walled pages needed.
  const FTPAIR = /!1s0x([0-9a-fA-F]{8,16}):0x([0-9a-fA-F]{8,16})/;
  const placeIdFromPair = (f1, f2) => {
    const le = (hex) => {
      const pad = hex.length % 2 ? "0" + hex : hex;
      const arr = [];
      for (let i = 0; i < pad.length; i += 2) arr.push(parseInt(pad.slice(i, i + 2), 16));
      arr.reverse();
      return arr;
    };
    const bytes = [0x0a, 0x12, 0x09, ...le(f1), 0x11, ...le(f2)];
    return Buffer.from(bytes)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };
  // pull a usable place id out of any URL text: explicit ?placeid=, the
  // !19sChIJ slot, or the 0x hex pair
  const placeIdIn = (text) => {
    const p = String(text).match(PLACEID);
    if (p) return { id: p[1], source: "placeid" };
    const slot = String(text).match(/!19s(ChIJ[A-Za-z0-9_\-]+)/);
    if (slot) return { id: slot[1], source: "19s" };
    const pair = String(text).match(FTPAIR);
    if (pair) return { id: placeIdFromPair(pair[1], pair[2]), source: "pair" };
    return null;
  };
  const writereviewFor = (placeId) =>
    `https://search.google.com/local/writereview?placeid=${placeId}`;
  const placeNameIn = (text) => {
    try {
      const seg = new URL(String(text)).pathname.split("/place/")[1];
      return seg ? decodeURIComponent(seg.split("/")[0]).replace(/\+/g, " ") : "";
    } catch {
      return "";
    }
  };

  // already a 1-tap review link? no network needed

  // "Review dialog" URLs — the exact format Google emits when someone clicks
  // *Review* on a Knowledge-Panel listing and copies the address bar:
  //   https://www.google.com/search?...&q=<name>&ludocid=<dec>&lsig=<tok>#lrd=0x<hex>:0x<hex>,3
  // The #lrd fragment is what makes the dialog open on load, and Google
  // computes those hex pairs itself — they cannot be synthesized, only
  // copied. So any URL carrying them is already perfect and must be stored
  // VERBATIM (rebuilding it would break the dialog).
  if (/#lrd=0x[0-9a-fA-F]+:0x[0-9a-fA-F]+/.test(url)) {
    return Response.json({
      kind: "direct-review",
      url,
      name: (() => { try { return new URL(url).searchParams.get("q") || ""; } catch { return ""; } })(),
      title: "Opens the review dialog directly — best kind of link",
    });
  }
  if (/ludocid=\d+/.test(url)) {
    return Response.json({
      kind: "listing",
      url,
      name: (() => { try { return new URL(url).searchParams.get("q") || ""; } catch { return ""; } })(),
      title: "Customers land on this shop's Google profile — the Review button is right on it",
    });
  }

  // already a 1-tap review link? no network needed
  if (/\/r\/.+\/review/.test(url) && inputHost.endsWith("g.page")) {
    return Response.json({ kind: "direct-review", url, title: "Opens the review dialog directly — best kind of link" });
  }
  if (url.includes("writereview") && PLACEID.test(url)) {
    return Response.json({ kind: "writereview", url, placeId: url.match(PLACEID)[1], title: "Opens the review dialog directly — best kind of link" });
  }

  // Input already carries the 0x pair (a full Maps place URL pasted out of the
  // address bar): forge the place id from it — no network needed.
  const inline = url.match(FTPAIR);
  if (inline) {
    const placeId = placeIdFromPair(inline[1], inline[2]);
    return Response.json({
      kind: "writereview",
      url: writereviewFor(placeId),
      placeId,
      name: placeNameIn(url),
      title: "Opens the review dialog directly — best kind of link",
    });
  }

  // follow Google's redirect chain server-side (fetch follows by default; res.url is the final URL)
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
        "Accept-Language": "en",
      },
    });
    const finalUrl = res.url || url;
    let u;
    try { u = new URL(finalUrl); } catch { return Response.json({ kind: "fallback", url, title: "Saved as-is" }); }

    // a place id surfaced in the redirect chain (explicit placeid, the !19s
    // slot, or the 0x pair Maps embeds) -> upgrade to the 1-tap dialog link
    const found = placeIdIn(finalUrl);
    if (found) {
      return Response.json({
        kind: "writereview",
        url: writereviewFor(found.id),
        placeId: found.id,
        name: placeNameIn(finalUrl),
        title: "Opens the review dialog directly — best kind of link",
      });
    }

    // Google Knowledge-panel / place page: the customer gets the shop's Google
    // profile with the visible "Review" button (2 taps total from our page).
    const isGoogle = /(^|\.)google\.[a-z.]+$/.test(u.hostname);
    const kg = u.searchParams.get("kgmid") || "";
    const qName = u.searchParams.get("q") || placeNameIn(finalUrl) || u.pathname.split("/").slice(-2)[0].replace(/\+/g, " ");
    if (isGoogle && (kg || /maps\/place\//.test(u.pathname) || u.pathname.startsWith("/search"))) {
      // Shortener inputs (share.google, goo.gl, maps.app.goo.gl) are stored
      // VERBATIM — it's Google's canonical, app-aware link and redirects Google
      // may improve over time keep working. Directly-pasted search URLs are
      // stored as-is too. resolvedUrl = where the chain actually lands, shown
      // to the admin so they can verify which shop the link targets.
      let resolvedUrl = u.searchParams.get("kgmid") && qName
        ? `https://www.google.com/search?kgmid=${kg}&q=${encodeURIComponent(qName).replace(/%20/g, "+")}`
        : finalUrl;
      const shortenerInput = /(^|\.)share\.google$/.test(inputHost) || (inputHost === "goo.gl" || inputHost === "maps.app.goo.gl");
      return Response.json({
        kind: "listing",
        url: shortenerInput ? url : resolvedUrl,
        resolvedUrl,
        name: qName,
        kgmid: kg,
        title: "Customers land on this shop's Google profile — the Review button is right on it",
      });
    }
    if (isGoogle) {
      return Response.json({ kind: "listing", url: finalUrl, name: "", title: "Google link resolved" });
    }
    return Response.json({ kind: "unknown", url: finalUrl, title: "Redirected off Google — stored as-is" });
  } catch {
    // network hiccup / bot wall: still allow saving (the form's allowlist covers the input)
    return Response.json({ kind: "fallback", url, title: "Could not verify server-side — saved as-is" });
  }
}
