declare const google: any;

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

let tokenResponse: any = null;

export const getAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error('VITE_CLIENT_ID is not configured in .env'));
      return;
    }

    if (tokenResponse && Date.now() < tokenResponse.expires_at) {
      resolve(tokenResponse.access_token);
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            tokenResponse = {
              ...response,
              expires_at: Date.now() + (response.expires_in * 1000)
            };
            resolve(response.access_token);
          } else {
            reject(new Error('Failed to get access token: ' + (response.error || 'Unknown error')));
          }
        },
      });
      client.requestAccessToken();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Uploads a file to Google Drive
 */
export const uploadToDrive = async (fileName: string, content: string, mimeType: string = 'text/plain') => {
  const token = await getAccessToken();
  
  const metadata = {
    name: fileName,
    mimeType: mimeType,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: mimeType }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error('Failed to upload to Drive: ' + await response.text());
  }

  return response.json();
};

/**
 * Exports data to a new Google Sheet
 */
export const exportToSheets = async (title: string, headers: string[], rows: any[][]) => {
  const token = await getAccessToken();

  // 1. Create a new Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title }
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create spreadsheet: ' + await createRes.text());
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;

  // 2. Add data
  const values = [headers, ...rows];
  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=RAW`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values
    }),
  });

  if (!updateRes.ok) {
    throw new Error('Failed to update spreadsheet: ' + await updateRes.text());
  }

  return spreadsheet;
};
