import { auth, sheets as buildClient } from '@googleapis/sheets';

import type { sheets_v4 } from '@googleapis/sheets';

/** Creates the Google Sheets client. It signs in with the service account key file. */
export function createSheetClient(keyFile: string): sheets_v4.Sheets {
  const credentials = new auth.GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  return buildClient({ version: 'v4', auth: credentials });
}
