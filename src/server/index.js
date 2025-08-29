import express from "express";
import { parseString } from "xml2js";
import cors from "cors";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import GTFSService from "../services/gtfsService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const port = 1234;

const kmlPath = path.resolve(__dirname, "Transmetro-routes.kml");
let kml = null;

// Hacer el KML opcional
try {
  kml = fs.readFileSync(kmlPath, "utf8");
} catch (error) {
  console.warn("Archivo KML no encontrado, endpoints KML no estarán disponibles");
}

function getKmlData() {
  return new Promise((resolve, reject) => {
    parseString(kml, (err, result) => {
      if (err) reject(err);

      const document = result.kml.Document[0];
      const folders = document.Folder || [document];
      const placemarksData = [];

      folders.forEach((folder) => {
        const RouteName = folder.Folder || "";
        const items = folder.Placemark || [];
        items.forEach((pm) => {
          placemarksData.push({
            name: pm.name?.[0] || null,
            description: pm.description?.[0] || null,
            type: pm.Point ? "Point" : pm.LineString ? "LineString" : "Unknown",
            coordinates:
              pm.Point?.[0]?.coordinates?.[0] ||
              pm.LineString?.[0]?.coordinates?.[0] ||
              null,
          });
        });
      });

      resolve(placemarksData);
    });
  });
}

app.get("/api/run", async (req, res) => {
  try {
    if (!kml) {
      return res.status(404).json({ error: "Archivo KML no disponible" });
    }
    
    const data = await getKmlData();
    res.json(data);
    fs.writeFileSync(
      path.join(__dirname, "routes.json"),
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    res.status(500).json({ error: "Error al procesar el KML" });
  }
});

// GTFS Endpoints
app.get("/api/gtfs/routes", async (req, res) => {
  try {
    const routes = await GTFSService.getRoutes();
    res.json(routes);
  } catch (error) {
    console.error('Error in /api/gtfs/routes:', error);
    res.status(500).json({ error: "Error al obtener rutas GTFS" });
  }
});

app.get("/api/gtfs/stops", async (req, res) => {
  try {
    const stops = await GTFSService.getStops();
    res.json(stops);
  } catch (error) {
    console.error('Error in /api/gtfs/stops:', error);
    res.status(500).json({ error: "Error al obtener paradas GTFS" });
  }
});

app.get("/api/gtfs/stops/near", async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: "Se requieren parámetros lat y lng" });
    }

    const stops = await GTFSService.getStopsNear(
      parseFloat(lat), 
      parseFloat(lng), 
      radius ? parseInt(radius) : 1000
    );
    res.json(stops);
  } catch (error) {
    console.error('Error in /api/gtfs/stops/near:', error);
    res.status(500).json({ error: "Error al obtener paradas cercanas" });
  }
});

app.get("/api/gtfs/routes/:routeId", async (req, res) => {
  try {
    const { routeId } = req.params;
    const route = await GTFSService.getRouteWithShapes(routeId);
    
    if (!route) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }
    
    res.json(route);
  } catch (error) {
    console.error('Error in /api/gtfs/routes/:routeId:', error);
    res.status(500).json({ error: "Error al obtener ruta específica" });
  }
});

app.get("/api/gtfs/map-data", async (req, res) => {
  try {
    const mapData = await GTFSService.getMapData();
    res.json({
      type: "FeatureCollection",
      features: [...mapData.stops, ...mapData.shapes]
    });
  } catch (error) {
    console.error('Error in /api/gtfs/map-data:', error);
    res.status(500).json({ error: "Error al obtener datos del mapa" });
  }
});

app.get("/api/gtfs/stats", async (req, res) => {
  try {
    const stats = await GTFSService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error in /api/gtfs/stats:', error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

app.listen(port, () => {
  console.log(`Servidor en http://localhost:${port}`);
});
