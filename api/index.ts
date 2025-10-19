// Vercel will compile this file separately; import compiled app at runtime
import serverless from 'serverless-http';
import express, { type Request, type Response } from 'express';
import { createApp } from '../dist/http_bridge.js';

// Create the API app and mount it under /api so routes respond as /api/* on Vercel
const apiApp = createApp();
const root = express();

// Friendly root message for visits to the site root
root.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'mcp-google-calendar',
    message: 'API is running. See /api/openapi.json, /api/calendars, /api/events',
  });
});

root.use('/api', apiApp);

const handler = serverless(root);

export default handler as any;


