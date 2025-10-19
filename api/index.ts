// Vercel will compile this file separately; import compiled app at runtime
import serverless from 'serverless-http';
import { createApp } from '../dist/http_bridge.js';

const app = createApp();
const handler = serverless(app);

export default handler as any;


