const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const open = require('open');

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(TOKEN_PATH)) {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  } else {
    getNewToken(oAuth2Client, callback);
  }
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this URL:', authUrl);
  open(authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from that page here: ', code => {
    rl.close();
    oAuth2Client.getToken(code).then(({ tokens }) => {
      oAuth2Client.setCredentials(tokens);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
      console.log('Token stored to', TOKEN_PATH);
      callback(oAuth2Client);
    });
  });
}

function transferOwnership(auth) {
  const drive = google.drive({ version: 'v3', auth });

  const fileId = 'YOUR_FILE_ID'; // replace with actual File ID
  const newOwnerEmail = 'newuser@example.com';

  drive.permissions.create({
    fileId,
    resource: {
      type: 'user',
      role: 'owner',
      emailAddress: newOwnerEmail
    },
    transferOwnership: true
  }, (err, res) => {
    if (err) return console.error('Error during ownership transfer:', err.message);
    console.log('Ownership transferred successfully!');
  });
}

// Load credentials and start
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading credentials.json:', err);
  authorize(JSON.parse(content), transferOwnership);
});
