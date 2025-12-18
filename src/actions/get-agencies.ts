"use server";

import db from "@/services/connect-db";

type CustomError = Error & { code: string };

export async function getAgencies() {
  try {
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'agency'
      );
    `);

    if (!tableExists.rows[0].exists) {
      return { error: "GTFS_NOT_IMPORTED" };
    }

    const agencies = await db.query(`SELECT * FROM agency`);
    return agencies.rows;
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      console.error("Error fetching agencies:", error.message);
      if ((error as CustomError).code === "42P01") {
        return { error: "GTFS_NOT_IMPORTED" };
      }
    }
    return { error: "DATABASE_ERROR" };
  }
}
