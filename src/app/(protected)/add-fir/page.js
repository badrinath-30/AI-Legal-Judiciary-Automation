"use client";

import { useState, useEffect } from "react";

// Theme colors defined directly here - no external file needed
const theme = {
  background: "#0F172A",
  card: "#1E293B",
  input: "#334155",
  border: "#475569",
  primary: "#6366F1",
  primaryHover: "#4F46E5",
  gold: "#D4AF37",
  textMain: "#F8FAFC",
  textSecondary: "#CBD5E1",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "18px",
  borderRadius: "8px",
  border: `1px solid ${theme.border}`,
  fontSize: "15px",
  boxSizing: "border-box",
  background: theme.input,
  color: theme.textMain,
};

const labelStyle = {
  fontWeight: "bold",
  color: theme.gold,
  display: "block",
  marginBottom: "6px",
};

export default function AddFIR() {
  const [role, setRole] = useState("User");
  const [firNumber, setFirNumber] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [complaintType, setComplaintType] = useState("");
  const [dateRegistered, setDateRegistered] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState("Pending");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setRole(localStorage.getItem("user_role") || "User");
  }, []);

  if (role === "User") {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0F19", padding: "50px", fontFamily: "-apple-system, sans-serif", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="glass-card" style={{ maxWidth: "600px", padding: "40px", textAlign: "center", border: "1px solid #EF4444" }}>
          <h1 style={{ color: "#F87171", fontSize: "32px", marginBottom: "15px" }}>🚫 Access Restricted</h1>
          <p style={{ color: "#CBD5E1", fontSize: "16px", lineHeight: "26px", marginBottom: "25px" }}>
            Under Police & Judiciary Access Regulations, citizens with <strong>USER</strong> role cannot directly register official FIRs in the system.
          </p>
          <div style={{ background: "#0F172A", padding: "15px", borderRadius: "12px", border: "1px solid #334155", color: "#F87171", fontSize: "14px" }}>
            Please visit your local Police Station Officer or Station House Officer (SHO) to file an official FIR complaint.
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (
      !firNumber.trim() ||
      !policeStation.trim() ||
      !complaintType.trim()
    ) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://127.0.0.1:8000/add-fir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    body: JSON.stringify({
    fir_number: firNumber,
    police_station: policeStation,
    complaint_type: complaintType,
    date_registered: dateRegistered,
    status: status,
  }),
});

      const data = await response.json();

      if (response.ok) {
        setSuccess("✅ FIR Added Successfully!");

        setFirNumber("");
        setPoliceStation("");
        setComplaintType("");
        setDateRegistered(new Date().toISOString().split("T")[0]);
        setStatus("Pending");
      } else {
        setError(data.detail || "Failed to add FIR.");
      }
    } catch (err) {
      setError("Could not connect to backend server.");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        background: theme.background,
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          maxWidth: "650px",
          margin: "auto",
          background: theme.card,
          padding: "35px",
          borderRadius: "15px",
          border: `1px solid ${theme.border}`,
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: theme.gold,
            marginBottom: "10px",
          }}
        >
          Add New FIR
        </h1>

        <p
          style={{
            textAlign: "center",
            color: theme.textSecondary,
            marginBottom: "30px",
          }}
        >
          Register a new FIR into the Legal AI System
        </p>

        <label style={labelStyle}>FIR Number</label>

        <input
          type="text"
          placeholder="Ex: FIR2026/4001"
          value={firNumber}
          onChange={(e) => setFirNumber(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Police Station</label>

        <input
          type="text"
          placeholder="Enter Police Station"
          value={policeStation}
          onChange={(e) => setPoliceStation(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Complaint Type</label>

        <select
          value={complaintType}
          onChange={(e) => setComplaintType(e.target.value)}
          style={inputStyle}
        >
          <option value="">-- Select Complaint Type --</option>
          <option value="Cyber Crime">Cyber Crime</option>
          <option value="Theft">Theft</option>
          <option value="Fraud">Fraud</option>
          <option value="Domestic Violence">Domestic Violence</option>
          <option value="Property Dispute">Property Dispute</option>
          <option value="Kidnapping">Kidnapping</option>
          <option value="Assault">Assault</option>
          <option value="Murder">Murder</option>
          <option value="Traffic Violation">Traffic Violation</option>
          <option value="Others">Others</option>
        </select>

        <label style={labelStyle}>Date Registered</label>

        <input
          type="date"
          value={dateRegistered}
          onChange={(e) => setDateRegistered(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Status</label>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={inputStyle}
        >
          <option value="Pending">Pending</option>
          <option value="Investigation In Progress">
            Investigation In Progress
          </option>
          <option value="Case Closed">Case Closed</option>
        </select>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: theme.error,
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "15px",
              border: `1px solid ${theme.error}`,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              color: theme.success,
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "15px",
              border: `1px solid ${theme.success}`,
            }}
          >
            {success}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: loading ? theme.border : theme.primary,
            color: theme.textMain,
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "0.3s",
          }}
        >
          {loading ? "Adding FIR..." : "Add FIR"}
        </button>
      </div>
    </div>
  );
}