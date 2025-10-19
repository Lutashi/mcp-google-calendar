// test_client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  // The transport will spawn the MCP server process for us
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/server.js']
  });
  
  const client = new Client({ name: 'test-client', version: '0.0.1' });
  await client.connect(transport);

  // optional: list calendars
  const cals = await client.callTool({ name: 'list_calendars', arguments: {} });
  console.log('Calendars:', cals);

  // create an event (adjust times + offset for your timezone)
  const res = await client.callTool({
    name: 'create_event',
    arguments: {
      title: 'MCP test event',
      startISO: '2025-10-20T18:00:00-04:00',
      endISO:   '2025-10-20T18:30:00-04:00',
      location: 'Frist 302',
      attendees: ['aj5828@princeton.edu']
    }
  });

  console.log('Created:', res);
  
  // Close the transport (this will also terminate the server process)
  await client.close();
}
main().catch(e => { 
  console.error('Error:', e); 
  if (e.message) console.error('Message:', e.message);
  if (e.stack) console.error('Stack:', e.stack);
  process.exit(1); 
});
