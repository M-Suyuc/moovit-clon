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
      // @ts-expect-error
      if (module.hot) {
        // @ts-expect-error
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
