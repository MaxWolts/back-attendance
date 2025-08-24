import express from "express";
import cors from "cors";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import "dotenv/config";
import fs from "fs";

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
  });

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const sheetsAuth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
  },
  scopes: SCOPES,
});

const sheets = google.sheets({ version: "v4", auth: sheetsAuth });


app.post("/api/attendance", async (req, res) => {
  const { email } = req.body;
  console.log(req);
  
  try {
    const date = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "Hoja 1!A1:B",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[email, date]],
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar asistencia" });
  }
});

app.post("/api/verify", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    res.json({ user: payload });
  } catch (err) {
    res.status(401).json({ error: "Token inválido" });
  }
});

app.get("/api/protected", (req, res) => {
  res.json({ message: "Accediste a un recurso protegido 🎉" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));