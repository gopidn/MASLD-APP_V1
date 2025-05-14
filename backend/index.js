const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = 5050;

app.use(cors());
app.use(express.json());

app.post("/submit", async (req, res) => {
  try {
    const data = req.body;

    const query = `
      INSERT INTO patients (
        age, sex, height_cm, weight_kg, waist_circumference,
        bp_systolic, bp_diastolic, ast, alt, ggt,
        triglycerides, hdl_cholesterol, hba1c, fasting_glucose,
        fibroscan_kpa, biopsy_result, diagnosis_group
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17
      )
    `;

    const values = [
      data.age, data.sex, data.height_cm, data.weight_kg, data.waist_circumference,
      data.bp_systolic, data.bp_diastolic, data.ast, data.alt, data.ggt,
      data.triglycerides, data.hdl_cholesterol, data.hba1c, data.fasting_glucose,
      data.fibroscan_kpa, data.biopsy_result, data.diagnosis_group
    ];

    await pool.query(query, values);
    res.status(200).send("Data stored successfully.");
  } catch (err) {
    console.error("Error storing data:", err);
    res.status(500).send("Server error.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
