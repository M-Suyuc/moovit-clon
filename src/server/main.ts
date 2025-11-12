import fs from "node:fs";
import { v4 as uuidv4 } from "uuid";
import { DOMParser } from "xmldom";
import JSZip from "jszip";

import { gtfs } from "./gtfs-manager.js";
import type { Routes, Stops, StopTimes, Trips } from "./types.js";
import path from "node:path";

class KMLProcessor {
  kmlPath: string;
  kmlContent: string;
  doc: Document;
  private _stops: Stops[] | null;
  private _routes: Routes[] | null;

  constructor(kmlPath: string) {
    this.kmlPath = kmlPath;
    this.kmlContent = fs.readFileSync(kmlPath, "utf8");
    this.doc = new DOMParser().parseFromString(this.kmlContent, "text/xml");
    this._stops = null;
    this._routes = null;
  }

  static generateUUID() {
    return uuidv4();
  }

  getRouteNames() {
    const folders = this.doc.getElementsByTagName("Folder");
    const names = [];

    for (let i = 0; i < folders.length; i++) {
      const nameElement = folders[i]?.getElementsByTagName("name")[0];
      if (nameElement) {
        names.push(nameElement.textContent);
      }
    }
    return names;
  }

  getDescription(placemark: Element) {
    const descElement = placemark.getElementsByTagName("description")[0];
    return descElement ? descElement.textContent : "";
  }

  getAgencyName() {
    const AgencyName = this.doc.getElementsByTagName("name")[0]?.textContent;

    return { AgencyName };
  }
  getStopsAndRoutes() {
    if (this._stops && this._routes) {
      return { stops: this._stops, routes: this._routes };
    }

    const folders = this.doc.getElementsByTagName("Folder");
    const placemarks = this.doc.getElementsByTagName("Placemark");

    const stops: Stops[] = [];
    const routes: any[] = [];

    // stops
    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];
      const nameElement = placemark?.getElementsByTagName("name")[0];
      const namePlacemark = nameElement
        ? nameElement.textContent?.replace(/\s+/g, " ").trim()
        : `Item ${i + 1}`;

      const uuid = KMLProcessor.generateUUID();
      const stopId = `${uuid}`;
      gtfs.setStopId(stopId);

      // Buscar Point (stops)
      const point = placemark?.getElementsByTagName("Point")[0];
      if (point) {
        const coordinates = point.getElementsByTagName("coordinates")[0];

        if (coordinates) {
          const [lon, lat] = coordinates.textContent
            .trim()
            .split(",")
            .map(Number);

          stops.push({
            stop_id: stopId,
            stop_name: namePlacemark,
            stop_desc: this.getDescription(placemark),
            stop_lat: lat ?? 0,
            stop_lon: lon ?? 0,
            location_type: 0,
            parent_station: "",
            stop_timezone: "America/Guatemala",
            wheelchair_boarding: 1,
            zone_id: "",
          });
        }
      }
    }

    const agencyId = gtfs.getAgencyId();
    // routes
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      const folderNameElement = folder?.getElementsByTagName("name")[0];

      const uuid = KMLProcessor.generateUUID();

      const RouteName = folderNameElement
        ? folderNameElement.textContent
        : `Ruta ${i + 1}`;

      // Buscar geometrías dentro del folder
      const folderPlacemarks = folder!.getElementsByTagName("Placemark");
      let coordinates: Array<{ lat: number; lon: number }> = [];

      for (let j = 0; j < folderPlacemarks.length; j++) {
        const placemark = folderPlacemarks[j];

        // LineString
        const lineString = placemark?.getElementsByTagName("LineString")[0];
        if (lineString) {
          const coordsElement =
            lineString.getElementsByTagName("coordinates")[0];
          if (coordsElement) {
            const coordText = coordsElement.textContent?.trim();
            if (coordText) {
              const coordPairs = coordText
                .split(/\s+/)
                .filter((coord) => coord.includes(","));
              coordinates = coordPairs.map((coord) => {
                const [lon = 0, lat = 0] = coord.split(",").map(Number);
                return { lat, lon };
              });
              break;
            }
          }
        }

        // Polygon
        const polygon = placemark?.getElementsByTagName("Polygon")[0];
        if (polygon && coordinates.length === 0) {
          const outerBoundary =
            polygon.getElementsByTagName("outerBoundaryIs")[0];
          if (outerBoundary) {
            const linearRing =
              outerBoundary.getElementsByTagName("LinearRing")[0];
            if (linearRing) {
              const coordsElement =
                linearRing.getElementsByTagName("coordinates")[0];
              if (coordsElement) {
                const coordText = coordsElement.textContent?.trim();
                if (coordText) {
                  const coordPairs = coordText
                    .split(/\s+/)
                    .filter((coord) => coord.includes(","));
                  coordinates = coordPairs.map((coord) => {
                    const [lon = 0, lat = 0] = coord.split(",").map(Number);
                    return { lat, lon };
                  });
                  break;
                }
              }
            }
          }
        }
      }

      routes.push({
        route_id: `${uuid}`,
        agency_id: `${agencyId}`,
        route_short_name: RouteName,
        route_long_name: "",
        route_desc: "",
        route_type: 3,
        coordinates: coordinates,
      });
    }

    this._stops = stops;
    this._routes = routes;

    return { stops, routes };
  }
}

