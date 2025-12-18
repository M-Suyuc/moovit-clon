"use server";

import db from "@/services/connect-db";

export async function getRoutesByAgencyId({ agencyId }: { agencyId: string }) {
  try {
    const routes = await db.query(
      `
      SELECT 
        route_id,
        route_short_name,
        route_type
      FROM routes
      where agency_id = $1
      `,
      [`${agencyId}`]
    );

    return routes.rows;
  } catch (error) {
    console.error("Error fetching routes:", error);
    return [];
  }
}
