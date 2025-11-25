"use server";

import db from "@/services/connect-db";

export async function getStopsById({ agencyId }: { agencyId: string }) {
  try {
    const stops = await db.query(
      `
      SELECT 
        route_id,
        route_short_name,
        route_long_name,
        route_type
      FROM routes
      where agency_id = $1
      ORDER BY route_short_name
    `,
      [`${agencyId}`]
    );

    return stops.rows;
  } catch (error) {
    console.error("Error fetching routes:", error);
    return [];
  }
}
