"use server";

import db from "@/services/connect-db";

export async function getDataToCreateSection() {
  try {
    const area = await db.query(
      `
    SELECT
      ST_X(geom) as lon,
      ST_Y(geom) as lat
    FROM (
      SELECT (ST_DumpPoints(ST_ConvexHull(ST_Collect(stop_loc::geometry)))).geom
      FROM stops
    ) as points;
      `
    );

    return area.rows;
  } catch (error) {
    console.error("Error fetching route stops:", error);
    return [];
  }
}
