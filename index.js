const express = require("express");
const { google } = require("googleapis");
const session = require("cookie-session");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(session({
  name: 'session',
  keys: ['secret-key'],
}));

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "http://localhost:3000/auth/callback"
);

// Scopes for listing and transferring files
const SCOPES = ['https://www.googleapis.com/auth/drive'];

app.get("/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  res.redirect(url);
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  req.session.tokens = tokens;
  res.redirect("/files");
});

app.get("/files", async (req, res) => {
  oauth2Client.setCredentials(req.session.tokens);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.files.list({
    q: "'me' in owners",
    fields: "files(id, name, owners)",
  });

  res.json(response.data.files);
});

app.post("/transfer", express.json(), async (req, res) => {
  const { fileId, newOwnerEmail } = req.body;
  oauth2Client.setCredentials(req.session.tokens);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "owner",
        type: "user",
        emailAddress: newOwnerEmail,
      },
      transferOwnership: true,
    });

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`🧙 Server running on http://localhost:${PORT}`));
