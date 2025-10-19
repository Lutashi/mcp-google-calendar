import serverless from 'serverless-http';
import { createApp } from '../dist/http_bridge.js';
// Vercel runs Node ESM, but we import the compiled dist app
const app = createApp();
const handler = serverless(app);
export default async function vercelHandler(req, res) {
    process.env.NODE_ENV = 'vercel';
    return handler(req, res);
}
//# sourceMappingURL=index.js.map