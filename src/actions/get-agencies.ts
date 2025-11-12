"use server";

import db from "@/services/connect-db";

export async function getAgencies() {
  try {
    const agencies = await db.query(
      `
      SELECT * FROM agency
      `
    );

    return agencies.rows;
  } catch (error) {
    console.error("Error fetching route stops:", error);
    return [];
  }
}
