const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = 5050;

function sanitisePatient(data) {
  // 1. clone so we don’t mutate req.body directly
  const clean = { ...data };

  // 2. list of numeric fields in your form
  const numericKeys = [
    "age", "height_cm", "weight_kg",
    "waist_circumference", "bp_systolic", "bp_diastolic",
    "ast", "alt", "ggt", "triglycerides", "hdl_cholesterol",
    "hba1c", "fasting_glucose", "fibroscan_kpa"
  ];

  for (const k in clean) {
    if (clean[k] === "") {
      // turn "" into null
      clean[k] = null;
    } else if (numericKeys.includes(k)) {
      // turn "120" into 120  (or leave null as-is)
      clean[k] = Number(clean[k]);
    }
  }
  return clean;
}

app.use(cors());
app.use(express.json());

app.post("/submit", async (req, res) => {
  try {

    const data = sanitisePatient(req.body);
    
    // pg needs a *string* for jsonb columns
    data.report_files = JSON.stringify(data.report_files ?? []);

    const query = `
      INSERT INTO patients (
        name, mobile, date_of_birth, age, state, sex, height_cm, weight_kg, waist_circumference,
        bp_systolic, bp_diastolic, ast, alt, ggt,
        triglycerides, hdl_cholesterol, hba1c, fasting_glucose,
        fibroscan_kpa, biopsy_result, diagnosis_group, report_files
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18, 
        $19, $20, $21, $22::jsonb
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
    console.log("Received data:", data);
    res.status(200).send("Patient data stored successfully.");
  } catch (err) {
    console.error("Error storing data:", err);
    res.status(500).send("Failed to insert paitent data.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


// Begin GCS Cloud Connect.

const { Storage } = require("@google-cloud/storage");
const path = require("path");

// Point to your downloaded service account key JSON
const storage = new Storage({
  keyFilename: path.join(__dirname, "gcs-key.json"), // replace with your actual filename
});

const bucketName = "masld-reports";
const bucket = storage.bucket(bucketName);

// End GCS Cloud Connect.

// Begin GCS Upload code.
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB per file
});

app.post('/upload-multiple', upload.array('reports'), async (req, res) => {
  try {
    /* ---------- sanity checks ---------- */
    const files = req.files;                 // array from Multer
    const typesRaw = req.body.types;         // string → JSON.parse below

    if (!files?.length) {
      return res.status(400).json({ uploadedFiles: [] });
    }
    if (!typesRaw) {
      return res.status(400).json({ error: '"types" field missing.' });
    }

    let types;
    try {
      types = JSON.parse(typesRaw);
    } catch {
      return res.status(400).json({ error: '"types" is not valid JSON.' });
    }

    if (files.length !== types.length) {
      return res.status(400).json({
        error: `Mismatch: ${files.length} files, ${types.length} types.`,
      });
    }

    /* ---------- upload each file ---------- */
    const uploadedFiles = await Promise.all(
      files.map((file, i) => uploadOne(file, types[i]))
    );

    return res.status(200).json({ uploadedFiles });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload failed. See server logs.' });
  }
});

/* helper stores file.buffer directly in GCS */
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
// End GCS Upload code.