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
app.use(express.json({ limit: '10mb' }));

app.get('/api/columns', async (req, res) => {
  try {
    const columns = await prisma.column.findMany({ 
      orderBy: { createdAt: 'asc' } 
    });
    res.json(columns || []);
  } catch (error) {
    console.error('DB Fetch Columns Error:', error);
    res.status(500).json([]);
  }
});

app.post('/api/columns', async (req, res) => {
  try {
    const { title } = req.body;
    const newColumn = await prisma.column.create({
      data: { title },
    });
    res.json(newColumn);
  } catch (error) {
    console.error('DB Create Column Error:', error);
    res.status(500).json({ error: 'Failed to create column' });
  }
});

app.patch('/api/columns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    const updatedColumn = await prisma.column.update({
      where: { id },
      data: { title },
    });
    res.json(updatedColumn);
  } catch (error) {
    console.error('DB Update Column Error:', error);
    res.status(500).json({ error: 'Failed to update column' });
  }
});

app.delete('/api/columns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.column.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('DB Delete Column Error:', error);
    res.status(500).json({ error: 'Failed to delete column' });
  }
});

app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany();
    res.json(tickets || []);
  } catch (error) {
    console.error('DB Fetch Tickets Error:', error);
    res.status(500).json([]);
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const { title, priority, columnId } = req.body;
    const newTicket = await prisma.ticket.create({
      data: { title, priority, columnId },
    });
    res.json(newTicket);
  } catch (error) {
    console.error('DB Create Ticket Error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, columnId, imageUrls } = req.body;
    
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { title, description, priority, columnId, imageUrls },
    });
    res.json(updatedTicket);
  } catch (error) {
    console.error('DB Update Ticket Error:', error);
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
    console.error('DB Delete Ticket Error:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

async function initializeDB() {
  try {
    const columnCount = await prisma.column.count();
    
    if (columnCount === 0) {
      console.log('Empty database detected. Seeding default columns...');
      
      await prisma.column.create({ data: { title: 'To Do' } });
      await prisma.column.create({ data: { title: 'In Progress' } });
      await prisma.column.create({ data: { title: 'Done' } });
      
      console.log('Default columns created successfully.');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

initializeDB();

app.listen(PORT, () => console.log(`Server live on http://localhost:${PORT}`));