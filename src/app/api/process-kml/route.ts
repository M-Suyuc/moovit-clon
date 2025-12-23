import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import db from "@/services/connect-db";
import { from as copyFrom } from "pg-copy-streams";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  let kmlPath = "";

  try {
    const formData = await request.formData();
    const file = formData.get("kml") as File;

    if (!file || !file.name.endsWith(".kml")) {
      return NextResponse.json(
        { error: "Archivo KML requerido" },
        { status: 400 }
      );
    }

    // Crear directorio temporal
    const tempDir = join(process.cwd(), "temp");
    await mkdir(tempDir, { recursive: true });

    // Guardar archivo KML
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    kmlPath = join(tempDir, `${Date.now()}-${file.name}`);
    await writeFile(kmlPath, buffer);

    // Generar archivos GTFS solo con el nuevo KML
    const agencyName = file.name.replace(".kml", "");
    const { stdout } = await execAsync(
      `cd src/server && AGENCY_NAME="${agencyName}" KML_INPUT="${kmlPath}" pnpm run dev`,
      { timeout: 60000 }
    );

    // Verificar si las tablas ya existen
    let tablesExist = false;
    try {
      if (process.env.NODE_ENV === "production") {
        // En producción: verificar directamente en la DB
        await db.query("SELECT 1 FROM agency LIMIT 1");
      } else {
        // En desarrollo: usar Docker
        await execAsync(
          `docker exec gtfs_db psql -U postgis -d postgis_db -c "SELECT 1 FROM agency LIMIT 1;"`,
          { timeout: 10000 }
        );
      }
      tablesExist = true;
    } catch (e) {
      console.log("Tablas no existen");
      tablesExist = false;
    }

    if (!tablesExist) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            error: "Base de datos no inicializada. Contacta al administrador.",
          },
          { status: 500 }
        );
      } else {
        // En desarrollo: crear tablas con Docker
        await execAsync(
          `npx gtfs-to-sql --require-dependencies ./src/server/gtfs_feed/*.txt | docker exec -i gtfs_db psql -U postgis -d postgis_db`,
          { timeout: 120000 }
        );
      }
    } else {
      // TABLAS EXISTEN: Insertar datos usando COPY eficientemente
      const gtfsFeedPath = "./src/server/gtfs_feed";

      const files = [
        {
          file: "agency.txt",
          table: "agency",
          pkey: "agency_id",
          columns:
            "agency_id,agency_name,agency_url,agency_timezone,agency_lang",
        },
        {
          file: "routes.txt",
          table: "routes",
          pkey: "route_id",
          columns:
            "route_id,agency_id,route_short_name,route_long_name,route_desc,route_type",
        },
        {
          file: "stops.txt",
          table: "stops",
          pkey: "stop_id",
          columns:
            "stop_id,stop_name,stop_desc,stop_lat,stop_lon,location_type,parent_station,stop_timezone,wheelchair_boarding",
        },
        {
          file: "shapes.txt",
          table: "shapes",
          pkey: "shape_id,shape_pt_sequence",
          columns: "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence",
        },
        {
          file: "trips.txt",
          table: "trips",
          pkey: "trip_id",
          columns:
            "route_id,service_id,trip_id,shape_id,trip_headsign,direction_id,wheelchair_accessible",
        },
        {
          file: "stop_times.txt",
          table: "stop_times",
          pkey: "trip_id,stop_sequence",
          columns:
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,drop_off_type",
        },
        {
          file: "calendar.txt",
          table: "calendar",
          pkey: "service_id",
          columns:
            "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date",
        },
        {
          file: "feed_info.txt",
          table: "feed_info",
          pkey: "feed_publisher_name",
          columns:
            "feed_publisher_name,feed_publisher_url,feed_lang,feed_contact_email,feed_start_date,feed_end_date,feed_version",
        },
      ];

      // Usar transacción para asegurar consistencia
      await db.query("BEGIN");

      try {
        for (const { file, table, pkey, columns: columnas } of files) {
          const filePath = join(gtfsFeedPath, file);

          if (!fs.existsSync(filePath)) {
            console.log(`⚠️ ${file} no encontrado, omitiendo...`);
            continue;
          }

          console.log(`📥 Procesando ${table}...`);

          try {
            // 1. Crear tabla temporal con estructura del archivo GTFS
            if (table === "stops") {
              await db.query(`
                CREATE TEMP TABLE temp_stops (
                  stop_id text,
                  stop_name text,
                  stop_desc text,
                  stop_lat numeric,
                  stop_lon numeric,
                  location_type text,
                  parent_station text,
                  stop_timezone text,
                  wheelchair_boarding text
                );
              `);
            } else if (table === "trips") {
              await db.query(`
                CREATE TEMP TABLE temp_trips (
                  route_id text,
                  service_id text,
                  trip_id text,
                  shape_id text,
                  trip_headsign text,
                  direction_id text,
                  wheelchair_accessible text
                );
              `);
            } else if (table === "shapes") {
              await db.query(`
                 CREATE TEMP TABLE temp_shapes (
                   shape_id text,
                   shape_pt_lat numeric,
                   shape_pt_lon numeric,
                   shape_pt_sequence integer
                 );
               `);
            } else if (table === "stop_times") {
              await db.query(`
                CREATE TEMP TABLE temp_stop_times (
                  trip_id text,
                  arrival_time text,
                  departure_time text,
                  stop_id text,
                  stop_sequence integer,
                  pickup_type text,
                  drop_off_type text
                );
              `);
            } else if (table === "calendar") {
              await db.query(`
                CREATE TEMP TABLE temp_calendar (
                  service_id text,
                  monday text,
                  tuesday text,
                  wednesday text,
                  thursday text,
                  friday text,
                  saturday text,
                  sunday text,
                  start_date text,
                  end_date text
                );
              `);
            } else {
              await db.query(`
                CREATE TEMP TABLE temp_${table} (LIKE ${table} INCLUDING DEFAULTS);
              `);
            }

            // 2. Usar pg-copy-streams para COPY
            const client = await db.getClient();

            try {
              const copyStream = client.query(
                copyFrom(
                  `COPY temp_${table}(${columnas}) FROM STDIN WITH (FORMAT CSV, HEADER true, DELIMITER ',')`
                )
              );

              const fileStream = fs.createReadStream(filePath);

              await new Promise((resolve, reject) => {
                fileStream
                  .pipe(copyStream)
                  .on("finish", resolve)
                  .on("error", (error: Error) => {
                    console.error(
                      `Error en COPY para ${table}:`,
                      error.message
                    );
                    reject(error);
                  });
              });
            } finally {
              client.release();
            }

            // 3. Obtener columnas dinámicamente
            const columnsResult = await db.query(
              `
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = $1 
              ORDER BY ordinal_position;
              `,
              [table]
            );

            const columns = columnsResult.rows.map((row) => row.column_name);
            const columnList = columns.join(", ");

            // 4. Insertar evitando duplicados
            // const insertResult = await db.query(`
            // INSERT INTO ${table} (${columnList})
            // SELECT ${columnList} FROM temp_${table}
            // ON CONFLICT (${pkey}) DO NOTHING
            // RETURNING 1;
            // `);

            // console.log(
            //   `✅ ${table}: ${insertResult.rowCount} filas insertadas`
            // );

            // 4. Insertar con conversiones especiales según la tabla
            let insertResult;

            if (table === "stops") {
              // Stops: convertir lat/lon a PostGIS point
              insertResult = await db.query(`
                INSERT INTO stops (stop_id, stop_name, stop_desc, stop_loc, location_type, parent_station, stop_timezone, wheelchair_boarding)
                SELECT 
                  stop_id, 
                  stop_name, 
                  stop_desc, 
                  ST_SetSRID(ST_MakePoint(stop_lon, stop_lat), 4326)::geography,
                  CASE 
                    WHEN location_type = '0' OR location_type = '' THEN 'stop'::location_type_val
                    WHEN location_type = '1' THEN 'station'::location_type_val
                    WHEN location_type = '2' THEN 'entrance_exit'::location_type_val
                    WHEN location_type = '3' THEN 'node'::location_type_val
                    WHEN location_type = '4' THEN 'boarding_area'::location_type_val
                    ELSE 'stop'::location_type_val
                  END,
                  NULLIF(parent_station, ''),
                  NULLIF(stop_timezone, ''),
                  CASE 
                    WHEN wheelchair_boarding = '0' OR wheelchair_boarding = '' THEN 'no_info_or_inherit'::wheelchair_boarding_val
                    WHEN wheelchair_boarding = '1' THEN 'accessible'::wheelchair_boarding_val
                    WHEN wheelchair_boarding = '2' THEN 'not_accessible'::wheelchair_boarding_val
                    ELSE 'no_info_or_inherit'::wheelchair_boarding_val
                  END
                FROM temp_stops
                ON CONFLICT (stop_id) DO NOTHING
                RETURNING 1;
              `);
              console.log(
                `✅ ${table}: ${insertResult.rowCount} filas insertadas`
              );
            } else if (table === "stop_times") {
              // Stop_times: mapear pickup_type y drop_off_type
              insertResult = await db.query(`
                INSERT INTO stop_times (trip_id, arrival_time, departure_time, stop_id, stop_sequence, pickup_type, drop_off_type)
                SELECT 
                  trip_id,
                  CASE 
                    WHEN SUBSTRING(arrival_time, 1, 2)::integer >= 24 THEN 
                      (LPAD((SUBSTRING(arrival_time, 1, 2)::integer - 24)::text, 2, '0') || SUBSTRING(arrival_time, 3))::time
                    ELSE arrival_time::time
                  END,
                  CASE 
                    WHEN SUBSTRING(departure_time, 1, 2)::integer >= 24 THEN 
                      (LPAD((SUBSTRING(departure_time, 1, 2)::integer - 24)::text, 2, '0') || SUBSTRING(departure_time, 3))::time
                    ELSE departure_time::time
                  END,
                  stop_id,
                  stop_sequence,
                  CASE 
                    WHEN pickup_type = '0' OR pickup_type = '' THEN 'regular'::pickup_drop_off_type
                    WHEN pickup_type = '1' THEN 'not_available'::pickup_drop_off_type
                    WHEN pickup_type = '2' THEN 'call'::pickup_drop_off_type
                    WHEN pickup_type = '3' THEN 'driver'::pickup_drop_off_type
                    ELSE 'regular'::pickup_drop_off_type
                  END,
                  CASE 
                    WHEN drop_off_type = '0' OR drop_off_type = '' THEN 'regular'::pickup_drop_off_type
                    WHEN drop_off_type = '1' THEN 'not_available'::pickup_drop_off_type
                    WHEN drop_off_type = '2' THEN 'call'::pickup_drop_off_type
                    WHEN drop_off_type = '3' THEN 'driver'::pickup_drop_off_type
                    ELSE 'regular'::pickup_drop_off_type
                  END
                FROM temp_stop_times
                RETURNING 1;
              `);
              console.log(
                `✅ ${table}: ${insertResult.rowCount} filas insertadas`
              );
            } else if (table === "calendar") {
              // Calendar: mapear días de la semana
              insertResult = await db.query(`
                INSERT INTO calendar (service_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date)
                SELECT 
                  service_id,
                  CASE WHEN monday = '1' THEN 'available'::availability ELSE 'not_available'::availability END,
                  CASE WHEN tuesday = '1' THEN 'available'::availability ELSE 'not_available'::availability END,
                  CASE WHEN wednesday = '1' THEN 'available'::availability ELSE 'not_available'::availability END,
                  CASE WHEN thursday = '1' THEN 'available'::availability ELSE 'not_available'::availability END,
                  CASE WHEN friday = '1' THEN 'available'::availability ELSE 'not_available'::availability END,
                  CASE WHEN saturday = '1' THEN 'available'::availability ELSE 'not_available'::availability END,
                  CASE WHEN sunday = '1' THEN 'available'::availability ELSE 'not_available'::availability END,
                  TO_DATE(start_date, 'YYYYMMDD'),
                  TO_DATE(end_date, 'YYYYMMDD')
                FROM temp_calendar
                ON CONFLICT (service_id) DO NOTHING
                RETURNING 1;
              `);
              console.log(
                `✅ ${table}: ${insertResult.rowCount} filas insertadas`
              );
            } else if (table === "shapes") {
              // Shapes: convertir lat/lon a PostGIS point
              insertResult = await db.query(`
                INSERT INTO shapes (shape_id, shape_pt_sequence, shape_pt_loc, shape_dist_traveled)
                SELECT 
                  shape_id,
                  shape_pt_sequence,
                  ST_SetSRID(ST_MakePoint(shape_pt_lon, shape_pt_lat), 4326)::geography,
                  NULL
                FROM temp_shapes
                RETURNING 1;
              `);
              console.log(
                `✅ ${table}: ${insertResult.rowCount} filas insertadas`
              );
            } else if (table === "trips") {
              // Trips: mapear wheelchair_accessible
              insertResult = await db.query(`
                INSERT INTO trips (route_id, service_id, trip_id, shape_id, trip_headsign, direction_id, wheelchair_accessible)
                SELECT 
                  route_id,
                  service_id,
                  trip_id,
                  NULLIF(shape_id, ''),
                  trip_headsign,
                  direction_id::integer,
                  CASE 
                    WHEN wheelchair_accessible = '0' OR wheelchair_accessible = '' THEN 'unknown'::wheelchair_accessibility
                    WHEN wheelchair_accessible = '1' THEN 'accessible'::wheelchair_accessibility
                    WHEN wheelchair_accessible = '2' THEN 'not_accessible'::wheelchair_accessibility
                    ELSE 'unknown'::wheelchair_accessibility
                  END
                FROM temp_trips
                ON CONFLICT (trip_id) DO NOTHING
                RETURNING 1;
              `);
              console.log(
                `✅ ${table}: ${insertResult.rowCount} filas insertadas`
              );
            } else if (table === "stop_times") {
              await db.query(`
                CREATE TEMP TABLE temp_stop_times (
                  trip_id text,
                  arrival_time text,
                  departure_time text,
                  stop_id text,
                  stop_sequence integer,
                  pickup_type text,
                  drop_off_type text
                );
              `);
            } else {
              // Otras tablas: inserción normal
              insertResult = await db.query(`
                INSERT INTO ${table} (${columnList})
                SELECT ${columnList} FROM temp_${table}
                ON CONFLICT (${pkey}) DO NOTHING
                RETURNING 1;
              `);
              console.log(
                `✅ ${table}: ${insertResult.rowCount} filas insertadas`
              );
            }

            // 5. Limpiar tabla temporal
            await db.query(`DROP TABLE temp_${table}`);
          } catch (error) {
            console.error(
              `❌ Error procesando ${table}:`,
              (error as Error).message
            );
            throw error; // Esto hará ROLLBACK de toda la transacción
          }
        }

        await db.query("COMMIT");
        console.log("🎉 Todos los datos insertados exitosamente");
      } catch (error) {
        await db.query("ROLLBACK");
        throw error;
      }
    }

    return NextResponse.json({
      message: "KML procesado e importado a la base de datos exitosamente",
      details: stdout,
    });
  } catch (error) {
    console.error("❌ Error en el proceso:", error);
    return NextResponse.json(
      {
        error: "Error procesando archivo: " + (error as Error).message,
      },
      { status: 500 }
    );
  } finally {
    // Limpiar archivo temporal
    if (kmlPath) {
      try {
        await unlink(kmlPath);
      } catch (e) {
        console.error("Error limpiando archivo temporal:", e);
      }
    }
  }
}
