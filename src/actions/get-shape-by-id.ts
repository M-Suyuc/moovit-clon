"use server";

import db from "@/services/connect-db";

export async function getShapeById({ routeId }: { routeId: string }) {
  try {
    // Primero buscar por shape_id directo
    let shapes = await db.query(
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

    // Si no encuentra, buscar por route_id en trips
    if (shapes.rows.length === 0) {
      shapes = await db.query(
        `
        SELECT DISTINCT
          s.shape_id,
          ST_Y(s.shape_pt_loc::geometry) as latitude,
          ST_X(s.shape_pt_loc::geometry) as longitude,
          s.shape_pt_sequence
        FROM shapes s
        JOIN trips t ON s.shape_id = t.shape_id
        WHERE t.route_id = $1
        ORDER BY s.shape_pt_sequence;
      `,
        [routeId]
      );
    }

    return shapes.rows;
  } catch (error) {
    console.error("Error fetching route shapes:", error);
    return [];
  }
}
