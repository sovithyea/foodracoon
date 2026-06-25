const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");

  if (!ref || ref.length > 2000 || /[<>"{}|\\^`]/.test(ref)) {
    return new Response(null, { status: 400 });
  }
  if (!GOOGLE_API_KEY) {
    return new Response(null, { status: 503 });
  }

  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${encodeURIComponent(ref)}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url, { redirect: "follow" });

  if (!res.ok) {
    return new Response(null, { status: 502 });
  }

  const body = await res.arrayBuffer();
  return new Response(body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
