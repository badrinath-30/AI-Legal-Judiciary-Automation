"use client";

import { useState, useEffect } from "react";

export default function AddCase() {
  const [role, setRole] = useState("User");

  useEffect(() => {
    setRole(localStorage.getItem("user_role") || "User");
  }, []);

  if (role === "User") {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0F19", padding: "50px", fontFamily: "-apple-system, sans-serif", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="glass-card" style={{ maxWidth: "600px", padding: "40px", textAlign: "center", border: "1px solid #EF4444" }}>
          <h1 style={{ color: "#F87171", fontSize: "32px", marginBottom: "15px" }}>🚫 Access Restricted</h1>
          <p style={{ color: "#CBD5E1", fontSize: "16px", lineHeight: "26px", marginBottom: "25px" }}>
            Under National Judiciary Access Regulations, citizens with <strong>USER</strong> role cannot directly register official court cases or edit judicial records.
          </p>
          <div style={{ background: "#0F172A", padding: "15px", borderRadius: "12px", border: "1px solid #334155", color: "#60A5FA", fontSize: "14px" }}>
            Please contact your Police Station Officer, Legal Advocate, or Court Authority to file official proceedings.
          </div>
        </div>
      </div>
    );
  }


  const [form, setForm] = useState({
    case_number: "",
    case_title: "",
    petitioner: "",
    respondent: "",
    court_name: "",
    judge_name: "",
    advocate_assigned: "",
    case_type: "Civil",
    filing_date: "",
    next_hearing_date: "",
    priority: "Medium",
    status: "Pending",
  });


  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
  setLoading(true);
  setMessage("");
  setError("");

  try {

    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please login first.");
      setLoading(false);
      return;
    }

    const res = await fetch(
      "http://127.0.0.1:8000/add-case",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      }
    );

    const data = await res.json();

    if (res.ok) {
      setMessage("✅ Case added successfully!");

      setForm({
        case_number: "",
        case_title: "",
        petitioner: "",
        respondent: "",
        court_name: "",
        judge_name: "",
        advocate_assigned: "",
        case_type: "Civil",
        filing_date: "",
        next_hearing_date: "",
        priority: "Medium",
        status: "Pending",
      });

    } else {
      setError(data.detail || "Unable to add case.");
    }

  } catch (err) {
    setError("Backend server is not running.");
  }

  setLoading(false);
};

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px",
    boxSizing: "border-box",
  };

  return (
  <div
    style={{
      minHeight: "100vh",
      background: "#0F172A",
      padding: "40px",
      fontFamily: "Arial, sans-serif",
    }}
  >
    <div
      style={{
        maxWidth: "1200px",
        margin: "auto",
      }}
    >
      {/* HEADING */}

      <div
        style={{
          textAlign: "center",
          marginBottom: "40px",
        }}
      >
        <h1
          style={{
            color: "#F8FAFC",
            fontSize: "48px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          ⚖️ CREATE LEGAL CASE
        </h1>

        <div
          style={{
            width: "120px",
            height: "5px",
            background: "#D4AF37",
            margin: "15px auto",
            borderRadius: "10px",
          }}
        />

        <p
          style={{
            color: "#CBD5E1",
            fontSize: "18px",
          }}
        >
          AI Powered Legal & Judiciary Automation System
        </p>
      </div>
      {/* MAIN FORM CARD */}

<div
  style={{
    background: "#1E293B",
    padding: "40px",
    borderRadius: "25px",
    border: "1px solid #334155",
    boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
  }}
>
  <h2
    style={{
      color: "#F8FAFC",
      marginBottom: "30px",
      textAlign: "center",
      fontSize: "30px",
    }}
  >
    📁 Case Details
  </h2>

  {/* FORM GRID */}

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(350px, 1fr))",
      gap: "25px",
    }}
  >{/* CASE NUMBER */}

<input
  name="case_number"
  placeholder="📌 Case Number"
  value={form.case_number}
  onChange={handleChange}
  style={inputStyle}
/>

{/* CASE TITLE */}

<input
  name="case_title"
  placeholder="⚖️ Case Title"
  value={form.case_title}
  onChange={handleChange}
  style={inputStyle}
/>

{/* PETITIONER */}