function createDirectory() {
  if (!fs.existsSync("gtfs_feed")) {
    fs.mkdirSync("gtfs_feed");
  }
}

function createAgency({ AgencyName }: { AgencyName?: string | undefined }) {
  const uuid = KMLProcessor.generateUUID();

  const agencyId = `${uuid}`;
  gtfs.setAgencyId(agencyId);

  const agency = [
    "agency_id,agency_name,agency_url,agency_timezone,agency_lang",
    `${agencyId},${AgencyName},https://www.transmetro.gob.gt,America/Guatemala,es`,
  ].join("\n");

  fs.writeFileSync("gtfs_feed/agency.txt", agency);
  return { agency, agencyId };
}

function createStops(stops: Stops[]) {
  const header =
    "stop_id,stop_name,stop_desc,stop_lat,stop_lon,location_type,parent_station,stop_timezone,wheelchair_boarding";
  const rows = stops.map(
    (stop) =>
      `${stop.stop_id},${stop.stop_name},"${stop.stop_desc.replace(
        /"/g,
        "'"
      )}",${stop.stop_lat},${stop.stop_lon},0,,America/Guatemala,1`
  );
  const stopsContent = [header, ...rows].join("\n");
  fs.writeFileSync("gtfs_feed/stops.txt", stopsContent);
  return stops;
}

function createRoutes(routes: Routes[], routeNames: string[]) {
  // Ajustar nombres si hay discrepancia
  while (routeNames.length < routes.length) {
    routeNames.push(
      `----Revisar function createRoutes----- ${routeNames.length + 1}`
    );
  }

  const header =
    "route_id,agency_id,route_short_name,route_long_name,route_desc,route_type";
  const rows = routes.map(
    (route, index) =>
      `${route.route_id},${route.agency_id},${route.route_short_name},,${route.route_desc},${route.route_type}`
  );

  const routesContent = [header, ...rows].join("\n");
  fs.writeFileSync("gtfs_feed/routes.txt", routesContent);
  return routes;
}

function createShapes(routes: Routes[]) {
  const header = "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence";
  const rows: string[] = [];

  routes.forEach((route) => {
    const shapeId = route.route_id; // Usar route_id como shape_id
    (route.coordinates || []).forEach((coord, index) => {
      rows.push(`${shapeId},${coord.lat},${coord.lon},${index + 1}`);
    });
  });

  const shapesContent = [header, ...rows].join("\n");
  fs.writeFileSync("gtfs_feed/shapes.txt", shapesContent);
  return rows;
}

function createCalendar() {
  const uuid = KMLProcessor.generateUUID();
  const calendarId = `${uuid}`;
  gtfs.setCalendarId(calendarId);

  const calendar = [
    "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date",
    `${calendarId},1,1,1,1,1,1,1,20240101,20251231`,
  ].join("\n");

  fs.writeFileSync("gtfs_feed/calendar.txt", calendar);
  return calendar;
}

