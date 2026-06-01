import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env.ts';

const connectionString = env.getDatabaseUrl();

if (!connectionString) {
    throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Please add it to your .env file with your PostgreSQL connection string. ' +
        'Example: postgresql://user:password@localhost:5432/recife_nimbus'
    );
}

if (connectionString.trim() === '') {
    throw new Error('DATABASE_URL environment variable is empty.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };