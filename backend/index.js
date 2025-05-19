const express = require("express");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 5050;

const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json());

// GCS setup
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});
const bucket = storage.bucket("masld-reports");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB
});

// Clean form inputs
function sanitisePatient(data) {
  const clean = { ...data };
  const numericKeys = [
    "age", "height_cm", "weight_kg", "waist_circumference",
    "bp_systolic", "bp_diastolic", "ast", "alt", "ggt",
    "triglycerides", "hdl_cholesterol", "hba1c",
    "fasting_glucose", "fibroscan_kpa"
  ];

  for (const k in clean) {
    if (clean[k] === "") clean[k] = null;
    else if (numericKeys.includes(k)) clean[k] = Number(clean[k]);
  }

  return clean;
}

app.post("/submit", async (req, res) => {
  try {
    const data = sanitisePatient(req.body);
    data.report_files = JSON.stringify(data.report_files ?? []);

    const query = `
      INSERT INTO patients (
        name, mobile, date_of_birth, age, state, sex, height_cm, weight_kg,
        waist_circumference, bp_systolic, bp_diastolic, ast, alt, ggt,
        triglycerides, hdl_cholesterol, hba1c, fasting_glucose,
        fibroscan_kpa, biopsy_result, diagnosis_group, report_files
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb
      )
    `;

    const values = [
      data.name, data.mobile, data.date_of_birth, data.age, data.state,
      data.sex, data.height_cm, data.weight_kg, data.waist_circumference,
      data.bp_systolic, data.bp_diastolic, data.ast, data.alt, data.ggt,
      data.triglycerides, data.hdl_cholesterol, data.hba1c, data.fasting_glucose,
      data.fibroscan_kpa, data.biopsy_result, data.diagnosis_group, data.report_files
    ];

    await pool.query(query, values);
    res.status(200).send("Patient data stored successfully.");
  } catch (err) {
    console.error("Error storing data:", err);
    res.status(500).send("Failed to insert patient data.");
  }
});

app.post('/upload-multiple', upload.array('reports'), async (req, res) => {
  try {
    const files = req.files;
    const typesRaw = req.body.types;

    if (!files?.length || !typesRaw) {
      return res.status(400).json({ error: 'Missing files or types' });
    }

    let types;
    try {
      types = JSON.parse(typesRaw);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON in types' });
    }

    if (files.length !== types.length) {
      return res.status(400).json({
        error: `Mismatch: ${files.length} files, ${types.length} types.`,
      });
    }

    const uploadedFiles = await Promise.all(
      files.map((file, i) => uploadOne(file, types[i]))
    );

    return res.status(200).json({ uploadedFiles });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload failed. See server logs.' });
  }
});

async function uploadOne(file, givenType) {
  const blob = bucket.file(`${Date.now()}-${file.originalname}`);
  await blob.save(file.buffer, {
    resumable: false,
    contentType: file.mimetype,
  });
  return {
    file_url: `https://storage.googleapis.com/${bucket.name}/${blob.name}`,
    file_type: givenType,
  };
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});