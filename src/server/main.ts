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
    const stops: Stops[] = [];
    const routes: any[] = [];

    const agencyId = gtfs.getAgencyId();

    // Procesar cada folder por separado
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      const folderNameElement = folder?.getElementsByTagName("name")[0];
      const routeName = folderNameElement
        ? folderNameElement.textContent
        : `Ruta ${i + 1}`;

      if (
        (routeName &&
          (routeName.toLowerCase().includes("cercanía") ||
            routeName.toLowerCase().includes("conexión") ||
            routeName.toLowerCase().includes("caminando"))) ||
        routeName.toLowerCase().includes("no asignada") ||
        routeName.toLowerCase().includes("varios")
      ) {
        console.log(`⚠️ Saltando folder: ${routeName} (no es una ruta)`);
        continue;
      }

      const uuid = KMLProcessor.generateUUID();
      const routeId = `${uuid}`;
      console.log("🚀 ~ KMLProcessor ~ getStopsAndRoutes ~ routeId:", routeId);

      // Obtener paradas de este folder específico
      const folderPlacemarks = folder!.getElementsByTagName("Placemark");
      const routeStops: Stops[] = [];
      let coordinates: Array<{ lat: number; lon: number }> = [];

      for (let j = 0; j < folderPlacemarks.length; j++) {
        const placemark = folderPlacemarks[j];
        const nameElement = placemark?.getElementsByTagName("name")[0];
        const namePlacemark = nameElement
          ? nameElement.textContent?.replace(/\s+/g, " ").trim()
          : `Stop ${j + 1}`;

        // Buscar Point (paradas de esta ruta)
        const point = placemark?.getElementsByTagName("Point")[0];
        if (point) {
          const coordsElement = point.getElementsByTagName("coordinates")[0];
          if (coordsElement) {
            const [lon, lat] = coordsElement.textContent
              .trim()
              .split(",")
              .map(Number);

            const stopUuid = KMLProcessor.generateUUID();
            const stopId = `${stopUuid}`;

            const stop: Stops = {
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
            };

            routeStops.push(stop);
            stops.push(stop);
          }
        }

        // Buscar geometrías (LineString/Polygon)
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
            }
          }
        }

        // Buscar MultiGeometry primero
        const multiGeometry =
          placemark?.getElementsByTagName("MultiGeometry")[0];
        if (multiGeometry && coordinates.length === 0) {
          const polygons = multiGeometry.getElementsByTagName("Polygon");
          // Combinar coordenadas de todos los polígonos
          for (let k = 0; k < polygons.length; k++) {
            const polygon = polygons[k];
            if (polygon) {
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
                      const polygonCoords = coordPairs.map((coord) => {
                        const [lon = 0, lat = 0] = coord.split(",").map(Number);
                        return { lat, lon };
                      });
                      coordinates.push(...polygonCoords);
                    }
                  }
                }
              }
            }
          }
        }

        // Buscar Polygon si no hay LineString ni MultiGeometry
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
                }
              }
            }
          }
        }
      }

      // Crear la ruta con sus paradas específicas
      routes.push({
        route_id: routeId,
        agency_id: agencyId,
        route_short_name: routeName,
        route_long_name: "",
        route_desc: "",
        route_type: 3,
        coordinates: coordinates,
        stops: routeStops, // ← Paradas específicas de esta ruta
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

// function createAgency({ AgencyName }: { AgencyName?: string | undefined }) {
//   const uuid = KMLProcessor.generateUUID();

//   const agencyId = `${uuid}`;
//   gtfs.setAgencyId(agencyId);

//   const agency = [
//     "agency_id,agency_name,agency_url,agency_timezone,agency_lang",
//     `${agencyId},${AgencyName},https://www.transmetro.gob.gt,America/Guatemala,es`,
//   ].join("\n");

//   fs.writeFileSync("gtfs_feed/agency.txt", agency);
//   return { agency, agencyId };
// }
function createAgency(
  agencies: Array<{ AgencyName?: string | undefined; agencyId: string }>
) {
  const header = "agency_id,agency_name,agency_url,agency_timezone,agency_lang";
  const rows = agencies.map(
    ({ agencyId, AgencyName }) =>
      `${agencyId},${AgencyName},https://www.muniguate.com/movilidadurbana/${AgencyName?.toLowerCase()},America/Guatemala,es`
  );

  // https://www.muniguate.com/movilidadurbana/transmetro/

  const agencyContent = [header, ...rows].join("\n");
  fs.writeFileSync("gtfs_feed/agency.txt", agencyContent);
  return agencyContent;
}

function createStops(stops: Stops[]) {
  const header =
    "stop_id,stop_name,stop_desc,stop_lat,stop_lon,location_type,parent_station,stop_timezone,wheelchair_boarding";
  const rows = stops.map(
    (stop) =>
      `${stop.stop_id},"${stop.stop_name}","${stop.stop_desc.replace(
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
    (route) =>
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
  const FREQUENCY_MINUTES = 10;
  const START_TIME = "05:30";
  const END_TIME = "20:00";

  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours! * 60 + minutes!;
  }

  function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:00`;
  }

  const startMinutes = timeToMinutes(START_TIME);
  const endMinutes = timeToMinutes(END_TIME);
  const service_id = gtfs.getCalendarId();

  routes.forEach((route) => {
    console.log("🚀 ~ createTripsAndStopTimes ~ route:", route.route_id);
    let tripCounter = 1;

    // Generar trips cada 10 minutos de 5:30 a 20:00
    for (
      let time = startMinutes;
      time <= endMinutes;
      time += FREQUENCY_MINUTES
    ) {
      const tripId = `${route.route_id}_${tripCounter
        .toString()
        .padStart(3, "0")}`;

      trips.push({
        trip_id: tripId,
        route_id: route.route_id,
        service_id,
        trip_headsign: route.route_short_name,
        direction_id: 0,
        shape_id: route.route_id,
        wheelchair_accessible: 1,
      });

      // Usar solo las paradas específicas de esta ruta
      const routeStops = route.stops || [];

      if (routeStops.length === 0) {
        console.warn(`⚠️ Ruta ${route.route_short_name} no tiene paradas`);
        return;
      }

      // Crear stop_times solo para las paradas de esta ruta
      routeStops.forEach((stop, seq) => {
        const stopId =
          typeof stop === "string" ? stop : (stop as Stops).stop_id;
        const stopTimeMinutes = time + seq * 5; // 5 min entre paradas
        const arrivalTime = minutesToTime(stopTimeMinutes);
        stopTimes.push({
          trip_id: tripId,
          arrival_time: arrivalTime,
          departure_time: arrivalTime,
          stop_id: stopId,
          stop_sequence: seq + 1,
          pickup_type: 0,
          drop_off_type: 0,
        });
      });
      tripCounter++;
    }
  });

  console.log(`🚌 Trips generados: ${trips.length}`);
  console.log(`⏰ Stop times generados: ${stopTimes.length}`);
  console.log(
    `📅 Horario: ${START_TIME} - ${END_TIME} cada ${FREQUENCY_MINUTES} min`
  );

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

function createFeedInfo(allAgencies?: string[]) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  const header =
    "feed_publisher_name,feed_publisher_url,feed_lang,feed_contact_email,feed_start_date,feed_end_date,feed_version";

  const rows =
    allAgencies?.map(
      (agencyName) =>
        `${agencyName},https://mls-transport.com,es,suyucmarlon02@gmail.com,${today},${nextYear},1.0.${today}`
    ) ?? [];

  const feedContent = [header, ...rows].join("\n");

  fs.writeFileSync("gtfs_feed/feed_info.txt", feedContent);
  return feedContent;
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

async function main(kmlPaths: string[]) {
  try {
    createDirectory();

    const allAgencies: Array<{
      AgencyName?: string | undefined;
      agencyId: string;
    }> = [];
    const allStops: Stops[] = [];
    const allRoutes: Routes[] = [];

    // Procesar cada archivo KML
    kmlPaths.forEach((kmlPath) => {
      console.log(`📁 Procesando: ${kmlPath}`);

      const kmlProcessor = new KMLProcessor(kmlPath);
      const { AgencyName } = kmlProcessor.getAgencyName();

      // Generar ID único para esta agencia
      const agencyId = KMLProcessor.generateUUID();
      gtfs.setAgencyId(agencyId);

      allAgencies.push({ AgencyName, agencyId });

      const { stops, routes } = kmlProcessor.getStopsAndRoutes();

      // Agregar agency_id a todas las rutas de esta agencia
      routes.forEach((route) => {
        route.agency_id = agencyId;
      });

      allStops.push(...stops);
      allRoutes.push(...routes);
    });

    // Crear archivos GTFS con todos los datos
    createFeedInfo(allRoutes.map((r) => r.route_short_name));
    createAgency(allAgencies);
    createRoutes(
      allRoutes,
      allRoutes.map((r) => r.route_short_name)
    );
    createStops(allStops);
    createCalendar();
    createShapes(allRoutes);
    createTripsAndStopTimes(allStops, allRoutes);

    generatZip("./gtfs_feed", "gtfs.zip");
  } catch (error: Error | any) {
    console.error("❌ Error:", error.message);
  }
}

(() => {
  // main(["./kmls/Transmetro-routes.kml", "./kmls/TuBus.kml"]);

  // Usar archivo KML desde variable de entorno o archivos por defecto
  const kmlInput = process.env.KML_INPUT;
  const kmlFiles = kmlInput
    ? [kmlInput]
    : ["./kmls/Transmetro-routes.kml", "./kmls/TuBus.kml"];

  main(kmlFiles).catch(console.error);
})();
