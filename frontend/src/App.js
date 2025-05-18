import React, { useState, useRef } from "react";
import './App.css';
import { AiFillMedicineBox, AiOutlineInfoCircle } from 'react-icons/ai';


// Custom Tooltip component
function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0} // for accessibility
    >
      {children}
      {visible && (
        <span className="custom-tooltip">
          {text}
        </span>
      )}
    </span>
  );
}

/* A tiny wrapper so we don’t repeat <div className="form-section">… */
function FormSection({ title, children }) {
  return (
    <div className="form-section">
      <h2 className="form-title">{title}</h2>
      <div className="grid-two">{children}</div>
    </div>
  );
}

export default function App() {
  const errorBannerRef = useRef(null); 
  
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

    function validateForm(data) {
          if (!data.name.trim()) return "Patient Name is required.";
          if (!/^\d{10}$/.test(data.mobile)) return "Mobile Number must be 10 digits.";
          if (!data.date_of_birth) return "Date of Birth is required.";
          if (!data.sex) return "Sex is required.";
          if (!data.height_cm) return "Height is required.";
          if (!data.weight_kg) return "Weight is required.";
          if (!data.waist_circumference) return "Waist Circumference is required.";
          // New validation: DOB must not be in the future
          const dobDate = new Date(data.date_of_birth);
          const today = new Date();
          dobDate.setHours(0,0,0,0); // Remove time part for accurate comparison
          today.setHours(0,0,0,0);

          if (dobDate > today) {
            return "Date of Birth cannot be a future date.";
          }
      return "";
    }

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);

      const error = validateForm(formData);

      if (error) {
        setFormError(error);
        setIsSubmitting(false);
        // Scroll to error panel after DOM updates
        setTimeout(() => {
          if (errorBannerRef.current) {
            errorBannerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100); // 100ms ensures the error panel is rendered before scroll
        return;
      }
    
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
            if (error) {
              setFormError(check.message);
              setIsSubmitting(false);
              // Scroll to error panel after DOM updates
              setTimeout(() => {
                if (errorBannerRef.current) {
                  errorBannerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }, 100); // 100ms ensures the error panel is rendered before scroll
              return;
            }
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
    <main>
      <header className="page-heading">
        <AiFillMedicineBox className="brand-icon" />
        <h1>MASLD Patient Intake</h1>
      </header>

      <div className="form-wrapper">
      {formError && (
        <div ref={errorBannerRef} className="error-banner">
          {formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
      <FormSection title="Lab Reports">
        {/* Row for label and Add button */}
          <label style={{ fontWeight: 500, fontSize: "1.1em" }}>Upload Medical Reports:
          <Tooltip text="Upload relevant diagnostic reports (PDF, JPG, PNG). Examples: Blood reports, Ultrasound, FibroScan, or Biopsy results. You can add multiple files.">
              <AiOutlineInfoCircle className="help-icon" />
              </Tooltip>
          </label>
          <button className="secondary" 
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
        

        {/* Each row: file & type select */}
        {formData.report_files.map((item, index) => (
          <React.Fragment key={index}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const newFiles = [...formData.report_files];
                  newFiles[index].file = e.target.files[0];
                  setFormData({ ...formData, report_files: newFiles });
                }}
              />
            </div>
            <div>
              <select
                value={item.type}
                required={!!item.file}
                onChange={(e) => {
                  const newFiles = [...formData.report_files];
                  newFiles[index].type = e.target.value;
                  setFormData({ ...formData, report_files: newFiles });
                }}
              >
                <option value="">Select Report Type</option>
                <option value="Blood Report">Blood Report</option>
                <option value="Ultrasound">Ultrasound</option>
                <option value="Fibroscan">Fibroscan</option>
                <option value="Biopsy">Biopsy</option>
                <option value="Other">Other</option>
              </select>
              {/* Remove (X) button */}
              <button
                type="button"
                className="remove-report-btn"
                aria-label={`Remove report ${index + 1}`}
                onClick={() => {
                  const newFiles = formData.report_files.filter((_, i) => i !== index);
                  setFormData({ ...formData, report_files: newFiles });
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#d0384a",
                  fontWeight: "bold",
                  fontSize: "0.75em",
                  cursor: "pointer",
                  marginLeft: 4,
                  paddingTop:2,
                }}
              >
                Remove
              </button>
            </div>
          </React.Fragment>
        ))}
      </FormSection>

          <FormSection title="Personal Details">
          <div>
          <label className="required">Patient Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
          <label>Mobile Number:</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              pattern="[0-9]{10}"
              onChange={handleChange}
              inputMode="numeric"
            />
          </div>
          
          <div>
          <label className="required">Date of Birth:</label>
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
              required
            />
          </div>

          <div>
            <label>State of Residence:</label>
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
            </select>
            </div>

          <div>
            <label className="required">Calculated Age:</label>
            <input type="number" value={formData.age} readOnly />
          </div>

          <div>
            <label className="required">Sex:</label>
            <select
              name="sex"
              value={formData.sex}
              onChange={handleChange}
              required
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            </div>
          </FormSection>

          <FormSection title="Anthropometry">
          <div>
          <label className="required">Height (cm):</label>
            <input
              type="number"
              name="height_cm"
              value={formData.height_cm}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
          <label className="required">Weight (kg):</label>
            <input
              type="number"
              name="weight_kg"
              value={formData.weight_kg}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
          <label className="required">Waist Circumference (cm):</label>
            <input
              type="number"
              name="waist_circumference"
              value={formData.waist_circumference}
              onChange={handleChange}
              required
            />
          </div>
          </FormSection>

          <FormSection title="Vitals & Labs">
          <div>
            <label>Systolic BP (mm Hg):              
              <Tooltip text="Systolic Blood Pressure (upper number, measured in mm Hg)">
              <AiOutlineInfoCircle className="help-icon" />
              </Tooltip>
            </label>
            <input 
              type="number" 
              name="bp_systolic" 
              value={formData.bp_systolic} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label>Diastolic BP (mm Hg):
              <Tooltip text="Diastolic Blood Pressure (lower number, measured in mm Hg)">
              <AiOutlineInfoCircle className="help-icon" />
              </Tooltip>
            </label>
            <input 
              type="number" 
              name="bp_diastolic" 
              value={formData.bp_diastolic} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label>AST
              <Tooltip text="Aspartate Aminotransferase (AST): Normal 0-40 U/L. Liver enzyme indicating possible liver injury.">
                <AiOutlineInfoCircle className="help-icon" />
              </Tooltip>
            </label>
            <input 
              type="number" 
              name="ast" 
              value={formData.ast} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label>ALT (U/L):              
              <Tooltip text="Alanine Aminotransferase (ALT): Normal 0-41 U/L. Another key liver enzyme for detecting liver injury.">
              <AiOutlineInfoCircle className="help-icon" />
              </Tooltip>
            </label>
            <input 
              type="number" 
              name="alt" 
              value={formData.alt} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label>GGT (U/L):              
              <Tooltip text="Gamma-Glutamyl Transferase (GGT): Normal 0-60 U/L. Raised in liver or bile duct disorders.">
              <AiOutlineInfoCircle className="help-icon" />
              </Tooltip>
            </label>
            <input 
              type="number" 
              name="ggt" 
              value={formData.ggt} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label>Triglycerides (mg/dL):              
              <Tooltip text="Triglycerides: Normal <150 mg/dL. Elevated levels are a risk for metabolic disease.">
              <AiOutlineInfoCircle className="help-icon" />
              </Tooltip>
            </label>
            <input 
              type="number" 
              name="triglycerides" 
              value={formData.triglycerides} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label>HDL Cholesterol (mg/dL):              
              <Tooltip text="High-Density Lipoprotein (HDL) Cholesterol: Normal >40 mg/dL (men), >50 mg/dL (women).">
              <AiOutlineInfoCircle className="help-icon" />
              </Tooltip>
            </label>
            <input 
              type="number" 
              name="hdl_cholesterol" 
              value={formData.hdl_cholesterol} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label>HbA1c (%):              
              <Tooltip text="Hemoglobin A1c: Reflects average blood glucose over 2–3 months. Normal <5.7%.">
              <AiOutlineInfoCircle className="help-icon" />
              </Tooltip>
            </label>
            <input 
              type="number" 
              name="hba1c" 
              step="0.1" 
              value={formData.hba1c} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label>Fasting Glucose (mg/dL):              
              <Tooltip text="Fasting Blood Glucose: Normal 70–99 mg/dL. Used for diagnosing diabetes or prediabetes.">
              <AiOutlineInfoCircle className="help-icon" />
              </Tooltip>
            </label>
            <input 
              type="number" 
              name="fasting_glucose" 
              value={formData.fasting_glucose} 
              onChange={handleChange} 
            />
          </div>
          </FormSection>

          <FormSection title="Fibrosis Markers">
          <div>
            <label>FibroScan (kPa):              
              <Tooltip text="FibroScan (kPa): Non-invasive measurement of liver stiffness. Higher values indicate more fibrosis.">
              <AiOutlineInfoCircle className="help-icon" />
              </Tooltip>
            </label>
            <input 
              type="number" 
              name="fibroscan_kpa" 
              value={formData.fibroscan_kpa} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label>Biopsy Result:              
              <Tooltip text="Liver Biopsy Stage (F0–F4): F0 = No fibrosis, F4 = Cirrhosis.">
              <AiOutlineInfoCircle className="help-icon" />
              </Tooltip>
            </label>
            <select name="biopsy_result" value={formData.biopsy_result} onChange={handleChange}>
              <option value="">Select</option>
              <option value="F0">F0</option>
              <option value="F1">F1</option>
              <option value="F2">F2</option>
              <option value="F3">F3</option>
              <option value="F4">F4</option>
            </select>
            </div>

            <div>
            <label>Diagnosis Group:              
              <Tooltip text="Diagnosis classification based on lab and imaging findings.">
              <AiOutlineInfoCircle className="help-icon" />
              </Tooltip>
            </label>
            <select name="diagnosis_group" value={formData.diagnosis_group} onChange={handleChange}>
              <option value="">Select</option>
              <option value="Healthy">Healthy</option>
              <option value="MAFL">MAFL</option>
              <option value="MASH w/o fibrosis">MASH w/o fibrosis</option>
              <option value="MASH w/ fibrosis">MASH w/ fibrosis</option>
            </select>
            </div>

          </FormSection>

          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <button className="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

//export default App;