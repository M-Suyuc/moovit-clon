"use server";

import db from "@/services/connect-db";

export async function getRoutes() {
  try {
    const routes = await db.query(`
      SELECT 
        route_id,
        route_short_name,
        route_long_name,
        route_type
      FROM routes
      ORDER BY route_short_name
    `);

    return routes.rows;
  } catch (error) {
    console.error("Error fetching routes:", error);
    return [];
  }
}
