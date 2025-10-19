import { createApp } from './http_bridge.js';

const app = createApp();
const PORT = Number(process.env.PORT ?? 8787);
app.listen(PORT, () => {
  console.log(`HTTP bridge listening on http://localhost:${PORT}`);
});


