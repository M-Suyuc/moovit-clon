/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import "server-only";

import { Pool, QueryResult, QueryResultRow } from "pg";

// Define environment variable types
declare global {
  var pgPool: Pool | undefined;

  namespace NodeJS {
    interface ProcessEnv {
      POSTGISHOST: string;
      POSTGISDBNAME: string;
      POSTGISUSER: string;
      POSTGISPASSWORD: string;
      POSTGISPORT?: number;
    }

    // Extend the global interface to include our database instance
    interface Global {
      pgPool?: Pool;
    }
  }
}

// Define the database interface
interface Database {
  query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>>;
  getPool(): Pool;
  getClient(): Promise<any>;
  end(): Promise<void>;
}

// Pool configuration
const poolConfig = {
  max: 20, // set pool size to 20 connections
  idleTimeoutMillis: 10000, // close idle clients after 10 seconds
  connectionTimeoutMillis: 10000, // return an error after 10 seconds if connection could not be established
  host:
    process.env.NODE_ENV === "production"
      ? process.env.POSTGISHOST_PROD
      : process.env.POSTGISHOST,

  database:
    process.env.NODE_ENV === "production"
      ? process.env.POSTGISDBNAME_PROD
      : process.env.POSTGISDBNAME,

  user:
    process.env.NODE_ENV === "production"
      ? process.env.POSTGISUSER_PROD
      : process.env.POSTGISUSER,

  password:
    process.env.NODE_ENV === "production"
      ? process.env.POSTGISPASSWORD_PROD
      : process.env.POSTGISPASSWORD,

  port: process.env.POSTGISPORT ?? 5432,
};

// Create or use the existing pool
const getPool = (): Pool => {
  // Check if we already have a pool on the global object
  if (!global.pgPool) {
    global.pgPool = new Pool(poolConfig);

    // Set up error handler
    global.pgPool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
      // Unexpected error on idle client -- Error incesperado en cliente inactivo
      process.exit(-1);
    });

    async function verifyConnection(): Promise<void> {
      try {
        const client = await pgPool?.connect();
        console.log("✅ Connected to PostgreSQL database");
        client?.release(); // Release the client back to the pool
      } catch (error) {
        console.error("❌ Error connecting to the database:", error);
      }
    }
    // Immediately verify connection upon module load.
    verifyConnection();

    // For development environments: handle hot reloading
    if (process.env.NODE_ENV !== "production") {
      // Clean up pool on module reload
      // @ts-ignore
      if (module.hot) {
        // @ts-ignore
        module.hot.dispose(() => {
          if (global.pgPool) {
            global.pgPool.end();
            global.pgPool = undefined;
          }
        });
      }
    }
  }

  return global.pgPool;
};

// Create the database object with all methods
const db: Database = {
  query: async <T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> => {
    const pool = getPool();
    return pool.query<T>(text, params);
  },

  // EN TU connect-db.ts, CAMBIA el método getClient a esto:
  getClient: async (): Promise<any> => {
    const pool = getPool();
    const client = await pool.connect();

    // NO sobrescribas el método query, pg-copy-streams ya lo hace
    return client;
  },

  getPool: (): Pool => {
    return getPool();
  },

  end: async (): Promise<void> => {
    if (global.pgPool) {
      await global.pgPool.end();
      global.pgPool = undefined;
    }
  },
};

export default db;
// ver los campos que faltan o buscar algunan maera de evitar esos camposen el paquete de gtfs-via-postgres
// para que solo llene los campos necesarios | sololos que lleve el archivo gtfs
// error en la console:
// 📥 Procesando agency...
// Error en COPY para agency: missing data for column "agency_phone"
// ❌ Error procesando agency: missing data for column "agency_phone"
// ❌ Error en el proceso: [error: missing data for column "agency_phone"] {
//   length: 235,
//   severity: 'ERROR',
//   code: '22P04',
//   detail: undefined,
//   hint: undefined,
//   position: undefined,
//   internalPosition: undefined,
//   internalQuery: undefined,
//   where: 'COPY temp_agency, line 2: "9966233a-0459-4134-b88b-082b732ab6f4,TuBus,https://www.muniguate.com/movilidadurbana/tubus,America/G..."',
//   schema: undefined,
//   table: undefined,
//   column: undefined,
//   dataType: undefined,
//   constraint: undefined,
//   file: 'copyfromparse.c',
//   line: '902',
//   routine: 'NextCopyFrom'
// }
//  POST /api/process-kml 500 in 2482ms
