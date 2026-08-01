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
  marginBottom: "15px",
  borderRadius: "8px",
  border: `1px solid ${theme.border}`,
  boxSizing: "border-box",
  fontSize: "15px",
  background: theme.input,
  color: theme.textMain,
};

export default function ProfileSettings() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const token = localStorage.getItem("access_token");
      const userId = localStorage.getItem("user_id");

      const res = await fetch(`http://127.0.0.1:8000/auth/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        throw new Error("Could not fetch profile");
      }

      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
      setError("Could not load profile. Is the backend running?");
    }
  }

  function handleLogout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "35px" }}>
        <h1 style={{ color: theme.gold, fontSize: "40px" }}>
          👤 Profile & Settings
        </h1>
        <p style={{ color: theme.textSecondary, fontSize: "18px" }}>
          Your account details
        </p>
      </div>

      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
          background: theme.card,
          borderRadius: "18px",
          padding: "30px",
          border: `1px solid ${theme.border}`,
          boxShadow: "0 10px 20px rgba(0,0,0,0.35)",
        }}
      >
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: theme.error,
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "15px",
              border: `1px solid ${theme.error}`,
            }}
          >
            {error}
          </div>
        )}

        {!profile ? (
          <p style={{ color: theme.textSecondary }}>Loading profile...</p>
        ) : (
          <>
            <label style={{ fontWeight: "bold", color: theme.gold, display: "block", marginBottom: "6px" }}>
              Full Name
            </label>
            <input value={profile.full_name} readOnly style={inputStyle} />

            <label style={{ fontWeight: "bold", color: theme.gold, display: "block", marginBottom: "6px" }}>
              Email
            </label>
            <input value={profile.email} readOnly style={inputStyle} />

            <label style={{ fontWeight: "bold", color: theme.gold, display: "block", marginBottom: "6px" }}>
              Phone
            </label>
            <input value={profile.phone || "Not provided"} readOnly style={inputStyle} />

            <label style={{ fontWeight: "bold", color: theme.gold, display: "block", marginBottom: "6px" }}>
              Role
            </label>
            <input value={profile.role} readOnly style={inputStyle} />

            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "14px",
                background: theme.error,
                color: theme.textMain,
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                marginTop: "10px",
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}