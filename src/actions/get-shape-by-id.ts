"use server";

import db from "@/services/connect-db";

export async function getShapeById({ routeId }: { routeId: string }) {
  try {
    const shapes = await db.query(
      `
      SELECT
        shape_id,
        ST_Y(shape_pt_loc::geometry) as latitude,
        ST_X(shape_pt_loc::geometry) as longitude,
        shape_pt_sequence
      FROM shapes 
      WHERE shape_id = $1
      ORDER BY shape_pt_sequence;
    `,
      [routeId]
    );

    return shapes.rows;
  } catch (error) {
    console.error("Error fetching route shapes:", error);
    return [];
  }
}
