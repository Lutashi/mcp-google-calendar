import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { google } from 'googleapis';
import { getAuth } from './auth.js';

// Test authentication on startup
// console.log('Testing authentication...');
// try {
//   await getAuth();
//   console.log('Authentication successful. MCP server is ready.');
// } catch (error) {
//   console.error('Authentication failed:', error);
//   process.exit(1);
// }

const server = new Server(
  { name: 'mcp-google-calendar', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

const createEventSchema = z.object({
  title: z.string(),
  startISO: z.string().describe('ISO 8601, e.g. 2025-10-21T14:00:00-04:00'),
  endISO: z.string(),
  location: z.string().optional(),
  description: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  calendarId: z.string().default('primary')
});

// List available tools. So when someone asks "What tools do you have?". The handler replies with the functions defined here.
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_event',
        description: 'Create a Google Calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            startISO: { 
              type: 'string', 
              description: 'ISO 8601, e.g. 2025-10-21T14:00:00-04:00' 
            },
            endISO: { type: 'string' },
            location: { type: 'string' },
            description: { type: 'string' },
            attendees: { 
              type: 'array', 
              items: { type: 'string', format: 'email' } 
            },
            calendarId: { type: 'string', default: 'primary' }
          },
          required: ['title', 'startISO', 'endISO']
        }
      },
      {
        name: 'list_calendars',
        description: 'List available calendars',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ]
  };
});

// Handle tool calls. The actual functionality.
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'create_event') {
    const parsed = createEventSchema.parse(args);
    const auth = await getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const event: any = {
      summary: parsed.title,
      location: parsed.location ?? null,
      description: parsed.description ?? null,
      start: { dateTime: parsed.startISO },
      end: { dateTime: parsed.endISO },
      attendees: (parsed.attendees ?? []).map(email => ({ email }))
    };

    const res = await calendar.events.insert(
      {
        calendarId: parsed.calendarId,
        requestBody: event
      }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { id: res.data.id, htmlLink: res.data.htmlLink, status: res.data.status },
            null, 2
          )
        }
      ]
    };
  } else if (name === 'list_calendars') {
    const auth = await getAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const { data } = await calendar.calendarList.list();
    return { 
      content: [{ 
        type: 'text', 

        // basically ?? operator means that if data.items doesn't exist use an empty array in case that there are no calendars!
        // null means not to filter anything and 2 is the spacing.
        text: JSON.stringify(data.items ?? [], null, 2) 
      }] 
    };
  } else {
    throw new Error(`Unknown tool: ${name}`);
  }
});

await server.connect(new StdioServerTransport());
