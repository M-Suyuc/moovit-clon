"use server";

import db from "@/services/connect-db";

export async function getAgencieById(id: string) {
  try {
    const agencies = await db.query(
      `
      SELECT agency_name FROM agency
      WHERE agency_id = $1
      `,
      [id]
    );

    return agencies.rows;
  } catch (error) {
    console.error("Error fetching route stops:", error);
    return [];
  }
}
