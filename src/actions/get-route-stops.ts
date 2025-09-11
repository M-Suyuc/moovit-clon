"use server";

import db from "@/services/connect-db";

export async function getRouteStops(routeId: string = "1") {
  try {
    const stops = await db.query(
      `
      SELECT DISTINCT
        s.stop_id, 
        s.stop_name, 
        ST_Y(s.stop_loc::geometry) as lat, 
        ST_X(s.stop_loc::geometry) as lng
      FROM stops s
      JOIN stop_times st ON s.stop_id = st.stop_id
      JOIN trips t ON st.trip_id = t.trip_id
      WHERE t.route_id = $1
      ORDER BY s.stop_name
    `,
      [routeId]
    );

    return stops.rows;
  } catch (error) {
    console.error("Error fetching route stops:", error);
    return [];
  }
}
