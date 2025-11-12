"use server";

import db from "@/services/connect-db";

export async function getCenterPosition() {
  try {
    const area = await db.query(
      `
    SELECT 
      AVG(ST_X(stop_loc::geometry)) as center_lon,
      AVG(ST_Y(stop_loc::geometry)) as center_lat
    FROM stops;
      `
    );

    return area.rows;
  } catch (error) {
    console.error("Error fetching route stops:", error);
    return [];
  }
}