<input
  name="petitioner"
  placeholder="👤 Petitioner Name"
  value={form.petitioner}
  onChange={handleChange}
  style={inputStyle}
/>

{/* RESPONDENT */}

<input
  name="respondent"
  placeholder="👥 Respondent Name"
  value={form.respondent}
  onChange={handleChange}
  style={inputStyle}
/>

{/* COURT NAME */}

<input
  name="court_name"
  placeholder="🏛️ Court Name"
  value={form.court_name}
  onChange={handleChange}
  style={inputStyle}
/>

{/* JUDGE NAME */}

<input
  name="judge_name"
  placeholder="👨‍⚖️ Judge Name"
  value={form.judge_name}
  onChange={handleChange}
  style={inputStyle}
/>
{/* ADVOCATE ASSIGNED */}

<input
  name="advocate_assigned"
  placeholder="👨‍💼 Advocate Assigned"
  value={form.advocate_assigned}
  onChange={handleChange}
  style={inputStyle}
/>

{/* CASE TYPE */}

<select
  name="case_type"
  value={form.case_type}
  onChange={handleChange}
  style={inputStyle}
>
  <option>Civil</option>
  <option>Criminal</option>
  <option>Property</option>
  <option>Cyber Crime</option>
  <option>Family</option>
  <option>Consumer</option>
</select>

{/* FILING DATE */}

<div>
  <label
    style={{
      color: "#CBD5E1",
      fontSize: "14px",
      marginBottom: "8px",
      display: "block",
    }}
  >
    📅 Filing Date
  </label>

  <input
    type="date"
    name="filing_date"
    value={form.filing_date}
    onChange={handleChange}
    style={inputStyle}
  />
</div>

{/* NEXT HEARING DATE */}

<div>
  <label
    style={{
      color: "#CBD5E1",
      fontSize: "14px",
      marginBottom: "8px",
      display: "block",
    }}
  >
    🔔 Next Hearing Date
  </label>

  <input
    type="date"
    name="next_hearing_date"
    value={form.next_hearing_date}
    onChange={handleChange}
    style={inputStyle}
  />
</div>

{/* PRIORITY */}

<select
  name="priority"
  value={form.priority}
  onChange={handleChange}
  style={inputStyle}
>
  <option>Low</option>
  <option>Medium</option>
  <option>High</option>
</select>

{/* CASE STATUS */}

<select
  name="status"
  value={form.status}
  onChange={handleChange}
  style={inputStyle}
>
  <option>Pending</option>
  <option>In Progress</option>
  <option>Closed</option>
</select>
{/* CLOSE THE GRID */}

</div>


{/* SUCCESS MESSAGE */}

{message && (
  <div
    style={{
      marginTop: "30px",
      background: "#064E3B",
      color: "#6EE7B7",
      padding: "18px",
      borderRadius: "15px",
      border: "1px solid #10B981",
      fontSize: "16px",
      fontWeight: "600",
    }}
  >
    {message}
  </div>
)}


{/* ERROR MESSAGE */}

{error && (
  <div
    style={{
      marginTop: "30px",
      background: "#7F1D1D",
      color: "#FCA5A5",
      padding: "18px",
      borderRadius: "15px",
      border: "1px solid #EF4444",
      fontSize: "16px",
      fontWeight: "600",
    }}
  >
    {error}
  </div>
)}


{/* ADD CASE BUTTON */}

<button
  onClick={handleSubmit}
  disabled={loading}
  style={{
    width: "100%",
    padding: "18px",
    marginTop: "35px",
    background: loading ? "#475569" : "#4F46E5",
    color: "white",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "700",
    boxShadow:
      "0 12px 25px rgba(79,70,229,0.40)",
    transition: "0.3s",
  }}
>
  {loading
    ? "Creating Legal Case..."
    : "⚖️ CREATE LEGAL CASE"}
</button>



{/* FOOTER TEXT */}

<p
  style={{
    marginTop: "25px",
    textAlign: "center",
    color: "#94A3B8",
    fontSize: "15px",
  }}
>
  Securely register and manage your legal cases
  using the Legal AI Platform.
</p>


{/* CLOSE FORM CARD */}

</div>


{/* CLOSE MAIN CONTAINER */}

</div>


{/* CLOSE PAGE */}

</div>
);
}