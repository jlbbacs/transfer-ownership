import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import open from 'open';


// SET YOUR CLIENT INFO
const CLIENT_ID = '297488501161-rbgmgct0ipnpmiv4fdetqgt11dtig4l6.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost'; // or urn:ietf:wg:oauth:2.0:oob for CLI
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

function getAccessToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this URL:', authUrl);
  open(authUrl);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Enter the code from that page here: ', async (code) => {
    rl.close();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync('token.json', JSON.stringify(tokens));
    console.log('✅ Token stored to token.json');
    transferOwnership();
  });
}

async function transferOwnership() {
  const drive = google.drive({ version: 'v3', auth: oAuth2Client });

  const fileId = '1CPEJAtnNcJ8B-K2N-mOKsgQMNdOtQfGK';
  const newOwnerEmail = 'josephlesterbacs@gmail.com';

  try {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        type: 'user',
        role: 'owner',
        emailAddress: newOwnerEmail,
      },
      transferOwnership: true,
      fields: 'id',
    });
    console.log('✅ Ownership transferred to ${newOwnerEmail}');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

if (fs.existsSync('token.json')) {
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync('token.json')));
  transferOwnership();
} else {
  getAccessToken();
}
