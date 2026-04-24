import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

const app = express();
const PORT = process.env.PORT || 3000;

const db = new Database('./prisma/dev.db');
const adapter = new PrismaBetterSqlite3(db as any); // 'as any' is used here to bypass a type clash between Prisma v7 and better-sqlite3 types
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});