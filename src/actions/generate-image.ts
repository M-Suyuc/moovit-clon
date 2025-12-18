"use server";

import { generateRouteImageUrl } from "@/lib/generate_sector_image";

export async function generateStaticMap({
  markers,
  encodedPath,
}: {
  markers: string;
  encodedPath?: string;
}) {
  const tileServerUrl = generateRouteImageUrl({
    markes: markers,
    encodedPath,
  });

  if (!tileServerUrl) {
    return { success: false, error: "Could not generate the map URL." };
  }

  try {
    const imageResponse = await fetch(tileServerUrl, {
      cache: "no-store", // Important: Server Actions do not cache fetch by default[citation:7]
      headers: { "Cache-Control": "no-cache" },
    });

    if (!imageResponse.ok) {
      throw new Error(
        `TileServer GL responded with status: ${imageResponse.status}`
      );
    }

    //  Get the image as a Buffer (binary data)
    const imageBuffer = await imageResponse.arrayBuffer();

    //  Convert to a Base64 string so it can be serialized and returned
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    // console.log("🚀 ~ generateStaticMap ~ base64Image:", base64Image);

    // revalidateTag(`/line/${routeId}`);

    return { success: true, image: `data:image/png;base64,${base64Image}` };
    // return { success: true, image: imageResponse.url };
  } catch (error) {
    console.error("Failed to generate map:", error);
    return { success: false, error: "Could not generate the map image." };
  }
}
