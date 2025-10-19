// auth_init.ts - Run this to complete OAuth setup
import { getAuth } from './auth.js';

console.log('Starting authentication...\n');

getAuth()
  .then(() => {
    console.log('\n✅ Authentication successful! token.json has been created.');
    console.log('You can now run your test client.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Authentication failed:', err);
    process.exit(1);
  });

