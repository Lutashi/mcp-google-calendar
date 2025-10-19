import { google, type Auth } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CRED_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

// Allow cloud deployment by supplying credentials and token via env vars
const CREDENTIALS_JSON = process.env.CREDENTIALS_JSON;
const TOKEN_JSON = process.env.TOKEN_JSON;

export async function getAuth(): Promise<Auth.OAuth2Client> {
  const credsObject = CREDENTIALS_JSON
    ? JSON.parse(CREDENTIALS_JSON)
    : JSON.parse(await fs.readFile(CRED_PATH, 'utf8'));

  const { client_secret, client_id, redirect_uris } = credsObject.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // In cloud mode prefer token from env and never attempt interactive auth
  if (TOKEN_JSON) {
    oAuth2Client.setCredentials(JSON.parse(TOKEN_JSON));
    return oAuth2Client;
  }

  // Local dev: try token.json file
  try {
    const token = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } catch {
    // If we are in a non-interactive environment, throw a clear error
    if (process.env.VERCEL || process.env.CI) {
      throw new Error('Missing TOKEN_JSON in environment; set TOKEN_JSON with OAuth tokens.');
    }
    const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
    console.log('Authorize this app by visiting:', authUrl);
    const code = await new Promise<string>((resolve) => {
      process.stdout.write('Enter the code here: ');
      process.stdin.once('data', d => resolve(String(d).trim()));
    });
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), 'utf8');
    return oAuth2Client;
  }
}
