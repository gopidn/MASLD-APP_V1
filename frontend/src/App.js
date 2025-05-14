import React, { useState } from "react";

function App() {
  const [formData, setFormData] = useState({
      age: "",
      sex: "",
      height_cm: "",
      weight_kg: "",
      waist_circumference: "",
      bp_systolic: "",
      bp_diastolic: "",
      ast: "",
      alt: "",
      ggt: "",
      triglycerides: "",
      hdl_cholesterol: "",
      hba1c: "",
      fasting_glucose: "",
      fibroscan_kpa: "",
      biopsy_result: "",
      diagnosis_group: ""
    });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5050/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
  
      if (response.ok) {
        alert("Patient data submitted successfully!");
      } else {
        alert("Failed to submit data.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Server error.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>MASLD Patient Intake Form</h1>
      <form onSubmit={handleSubmit}>
        <label>Age (0–100):</label><br />
        <input
          type="number"
          name="age"
          min="18"
          max="100"
          value={formData.age}
          onChange={handleChange}
          required
        /><br /><br />

        <label>Sex:</label><br />
        <select
          name="sex"
          value={formData.sex}
          onChange={handleChange}
          required
        >
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select><br /><br />

        <label>Height (cm):</label><br />
        <input
          type="number"
          name="height_cm"
          value={formData.height_cm}
          onChange={handleChange}
          required
        /><br /><br />

        <label>Weight (kg):</label><br />
        <input
          type="number"
          name="weight_kg"
          value={formData.weight_kg}
          onChange={handleChange}
          required
        /><br /><br />

        <label>Waist Circumference (cm):</label><br />
        <input
          type="number"
          name="waist_circumference"
          value={formData.waist_circumference}
          onChange={handleChange}
          required
        /><br /><br />

        <label>Systolic BP (mm Hg):</label><br />
        <input 
          type="number" 
          name="bp_systolic" 
          value={formData.bp_systolic} 
          onChange={handleChange} 
        /><br /><br />

        <label>Diastolic BP (mm Hg):</label><br />
        <input 
          type="number" 
          name="bp_diastolic" 
          value={formData.bp_diastolic} 
          onChange={handleChange} 
        /><br /><br />

        <label>AST (U/L):</label><br />
        <input 
          type="number" 
          name="ast" 
          value={formData.ast} 
          onChange={handleChange} 
        /><br /><br />

        <label>ALT (U/L):</label><br />
        <input 
          type="number" 
          name="alt" 
          value={formData.alt} 
          onChange={handleChange} 
        /><br /><br />

        <label>GGT (U/L):</label><br />
        <input 
          type="number" 
          name="ggt" 
          value={formData.ggt} 
          onChange={handleChange} 
        /><br /><br />

        <label>Triglycerides (mg/dL):</label><br />
        <input type="number" name="triglycerides" value={formData.triglycerides} onChange={handleChange} /><br /><br />

        <label>HDL Cholesterol (mg/dL):</label><br />
        <input 
          type="number" 
          name="hdl_cholesterol" 
          value={formData.hdl_cholesterol} 
          onChange={handleChange} 
        /><br /><br />

        <label>HbA1c (%):</label><br />
        <input 
          type="number" 
          name="hba1c" 
          step="0.1" 
          value={formData.hba1c} 
          onChange={handleChange} 
        /><br /><br />

        <label>Fasting Glucose (mg/dL):</label><br />
        <input 
          type="number" 
          name="fasting_glucose" 
          value={formData.fasting_glucose} 
          onChange={handleChange} 
        /><br /><br />

        <label>FibroScan (kPa):</label><br />
        <input 
          type="number" 
          name="fibroscan_kpa" 
          value={formData.fibroscan_kpa} 
          onChange={handleChange} 
        /><br /><br />

        <label>Biopsy Result:</label><br />
        <select name="biopsy_result" value={formData.biopsy_result} onChange={handleChange}>
          <option value="">Select</option>
          <option value="F0">F0</option>
          <option value="F1">F1</option>
          <option value="F2">F2</option>
          <option value="F3">F3</option>
          <option value="F4">F4</option>
        </select><br /><br />

        <label>Diagnosis Group:</label><br />
        <select name="diagnosis_group" value={formData.diagnosis_group} onChange={handleChange}>
          <option value="">Select</option>
          <option value="Healthy">Healthy</option>
          <option value="MAFL">MAFL</option>
          <option value="MASH w/o fibrosis">MASH w/o fibrosis</option>
          <option value="MASH w/ fibrosis">MASH w/ fibrosis</option>
        </select><br /><br />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default App;