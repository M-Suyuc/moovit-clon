"use server";

import db from "@/services/connect-db";
// import GTFSService from "../services/gtfsService";

export async function getStopInfo() {
  const lat = "40.712776";
  const lng = "-74.005974";
  try {
    // const stops = await GTFSService.getStops();
    const stops = await db.query(`
        SELECT 
        stop_id,
        stop_name,
        stop_code,
        stop_desc,
        ST_X(stop_loc::geometry) as longitude,
        ST_Y(stop_loc::geometry) as latitude,
        zone_id,
        stop_url,
        location_type,
        parent_station,
        stop_timezone,
        wheelchair_boarding,
        level_id,
        platform_code,
        ST_Distance(
        ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(
      lat
    )}), 4326)::geography,
        stop_loc::geography
      ) AS distance
      FROM stops
      WHERE stop_loc IS NOT NULL`);

    //  Obtener paradas dentro de 1km de un punto
    //   ST_DWithin(
    //   stop_loc::geography,
    //   ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography,
    //   1000   == radius en metros
    // )

    //------------------------------
    //     SELECT
    //   r.route_name,
    //   ST_AsGeoJSON(ST_MakeLine(s.location::geometry)) AS route_geometry
    // FROM trips t
    // JOIN stop_times st ON t.trip_id = st.trip_id
    // JOIN stops s ON st.stop_id = s.stop_id
    // JOIN routes r ON t.route_id = r.route_id
    // WHERE r.route_id = 'R1'
    // GROUP BY r.route_id;

    // console.log("🚀 stops:", stops.command); // SELECT - Tipo de comando ejecutado
    // console.log("🚀 stops:", stops.fields); // Metadatos sobre las columnas
    // console.log("🚀 stops:", stops.oid); // OID para operaciones INSERT (no aplica en SELECT)
    // console.log("🚀 stops:", stops.rowCount); // Número de filas devueltas
    // console.log("🚀 stops:", stops.rows); // Array con los resultados de las filas
    return stops.rows;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
    return [];
  }
}
