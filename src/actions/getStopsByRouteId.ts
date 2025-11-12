"use server";

import db from "@/services/connect-db";

export async function getStopsByRouteId(routeId: string) {
  try {
    const stops = await db.query(
      `
     SELECT 
      r.route_short_name,
      s.stop_id,
      s.stop_name
    FROM routes r
    JOIN trips t ON r.route_id = t.route_id
    JOIN stop_times st ON t.trip_id = st.trip_id
    JOIN stops s ON st.stop_id = s.stop_id
    WHERE r.route_id = $1
    GROUP BY r.route_short_name, s.stop_id, s.stop_name;
    `,
      [routeId]
    );

    return stops.rows;
  } catch (error) {
    console.error("Error fetching route stops:", error);
    return [];
  }
}
