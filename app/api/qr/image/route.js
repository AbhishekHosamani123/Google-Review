import QRCode from "qrcode";
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const size = Math.min(4096, Math.max(256, parseInt(searchParams.get("size") || "1024", 10) || 1024));
  if (!url) return new Response("Missing url", { status: 400 });
  try {
    // minimal visual noise: the library picks the smallest valid version for
    // the payload, ECC level L (no centre logo, nothing obstructing), exact
    // integer pixel-per-module scaling for sharp, uniform modules, a full
    // 4-module quiet zone and pure white background / solid black modules.
    const modulesCount = QRCode.create(url, { errorCorrectionLevel: "L" }).modules.size;
    const scale = Math.max(4, Math.floor(size / modulesCount)); // integer px per module
    const buf = await QRCode.toBuffer(url, { errorCorrectionLevel: "L", scale, margin: 4 });
    return new Response(buf, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
}
