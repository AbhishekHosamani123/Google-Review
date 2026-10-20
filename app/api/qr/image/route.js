import QRCode from "qrcode";
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const size = Math.min(1024, Math.max(128, parseInt(searchParams.get("size") || "512", 10) || 512));
  if (!url) return new Response("Missing url", { status: 400 });
  try {
    const buf = await QRCode.toBuffer(url, { width: size, errorCorrectionLevel: "H", margin: 2 });
    return new Response(buf, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
}
