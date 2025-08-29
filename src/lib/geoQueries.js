// import { PrismaClient } from "../generated/prisma/index.js";

// const prisma = new PrismaClient();

export class GeoQueries {
  // Obtener stops con coordenadas
  static async getStopsWithCoordinates() {
    return `
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
        platform_code
      FROM stops
      WHERE stop_loc IS NOT NULL
    `;
  }

  // Obtener stops cerca de una ubicación
  static async getStopsNearLocation(lat, lng, radiusMeters = 1000) {
    return await prisma.$queryRaw`
      SELECT 
        stop_id,
        stop_name,
        stop_code,
        ST_X(stop_loc::geometry) as longitude,
        ST_Y(stop_loc::geometry) as latitude,
        ST_Distance(stop_loc, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)) as distance_meters
      FROM stops
      WHERE stop_loc IS NOT NULL
        AND ST_DWithin(stop_loc, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), ${radiusMeters})
      ORDER BY distance_meters
    `;
  }

  // Obtener shapes con coordenadas
  static async getShapeCoordinates(shapeId) {
    return await prisma.$queryRaw`
      SELECT 
        shape_id,
        shape_pt_sequence,
        ST_X(shape_pt_loc::geometry) as longitude,
        ST_Y(shape_pt_loc::geometry) as latitude,
        shape_dist_traveled
      FROM shapes
      WHERE shape_id = ${shapeId}
        AND shape_pt_loc IS NOT NULL
      ORDER BY shape_pt_sequence
    `;
  }

  // Obtener todas las shapes como GeoJSON
  static async getShapesAsGeoJSON() {
    return await prisma.$queryRaw`
      SELECT 
        shape_id,
        ST_AsGeoJSON(ST_MakeLine(shape_pt_loc::geometry ORDER BY shape_pt_sequence)) as geojson
      FROM shapes
      WHERE shape_pt_loc IS NOT NULL
      GROUP BY shape_id
    `;
  }

  // Crear un nuevo stop con coordenadas
  static async createStopWithLocation(stopData, lat, lng) {
    return await prisma.$queryRaw`
      INSERT INTO stops (
        stop_id, stop_name, stop_code, stop_desc, stop_loc,
        zone_id, stop_url, location_type, parent_station,
        stop_timezone, wheelchair_boarding, level_id, platform_code
      ) VALUES (
        ${stopData.stop_id},
        ${stopData.stop_name},
        ${stopData.stop_code || null},
        ${stopData.stop_desc || null},
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ${stopData.zone_id || null},
        ${stopData.stop_url || null},
        ${stopData.location_type || null},
        ${stopData.parent_station || null},
        ${stopData.stop_timezone || null},
        ${stopData.wheelchair_boarding || null},
        ${stopData.level_id || null},
        ${stopData.platform_code || null}
      )
      RETURNING stop_id, stop_name, 
                ST_X(stop_loc::geometry) as longitude,
                ST_Y(stop_loc::geometry) as latitude
    `;
  }
}

export default GeoQueries;
