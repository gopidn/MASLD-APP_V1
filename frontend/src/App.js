import React, { useState } from "react";

function App() {
  const [formData, setFormData] = useState({
      name:"",
      mobile:"",
      date_of_birth:"",
      age: "",// calculated automatically
      sex: "",
      state:"",
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
      diagnosis_group: "",
//      file_url: null,
      report_files: [],
    });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // returns { ok: true }  or { ok: false, message: '...' }
    function validateReports(reportFiles) {
      for (let i = 0; i < reportFiles.length; i++) {
        const { file, type } = reportFiles[i];
        if (file && (!type || type.trim() === '')) {
          return { ok: false, message: `Please pick a type for file #${i + 1}` };
        }
      }
      return { ok: true };
    }

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);
    
      try {
        let uploadedFiles = [];
        const hasFiles = formData.report_files.some(entry => entry.file);
    
        if (hasFiles) {
          // The same as before: upload files and get uploadedFiles array
          const fileData = new FormData();
          const types = [];
    
          // Validate file types
          const check = validateReports(formData.report_files);
          if (!check.ok) {
            setFormError(check.message);
            setIsSubmitting(false);
            return;
          }
    
          formData.report_files.forEach((entry) => {
            if (entry.file) {
              fileData.append("reports", entry.file);
              types.push(entry.type);
            }
          });
          fileData.append("types", JSON.stringify(types));
    
          const uploadRes = await fetch('http://localhost:5050/upload-multiple', {
            method: 'POST',
            body: fileData,
          });
    
          if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            throw new Error(`Upload failed (${uploadRes.status}): ${errText}`);
          }
    
          const result = await uploadRes.json();
          uploadedFiles = result.uploadedFiles;
        }
        // If no files, uploadedFiles will be []
    
        // Prepare data to submit to backend
        const dataToSend = { ...formData };
        delete dataToSend.report_files;
        dataToSend.report_files = uploadedFiles;
    
        const response = await fetch("http://localhost:5050/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        });
    
        if (response.ok) {
          alert("Patient data submitted successfully!");
          setFormData({
            name: "",
            mobile: "",
            date_of_birth: "",
            age: "",
            sex: "",
            state: "",
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
            diagnosis_group: "",
            report_files: []
          });
          setFormError("");
        } else {
          alert("Failed to submit patient data.");
        }
      } catch (err) {
        console.error("Submit error:", err);
        alert("An error occurred during submission.");
      } finally {
        setIsSubmitting(false);
      }
    };    

  return (
    <div style={{ padding: "20px" }}>
      <h1>MASLD Patient Intake Form</h1>

      {formError && (
        <div style={{ color: "red", fontWeight: "bold", marginBottom: "10px" }}>
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit}>

      <label>Upload Medical Reports:</label><br />
        {formData.report_files.map((item, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const newFiles = [...formData.report_files];
                newFiles[index].file = e.target.files[0];
                setFormData({ ...formData, report_files: newFiles });
              }}
            />
            <select
              value={item.type}
              required={!!item.file}
              onChange={(e) => {
                const newFiles = [...formData.report_files];
                newFiles[index].type = e.target.value;
                setFormData({ ...formData, report_files: newFiles });
              }}
            >
              <option value="">Select Type</option>
              <option value="Blood Report">Blood Report</option>
              <option value="Ultrasound">Ultrasound</option>
              <option value="Fibroscan">Fibroscan</option>
              <option value="Biopsy">Biopsy</option>
              <option value="Other">Other</option>
            </select>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setFormData(prev => ({
              ...prev,
              report_files: [...prev.report_files, { file: null, type: "" }],
            }))
          }
        >
          + Add Reports
        </button>
        <br /><br />

        <label>Patient Name:</label><br />
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
        /><br /><br />
        
        <label>Mobile Number:</label><br />
        <input
          type="tel"
          name="mobile"
          value={formData.mobile}
          pattern="[0-9]{10}"
          onChange={handleChange}
        /><br /><br />

        <label>Date of Birth:</label><br />
        <input
          type="date"
          name="date_of_birth"
          value={formData.date_of_birth}
          onChange={(e) => {
            const dob = e.target.value;
            const birthDate = new Date(dob);
            const today = new Date();
              let ageDiff = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                ageDiff--;
              }
            setFormData(prev => ({ ...prev, date_of_birth: dob, age: ageDiff }));
          }}
        /><br /><br />

        <label>Calculated Age:</label><br />
        <input type="number" value={formData.age} readOnly /><br /><br />

        <label>State of Residence:</label><br />
        <select name="state" value={formData.state} onChange={handleChange}>
          <option value="">Select State</option>
          <option value="Andhra Pradesh">Andhra Pradesh</option>
          <option value="Arunachal Pradesh">Arunachal Pradesh</option>
          <option value="Assam">Assam</option>
          <option value="Bihar">Bihar</option>
          <option value="Chhattisgarh">Chhattisgarh</option>
          <option value="Goa">Goa</option>
          <option value="Gujarat">Gujarat</option>
          <option value="Haryana">Haryana</option>
          <option value="Himachal Pradesh">Himachal Pradesh</option>
          <option value="Jharkhand">Jharkhand</option>
          <option value="Karnataka">Karnataka</option>
          <option value="Kerala">Kerala</option>
          <option value="Madhya Pradesh">Madhya Pradesh</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="Manipur">Manipur</option>
          <option value="Meghalaya">Meghalaya</option>
          <option value="Mizoram">Mizoram</option>
          <option value="Nagaland">Nagaland</option>
          <option value="Odisha">Odisha</option>
          <option value="Punjab">Punjab</option>
          <option value="Rajasthan">Rajasthan</option>
          <option value="Sikkim">Sikkim</option>
          <option value="Tamil Nadu">Tamil Nadu</option>
          <option value="Telangana">Telangana</option>
          <option value="Tripura">Tripura</option>
          <option value="Uttar Pradesh">Uttar Pradesh</option>
          <option value="Uttarakhand">Uttarakhand</option>
          <option value="West Bengal">West Bengal</option>
          <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
          <option value="Chandigarh">Chandigarh</option>
          <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
          <option value="Delhi">Delhi</option>
          <option value="Jammu and Kashmir">Jammu and Kashmir</option>
          <option value="Ladakh">Ladakh</option>
          <option value="Lakshadweep">Lakshadweep</option>
          <option value="Puducherry">Puducherry</option>
        </select><br /><br />

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

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default App;