import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// 禁用预处理语句以获得最佳的兼容性
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })

export * from './schema'
