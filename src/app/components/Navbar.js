"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function Navbar() {
  const [caseOpen, setCaseOpen] = useState(false);
  const [firOpen, setFirOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("User");
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    setName(localStorage.getItem("user_name") || "User");
    setRole(localStorage.getItem("user_role") || "User");

    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  const initial = name ? name.charAt(0).toUpperCase() : "U";

  // Check permissions
  const canAddCase = role === "Police" || role === "Court Management" || role === "Super Admin";
  const canAddFIR = role === "Police" || role === "Super Admin";

  const getRoleBadgeStyle = () => {
    switch (role) {
      case "Police":
        return { background: "rgba(239, 68, 68, 0.2)", color: "#F87171", border: "1px solid #EF4444" };
      case "Advocate":
        return { background: "rgba(245, 158, 11, 0.2)", color: "#FBBF24", border: "1px solid #F59E0B" };
      case "Court Management":
        return { background: "rgba(16, 185, 129, 0.2)", color: "#34D399", border: "1px solid #10B981" };
      case "Super Admin":
        return { background: "rgba(168, 85, 247, 0.2)", color: "#C084FC", border: "1px solid #A855F7" };
      default:
        return { background: "rgba(59, 130, 246, 0.2)", color: "#60A5FA", border: "1px solid #3B82F6" };
    }
  };

  const linkStyle = {
    color: "#E2E8F0",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer",
    transition: "color 0.2s"
  };

  const dropdownStyle = {
    position: "absolute",
    top: "45px",
    left: "0",
    background: "#1E293B",
    minWidth: "220px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    overflow: "hidden",
    zIndex: 1000,
    border: "1px solid #334155"
  };

  const itemStyle = {
    display: "block",
    padding: "12px 18px",
    color: "#F8FAFC",
    textDecoration: "none",
    fontWeight: "600",
    borderBottom: "1px solid #334155",
    fontSize: "14px"
  };

  return (
    <nav
      style={{
        background: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(12px)",
        padding: "16px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
      }}
    >
      {/* Logo & Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <h2 style={{ color: "white", margin: 0, fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            ⚖️ Legal<span style={{ color: "#3B82F6" }}>AI</span>
          </h2>
        </Link>
        {mounted && (
          <span
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
              ...getRoleBadgeStyle()
            }}
          >
            {role}
          </span>
        )}
      </div>

      {/* Navigation Links */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          alignItems: "center",
        }}
      >
        {/* Home */}
        <Link href="/" style={linkStyle}>
          🏠 Home
        </Link>

        {/* Dashboard */}
        <Link href="/dashboard" style={linkStyle}>
          📊 Dashboard
        </Link>

        {/* Super Admin Dashboard if Admin */}
        {role === "Super Admin" && (
          <Link href="/admin-dashboard" style={{ ...linkStyle, color: "#C084FC" }}>
            🛡️ Admin Control
          </Link>
        )}

        {/* Police Command Center */}
        {(role === "Police" || role === "Super Admin") && (
          <Link href="/police-dashboard" style={{ ...linkStyle, color: "#60A5FA" }}>
            🚔 Police Portal
          </Link>
        )}

        {/* Court Management Portal */}
        {(role === "Court Management" || role === "Super Admin") && (
          <Link href="/court-dashboard" style={{ ...linkStyle, color: "#A78BFA" }}>
            🏛️ Court Portal
          </Link>
        )}

        <div style={{ position: "relative" }}>
          <span
            style={linkStyle}
            onClick={() => {
              setCaseOpen(!caseOpen);
              setFirOpen(false);
            }}
          >
            📂 Cases {caseOpen ? "▲" : "▼"}
          </span>

          {caseOpen && (
            <div style={dropdownStyle}>
              <Link href="/case-tracking" style={itemStyle}>
                📋 Case Tracking
              </Link>
              {canAddCase && (
                <Link href="/add-case" style={{ ...itemStyle, color: "#34D399" }}>
                  ➕ Register New Case
                </Link>
              )}
            </div>
          )}
        </div>

        {/* FIR */}
        <div style={{ position: "relative" }}>
          <span
            style={linkStyle}
            onClick={() => {
              setFirOpen(!firOpen);
              setCaseOpen(false);
            }}
          >
            🚔 FIR {firOpen ? "▲" : "▼"}
          </span>

          {firOpen && (
            <div style={dropdownStyle}>
              <Link href="/fir-tracking" style={itemStyle}>
                🔍 FIR Tracking
              </Link>
              {canAddFIR && (
                <Link href="/add-fir" style={{ ...itemStyle, color: "#F87171" }}>
                  ➕ Register New FIR
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Advocates */}
        <Link href="/advocate-booking" style={linkStyle}>
          ⚖️ Advocates
        </Link>

        {/* Documents */}
        <Link href="/legal-documents" style={linkStyle}>
          📄 Documents
        </Link>

        {/* AI Assistant */}
        <Link href="/ai-assistant" style={linkStyle}>
          🤖 AI Assistant
        </Link>

        {/* Contact */}
        <Link href="/contact" style={linkStyle}>
          📞 Contact
        </Link>

        {/* Profile Dropdown */}
        {mounted && (
          <div ref={profileRef} style={{ position: "relative" }}>
            <div
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "16px",
                cursor: "pointer",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
              }}
            >
              {initial}
            </div>

            {profileOpen && (
              <div style={{ ...dropdownStyle, left: "auto", right: 0, minWidth: "240px" }}>
                <div
                  style={{
                    padding: "14px 18px",
                    color: "#F8FAFC",
                    fontWeight: "700",
                    borderBottom: "1px solid #334155",
                    background: "rgba(15, 23, 42, 0.5)"
                  }}
                >
                  <div style={{ fontSize: "15px" }}>{name}</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "normal", marginTop: "2px" }}>
                    Role: {role}
                  </div>
                </div>

                <Link href="/profile" style={itemStyle}>
                  👤 Profile & Settings
                </Link>

                <div
                  onClick={handleLogout}
                  style={{
                    padding: "12px 18px",
                    color: "#F87171",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}
                >
                  🚪 Sign Out
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}