import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '../utils/logger';

// PostgreSQL connection pool
let pool: Pool | null = null;

/**
 * Initialize database connection pool
 */
export const initializeDatabase = (): Pool => {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  // Handle pool errors
  pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', { error: err });
    process.exit(-1);
  });

  // Test connection
  pool.query('SELECT NOW()', (err) => {
    if (err) {
      logger.error('Failed to connect to database', { error: err });
      process.exit(-1);
    }
    logger.info('Database connection established successfully');
  });

  return pool;
};

/**
 * Get database pool instance
 */
export const getPool = (): Pool => {
  if (!pool) {
    return initializeDatabase();
  }
  return pool;
};

/**
 * Execute a query
 */
export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  const pool = getPool();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', {
      query: text,
      duration,
      rows: result.rowCount,
    });
    
    return result;
  } catch (error) {
    logger.error('Query error', {
      query: text,
      error,
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
export const getClient = async (): Promise<PoolClient> => {
  const pool = getPool();
  return pool.connect();
};

/**
 * Close database connection pool
 */
export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
};

/**
 * Transaction helper
 */
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

