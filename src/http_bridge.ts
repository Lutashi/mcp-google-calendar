import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import { getAuth } from './auth.js';

import type { Express } from 'express';

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Optional API key protection for public exposure
  const API_KEY = process.env.API_KEY;
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!API_KEY) return next();
    const key = req.header('x-api-key');
    if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
    next();
  });

// Minimal OpenAPI spec for ChatGPT Actions import
  app.get('/openapi.json', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.0.0',
    info: { title: 'Google Calendar Bridge', version: '1.0.0' },
    servers: [{ url: process.env.PUBLIC_URL ?? 'http://localhost:8787' }],
    paths: {
      '/calendars': {
        get: {
          operationId: 'listCalendars',
          summary: 'List available calendars',
          responses: { '200': { description: 'OK' } },
        },
      },
      '/events': {
        post: {
          operationId: 'createEvent',
          summary: 'Create a timed event',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    startISO: { type: 'string' },
                    endISO: { type: 'string' },
                    location: { type: 'string' },
                    description: { type: 'string' },
                    attendees: { type: 'array', items: { type: 'string', format: 'email' } },
                    calendarId: { type: 'string', default: 'primary' },
                  },
                  required: ['title', 'startISO', 'endISO'],
                },
              },
            },
          },
          responses: { '200': { description: 'OK' } },
        },
      },
    },
  });
  });

  app.get('/calendars', async (_req: Request, res: Response) => {
  try {
    const auth = await getAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const { data } = await calendar.calendarList.list();
    res.json(data.items ?? []);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
  });

  app.post('/events', async (req: Request, res: Response) => {
  try {
    const { title, startISO, endISO, location, description, attendees, calendarId } = req.body ?? {};
    if (!title || !startISO || !endISO) return res.status(400).json({ error: 'title, startISO, endISO required' });

    const auth = await getAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const event: any = {
      summary: title,
      location: location ?? undefined,
      description: description ?? undefined,
      start: { dateTime: startISO },
      end: { dateTime: endISO },
      attendees: (attendees ?? []).map((email: string) => ({ email })),
    };
    const resp = await calendar.events.insert({ calendarId: calendarId ?? 'primary', requestBody: event });
    res.json({ id: resp.data.id, htmlLink: resp.data.htmlLink, status: resp.data.status });
  } catch (err: any) {
    if (err?.code === 401 || String(err?.message ?? '').includes('invalid_grant')) {
      return res.status(401).json({ error: 'Unauthorized - re-run auth' });
    }
    res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
  });

  return app;
}

// Default export for serverless platforms (e.g., Vercel)
const defaultApp = createApp();
export default defaultApp;


