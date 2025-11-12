"use server";

import db from "@/services/connect-db";

export async function getRoutes({ agencyId }: { agencyId: string }) {
  try {
    const routes = await db.query(
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

    return routes.rows;
  } catch (error) {
    console.error("Error fetching routes:", error);
    return [];
  }
}