function createTripsAndStopTimes(stops: Stops[], routes: Routes[]) {
  const trips: Trips[] = [];
  const stopTimes: StopTimes[] = [];

  // Distribución equitativa de paradas
  const totalStops = stops.length;
  const totalRoutes = routes.length;
  const stopsPerRoute = Math.floor(totalStops / totalRoutes);
  console.log("🚀 ~ createTripsAndStopTimes ~ stopsPerRoute:", stopsPerRoute);

  routes.forEach((route, routeIndex) => {
    const shapeId = route.route_id; // Mismo shape_id que en shapes.txt

    // Asignar rango de paradas a cada ruta
    const startIdx = routeIndex * stopsPerRoute;
    let endIdx = startIdx + stopsPerRoute;

    // Para la última ruta, incluir paradas restantes
    if (routeIndex === totalRoutes - 1) {
      endIdx = totalStops;
    }

    const routeStops = stops.slice(startIdx, endIdx);

    const serviceId = gtfs.getCalendarId();
    // Crear múltiples trips por ruta
    for (let tripNum = 1; tripNum <= 3; tripNum++) {
      const tripId = `${route.route_id}-${tripNum}`;
      const direction = tripNum <= 2 ? 0 : 1;

      trips.push({
        route_id: route.route_id,
        service_id: serviceId,
        trip_id: tripId,
        shape_id: shapeId,
        trip_headsign: `${route.route_short_name
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase())} Viaje ${tripNum}`,
        direction_id: direction,
        wheelchair_accessible: 0,
      });

      // Crear horarios
      const startHour = 6 + (tripNum - 1) * 4; // 6:00, 10:00, 14:00
      const stopsForTrip = routeStops.slice(0, 20); // Máximo 20 paradas por trip

      // Invertir orden si es dirección contraria
      const finalStops =
        direction === 1 ? stopsForTrip.slice().reverse() : stopsForTrip;

      finalStops.forEach((stop, seq) => {
        const arrivalTime = startHour * 60 + seq * 3; // 3 minutos entre paradas
        const arrivalHour = Math.floor(arrivalTime / 60);
        const arrivalMin = arrivalTime % 60;

        stopTimes.push({
          trip_id: tripId,
          arrival_time: `${arrivalHour.toString().padStart(2, "0")}:${arrivalMin
            .toString()
            .padStart(2, "0")}:00`,
          departure_time: `${arrivalHour
            .toString()
            .padStart(2, "0")}:${arrivalMin.toString().padStart(2, "0")}:00`,
          stop_id: stop.stop_id,
          stop_sequence: seq + 1,
          pickup_type: 0,
          drop_off_type: 0,
        });
      });
    }
  });

  // Escribir trips.txt
  const tripsHeader =
    "route_id,service_id,trip_id,shape_id,trip_headsign,direction_id,wheelchair_accessible";
  const tripsRows = trips.map(
    (trip) =>
      `${trip.route_id},${trip.service_id},${trip.trip_id},${trip.shape_id},"${trip.trip_headsign}",${trip.direction_id},${trip.wheelchair_accessible}`
  );
  fs.writeFileSync(
    "gtfs_feed/trips.txt",
    [tripsHeader, ...tripsRows].join("\n")
  );

  // Escribir stop_times.txt
  const stopTimesHeader =
    "trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,drop_off_type";
  const stopTimesRows = stopTimes.map(
    (st) =>
      `${st.trip_id},${st.arrival_time},${st.departure_time},${st.stop_id},${st.stop_sequence},${st.pickup_type},${st.drop_off_type}`
  );
  fs.writeFileSync(
    "gtfs_feed/stop_times.txt",
    [stopTimesHeader, ...stopTimesRows].join("\n")
  );

  return { trips, stopTimes };
}

function createFeedInfo({ AgencyName }: { AgencyName?: string | undefined }) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  const feedInfo = [
    "feed_publisher_name,feed_publisher_url,feed_lang,feed_contact_email,feed_start_date,feed_end_date,feed_version",
    `${AgencyName},https://mls-transport.com,es,suyucmarlon02@gmail.com,${today},${nextYear},1.0.${today}`,
  ].join("\n");

  fs.writeFileSync("gtfs_feed/feed_info.txt", feedInfo);
  return feedInfo;
}

async function generatZip(folderPath: string, outputPath: any) {
  const zip = new JSZip();

  function addFolderToZip(currentPath: string, zipFolder: any) {
    const items = fs.readdirSync(currentPath);

    items.forEach((item) => {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        const newFolder = zipFolder.folder(item);
        addFolderToZip(itemPath, newFolder);
      } else {
        const content = fs.readFileSync(itemPath);
        zipFolder.file(item, content);
      }
    });
  }

  addFolderToZip(folderPath, zip);

  const content_1 = await zip.generateAsync({ type: "nodebuffer" });
  fs.writeFileSync(outputPath, content_1);
  console.log(`ZIP creado: ${outputPath}`);
}

function main(kmlPath: string) {
  try {
    const kmlProcessor = new KMLProcessor(kmlPath);
    const { AgencyName } = kmlProcessor.getAgencyName();

    createDirectory();
    createFeedInfo({ AgencyName });
    createAgency({ AgencyName });

    const { stops, routes } = kmlProcessor.getStopsAndRoutes();
    const routeNames = kmlProcessor.getRouteNames();

    createRoutes(routes, routeNames);
    createStops(stops);
    createCalendar();
    createShapes(routes);
    createTripsAndStopTimes(stops, routes);
    generatZip("./gtfs_feed", "gtfs.zip");

    console.log(
      "============= ✅ GTFS feed generado en la carpeta 'gtfs_feed' ============="
    );
  } catch (error: Error | any) {
    console.error("❌ Error:", error.message);
  }
}

(() => {
  main("./Transmetro.kml");
})();
