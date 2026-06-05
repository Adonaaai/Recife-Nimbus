import "dotenv/config";
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;

if (!connectionString) {
    throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Please add it to your .env file with your PostgreSQL connection string. '
    );
}

if (connectionString.trim() === '') {
    throw new Error('DATABASE_URL environment variable is empty.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };