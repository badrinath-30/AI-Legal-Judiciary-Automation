"use client";

import { useState } from "react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("User");
  const [policeStation, setPoliceStation] = useState("");
  const [barCouncilId, setBarCouncilId] = useState("");
  const [courtId, setCourtId] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password.trim()
    ) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: name,
            email,
            password,
            phone,
            role,
            police_station: policeStation || null,
            bar_council_id: barCouncilId || null,
            court_id: courtId || null,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          `Account created successfully as ${role}! Redirecting to Login...`
        );

        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setError(
          data.detail || "Registration failed."
        );
      }
    } catch (error) {
      setError(
        "Could not connect to backend. Please make sure FastAPI is running."
      );
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B0F19",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
        fontFamily: "-apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1300px",
          display: "grid",
          gridTemplateColumns: "1fr 1.1fr",
          gap: "50px",
          alignItems: "center",
        }}
      >
        {/* LEFT SIDE - LEGAL AI BRANDING */}
        <div>
          <h1
            style={{
              color: "#F8FAFC",
              fontSize: "56px",
              fontWeight: "800",
              lineHeight: "66px",
              marginBottom: "15px",
              letterSpacing: "-1px"
            }}
          >
            LEGAL AI <span style={{ color: "#3B82F6" }}>2026</span>
            <br />
            PORTAL
          </h1>

          <div
            style={{
              width: "120px",
              height: "5px",
              background: "#D4AF37",
              borderRadius: "10px",
              marginBottom: "25px",
            }}
          />

          <h2
            style={{
              color: "#CBD5E1",
              fontSize: "22px",
              fontWeight: "600",
              marginBottom: "15px",
            }}
          >
            National Judiciary & Legal Automation System
          </h2>

          <p
            style={{
              color: "#94A3B8",
              fontSize: "16px",
              lineHeight: "28px",
              marginBottom: "35px",
            }}
          >
            Multi-Role Secure Judiciary Access • Real-time Auditing • AI Integration
          </p>

          <div
            style={{
              background: "rgba(17, 24, 39, 0.75)",
              padding: "25px",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)"
            }}
          >
            <p style={{ color: "#60A5FA", fontSize: "16px", marginBottom: "14px", fontWeight: "600" }}>
              👤 Citizens: Track Cases, Book Advocates, View Timelines
            </p>
            <p style={{ color: "#F87171", fontSize: "16px", marginBottom: "14px", fontWeight: "600" }}>
              🚔 Police: Register & Manage FIRs and Investigations
            </p>
            <p style={{ color: "#FBBF24", fontSize: "16px", marginBottom: "14px", fontWeight: "600" }}>
              ⚖️ Advocates: Manage Consultations & Assigned Hearings
            </p>
            <p style={{ color: "#34D399", fontSize: "16px", marginBottom: "14px", fontWeight: "600" }}>
              🏛️ Court Management: Schedule Proceedings & Upload Judgements
            </p>
            <p style={{ color: "#C084FC", fontSize: "16px", fontWeight: "600" }}>
              🛡️ Super Admin: System Monitoring & Audit Compliance
            </p>
          </div>
        </div>

        {/* RIGHT SIDE - REGISTER CARD */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.85)",
            padding: "45px",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            backdropFilter: "blur(16px)"
          }}
        >
          <h1
            style={{
              color: "#F8FAFC",
              fontSize: "36px",
              marginBottom: "8px",
              fontWeight: "700",
            }}
          >
            Create Your Account
          </h1>

          <div
            style={{
              width: "70px",
              height: "4px",
              background: "#3B82F6",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          />

          {/* ROLE SELECTOR */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#F8FAFC", fontWeight: "600", fontSize: "14px", display: "block", marginBottom: "8px" }}>
              Select System Access Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                background: "#0B0F19",
                color: "#60A5FA",
                border: "1px solid #3B82F6",
                borderRadius: "12px",
                outline: "none",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <option value="User">👤 USER (Citizen / Petitioner / Respondent)</option>
              <option value="Police">🚔 POLICE (Station Officer / Investigator)</option>
              <option value="Advocate">⚖️ ADVOCATE (Legal Representative)</option>
              <option value="Court Management">🏛️ COURT MANAGEMENT (Judiciary Staff)</option>
              <option value="Super Admin">🛡️ SUPER ADMIN (System Administrator)</option>
            </select>
          </div>

          {/* FULL NAME */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ color: "#CBD5E1", fontWeight: "600", fontSize: "14px" }}>Full Name *</label>
            <input
              type="text"
              placeholder="Enter full legal name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "13px",
                marginTop: "6px",
                background: "#0B0F19",
                color: "#F8FAFC",
                border: "1px solid #334155",
                borderRadius: "12px",
                outline: "none",
                fontSize: "14px",
              }}
            />
          </div>

          {/* EMAIL & PHONE GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
            <div>
              <label style={{ color: "#CBD5E1", fontWeight: "600", fontSize: "14px" }}>Email *</label>
              <input
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px",
                  marginTop: "6px",
                  background: "#0B0F19",
                  color: "#F8FAFC",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  outline: "none",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <label style={{ color: "#CBD5E1", fontWeight: "600", fontSize: "14px" }}>Phone Number *</label>
              <input
                type="text"
                placeholder="+91 XXXXX XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px",
                  marginTop: "6px",
                  background: "#0B0F19",
                  color: "#F8FAFC",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  outline: "none",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          {/* DYNAMIC ROLE SPECIFIC INPUTS */}
          {role === "Police" && (
            <div style={{ marginBottom: "15px" }}>
              <label style={{ color: "#F87171", fontWeight: "600", fontSize: "14px" }}>Police Station Code / Jurisdiction *</label>
              <input
                type="text"
                placeholder="e.g. Jubilee Hills Station PS-04"
                value={policeStation}
                onChange={(e) => setPoliceStation(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px",
                  marginTop: "6px",
                  background: "#0B0F19",
                  color: "#F8FAFC",
                  border: "1px solid #EF4444",
                  borderRadius: "12px",
                  outline: "none",
                  fontSize: "14px",
                }}
              />
            </div>
          )}

          {role === "Advocate" && (
            <div style={{ marginBottom: "15px" }}>
              <label style={{ color: "#FBBF24", fontWeight: "600", fontSize: "14px" }}>Bar Council Enrolment Number *</label>
              <input
                type="text"
                placeholder="e.g. TS/1042/2018"
                value={barCouncilId}
                onChange={(e) => setBarCouncilId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px",
                  marginTop: "6px",
                  background: "#0B0F19",
                  color: "#F8FAFC",
                  border: "1px solid #F59E0B",
                  borderRadius: "12px",
                  outline: "none",
                  fontSize: "14px",
                }}
              />
            </div>
          )}

          {role === "Court Management" && (
            <div style={{ marginBottom: "15px" }}>
              <label style={{ color: "#34D399", fontWeight: "600", fontSize: "14px" }}>Court Designation / ID *</label>
              <input
                type="text"
                placeholder="e.g. High Court Reg-HC09"
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px",
                  marginTop: "6px",
                  background: "#0B0F19",
                  color: "#F8FAFC",
                  border: "1px solid #10B981",
                  borderRadius: "12px",
                  outline: "none",
                  fontSize: "14px",
                }}
              />
            </div>
          )}

          {/* PASSWORD */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#CBD5E1", fontWeight: "600", fontSize: "14px" }}>Password *</label>
            <div style={{ position: "relative", marginTop: "6px" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px",
                  paddingRight: "50px",
                  background: "#0B0F19",
                  color: "#F8FAFC",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  outline: "none",
                  fontSize: "14px",
                }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#CBD5E1",
                  fontSize: "16px",
                  userSelect: "none",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          {/* MESSAGES */}
          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#FCA5A5", padding: "12px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #EF4444", fontSize: "14px" }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{ background: "rgba(16, 185, 129, 0.15)", color: "#6EE7B7", padding: "12px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #10B981", fontSize: "14px" }}>
              ✅ {success}
            </div>
          )}

          {/* BUTTON */}
          <button
            onClick={handleRegister}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              background: loading ? "#475569" : "#3B82F6",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "700",
              boxShadow: "0 8px 20px rgba(59, 130, 246, 0.4)",
              transition: "0.2s"
            }}
          >
            {loading ? "Registering..." : `REGISTER AS ${role.toUpperCase()}`}
          </button>

          <p style={{ marginTop: "20px", textAlign: "center", color: "#CBD5E1", fontSize: "14px" }}>
            Already registered?{" "}
            <a href="/login" style={{ color: "#3B82F6", textDecoration: "none", fontWeight: "700" }}>
              Sign In Here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}