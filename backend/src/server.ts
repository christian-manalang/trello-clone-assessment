import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const db = new Database(dbPath);

/* WORKAROUND: Prisma v7 BetterSqlite3 Adapter compatibility issue.
 * The adapter internally attempts to call .replace() on a URL string. 
 * Passing only the db instance throws a TypeError. To bypass this version-specific bug:
 * 1. Initialize the adapter with the expected url string.
 * 2. Manually attach the active better-sqlite3 database instance to the client property.
 */
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`
} as any); 

(adapter as any).client = db;
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany();
    res.json(tickets || []);
  } catch (error) {
    console.error('DB Fetch Error:', error);
    res.status(500).json([]);
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const { title } = req.body;
    const newTicket = await prisma.ticket.create({
      data: { title, status: 'TODO' },
    });
    res.json(newTicket);
  } catch (error) {
    console.error('DB Create Error:', error);
    res.status(500).json({ error: 'Failed to create' });
  }
});

app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { status },
    });
    res.json(updatedTicket);
  } catch (error) {
    console.error('DB Update Error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

app.delete('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.ticket.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('DB Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

app.listen(PORT, () => console.log(`Server live on http://localhost:${PORT}`));