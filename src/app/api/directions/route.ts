const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const profile = searchParams.get("profile") ?? "walking";

  if (!from || !to) {
    return Response.json({ error: "Missing from or to" }, { status: 400 });
  }
  if (!TOKEN) {
    return Response.json({ error: "Mapbox token not configured" }, { status: 500 });
  }

  const validProfile = profile === "driving" ? "driving" : "walking";
  const coords = `${from};${to}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/${validProfile}/${coords}?geometries=geojson&steps=true&overview=full&access_token=${TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error("Mapbox Directions error:", res.status, text);
    return Response.json({ error: "Directions API failed" }, { status: 502 });
  }

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) {
    return Response.json({ error: "No route found" }, { status: 404 });
  }

  return Response.json({
    geometry: route.geometry,
    distance: route.distance,
    duration: route.duration,
    steps: route.legs[0].steps.map((s: {
      maneuver: { instruction: string; type: string; modifier?: string };
      distance: number;
      duration: number;
    }) => ({
      instruction: s.maneuver.instruction,
      distance: s.distance,
      duration: s.duration,
      type: s.maneuver.type,
      modifier: s.maneuver.modifier,
    })),
  });
}
