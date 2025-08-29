import { PrismaClient } from "../generated/prisma/index.js";
import GeoQueries from "../lib/geoQueries.js";

const prisma = new PrismaClient();

export class GTFSService {
  // Obtener todas las rutas con información básica
  static async getRoutes() {
    try {
      return await prisma.routes.findMany({
        include: {
          agency: true,
          trips: {
            take: 1, // Solo un trip para obtener info básica
            include: {
              stop_times: {
                take: 1,
                include: {
                  stops: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching routes:", error);
      throw error;
    }
  }

  // Obtener stops con coordenadas usando raw query
  static async getStops() {
    try {
      return await GeoQueries.getStopsWithCoordinates();
    } catch (error) {
      console.error("Error fetching stops:", error);
      throw error;
    }
  }

  // Obtener stops cerca de una ubicación
  static async getStopsNear(lat, lng, radius = 1000) {
    try {
      return await GeoQueries.getStopsNearLocation(lat, lng, radius);
    } catch (error) {
      console.error("Error fetching nearby stops:", error);
      throw error;
    }
  }

  // Obtener información de una ruta específica con shapes
  static async getRouteWithShapes(routeId) {
    try {
      // Obtener información básica de la ruta
      const route = await prisma.routes.findUnique({
        where: { route_id: routeId },
        include: {
          agency: true,
          trips: {
            include: {
              stop_times: {
                include: {
                  stops: true,
                },
                orderBy: {
                  stop_sequence: "asc",
                },
              },
            },
          },
        },
      });

      if (!route) return null;

      // Obtener shapes para todos los trips de la ruta
      const shapeIds = [
        ...new Set(route.trips.map((trip) => trip.shape_id).filter(Boolean)),
      ];
      const shapes = {};

      for (const shapeId of shapeIds) {
        shapes[shapeId] = await GeoQueries.getShapeCoordinates(shapeId);
      }

      return {
        ...route,
        shapes,
      };
    } catch (error) {
      console.error("Error fetching route with shapes:", error);
      throw error;
    }
  }

  // Obtener datos para mapa (stops y shapes como GeoJSON)
  static async getMapData() {
    try {
      const [stops, shapes] = await Promise.all([
        GeoQueries.getStopsWithCoordinates(),
        GeoQueries.getShapesAsGeoJSON(),
      ]);

      return {
        stops: stops.map((stop) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [
              parseFloat(stop.longitude),
              parseFloat(stop.latitude),
            ],
          },
          properties: {
            stop_id: stop.stop_id,
            stop_name: stop.stop_name,
            stop_code: stop.stop_code,
          },
        })),
        shapes: shapes.map((shape) => ({
          type: "Feature",
          geometry: JSON.parse(shape.geojson),
          properties: {
            shape_id: shape.shape_id,
          },
        })),
      };
    } catch (error) {
      console.error("Error fetching map data:", error);
      throw error;
    }
  }

  // Obtener estadísticas básicas
  static async getStats() {
    try {
      const [routesCount, stopsCount, tripsCount, agenciesCount] =
        await Promise.all([
          prisma.routes.count(),
          prisma.stops.count(),
          prisma.trips.count(),
          prisma.agency.count(),
        ]);

      return {
        routes: routesCount,
        stops: stopsCount,
        trips: tripsCount,
        agencies: agenciesCount,
      };
    } catch (error) {
      console.error("Error fetching stats:", error);
      throw error;
    }
  }
}

export default GTFSService;
