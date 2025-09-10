"use server";

export async function getStyle() {
  const res = await fetch("http://localhost:8080/styles/osm-bright/style.json");
  if (!res.ok) throw new Error("Failed to fetch style.json");
  return res.json();
}
