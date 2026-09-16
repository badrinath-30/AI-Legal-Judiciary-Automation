"use client";

import { useState, useEffect } from "react";

const cardStyle = {
  background: "#1E293B",
  borderRadius: "20px",
  padding: "25px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  border: "1px solid #334155",
};

const buttonStyle = {
  width: "100%",
  padding: "15px",
  background: "#4F46E5",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "14px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "700",
  boxShadow: "0 8px 20px rgba(79,70,229,0.30)",
};

export default function Dashboard() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [userRole, setUserRole] = useState("User");
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    setUserRole(localStorage.getItem("user_role") || "User");
    setUserName(localStorage.getItem("user_name") || "User");
  }, []);

  const modules = [
    {
      title: "⚖️ Track Cases",
      description: "Monitor case progress, timeline & hearing updates.",
      button: "🔍 Track Cases",
      link: "/case-tracking",
    },
    {
      title: "📌 Track FIRs",
      description: "Track official FIR status and investigation stage.",
      button: "📋 Track FIRs",
      link: "/fir-tracking",
    },
    {
      title: "👨‍⚖️ Book Advocate",
      description: "Book verified legal counsel for consultation.",
      button: "📅 Book Advocate",
      link: "/advocate-booking",
    },
    {
      title: "📄 Download Documents",
      description: "Access and download legal documents & affidavits.",
      button: "📂 Manage Documents",
      link: "/legal-documents",
    },
    {
      title: "🤖 AI Legal Assistance",
      description: "24/7 AI-powered legal RAG consultation.",
      button: "💬 AI Assistant",
      link: "/ai-assistant",
    },
    {
      title: "🔔 Notifications",
      description: "View real-time hearing alerts and SMS status.",
      button: "🔔 View Notifications",
      link: "/notifications",
    },
    {
      title: "📚 Legal Awareness",
      description: "Learn fundamental legal rights, IPC & CrPC laws.",
      button: "📖 Legal Awareness",
      link: "/legal-awareness",
    },
    {
      title: "📞 Contact Support",
      description: "Get assistance from legal helpline & support.",
      button: "☎️ Contact Support",
      link: "/contact",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F172A",
        padding: "40px",
        fontFamily: "-apple-system, sans-serif",
      }}
    >
      {/* Header Section */}
      <div style={{ textAlign: "center", marginBottom: "35px" }}>
        <h1
          style={{
            color: "#F8FAFC",
            fontSize: "44px",
            marginBottom: "10px",
            letterSpacing: "1px",
            fontWeight: "800",
          }}
        >
          ⚖️ LEGAL AI PORTAL
        </h1>

        <div
          style={{
            width: "100px",
            height: "4px",
            background: "#D4AF37",
            margin: "15px auto",
            borderRadius: "10px",
          }}
        />

        <p style={{ color: "#CBD5E1", fontSize: "18px", marginBottom: "6px" }}>
          National Judiciary & Legal Automation System
        </p>

        <p style={{ color: "#94A3B8", fontSize: "15px" }}>
          Welcome, <strong>{userName}</strong> ({userRole})
        </p>
      </div>

      {/* ROLE SPECIFIC DASHBOARD PROMPT BANNER */}
      {userRole !== "User" && (
        <div
          style={{
            background: "linear-gradient(135deg, #1E1B4B 0%, #111827 100%)",
            border: "1px solid #6366F1",
            borderRadius: "20px",
            padding: "25px 35px",
            maxWidth: "900px",
            margin: "0 auto 35px auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 15px 35px rgba(99,102,241,0.2)",
          }}
        >
          <div>
            <h3 style={{ color: "#F8FAFC", margin: "0 0 6px 0", fontSize: "22px" }}>
              👑 {userRole} Access Granted
            </h3>
            <p style={{ color: "#CBD5E1", margin: 0, fontSize: "14px" }}>
              Switch to your specialized {userRole} control module for administrative management.
            </p>
          </div>
          <a
            href={
              userRole === "Police"
                ? "/police-dashboard"
                : userRole === "Advocate"
                ? "/advocate-dashboard"
                : userRole === "Court Management"
                ? "/court-dashboard"
                : userRole === "Super Admin"
                ? "/admin-dashboard"
                : "/dashboard"
            }
            style={{ textDecoration: "none" }}
          >
            <button
              style={{
                padding: "12px 24px",
                background: "#6366F1",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(99,102,241,0.4)",
              }}
            >
              Open {userRole} Panel →
            </button>
          </a>
        </div>
      )}

      {/* Legal Services Section */}
      <div
        style={{
          background: "#111827",
          borderRadius: "24px",
          padding: "35px",
          boxShadow: "0 15px 35px rgba(0,0,0,0.30)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#F8FAFC",
            marginBottom: "10px",
            fontSize: "28px",
            fontWeight: "700",
          }}
        >
          🚀 System Services & Features
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#94A3B8",
            marginBottom: "35px",
            fontSize: "15px",
          }}
        >
          Access all judiciary tools, case tracking, and AI services instantly.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "25px",
          }}
        >
          {modules.map((module, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                ...cardStyle,
                transform:
                  hoveredCard === index
                    ? "translateY(-8px) scale(1.02)"
                    : "translateY(0px)",
                transition: "all 0.3s ease-in-out",
                boxShadow:
                  hoveredCard === index
                    ? "0 20px 40px rgba(79,70,229,0.45)"
                    : "0 10px 25px rgba(0,0,0,0.25)",
                border:
                  hoveredCard === index
                    ? "1px solid #6366F1"
                    : "1px solid #334155",
                cursor: "pointer",
              }}
            >
              <div>
                <h3
                  style={{
                    color: "#F8FAFC",
                    marginBottom: "12px",
                    fontSize: "20px",
                    fontWeight: "700",
                  }}
                >
                  {module.title}
                </h3>

                <p
                  style={{
                    color: "#CBD5E1",
                    lineHeight: "26px",
                    marginBottom: "20px",
                    fontSize: "14px",
                  }}
                >
                  {module.description}
                </p>
              </div>

              <a href={module.link} style={{ textDecoration: "none" }}>
                <button
                  style={{
                    ...buttonStyle,
                    background:
                      hoveredCard === index ? "#6366F1" : "#4F46E5",
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  {module.button}
                </button>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* AI Assistant Banner */}
      <div
        style={{
          marginTop: "40px",
          background: "#111827",
          padding: "40px",
          borderRadius: "24px",
          textAlign: "center",
          boxShadow: "0 15px 35px rgba(0,0,0,0.30)",
        }}
      >
        <h2 style={{ color: "#F8FAFC", marginBottom: "15px", fontSize: "30px" }}>
          💡 Need AI Legal Assistance?
        </h2>

        <p
          style={{
            color: "#CBD5E1",
            lineHeight: "30px",
            fontSize: "16px",
            marginBottom: "25px",
            maxWidth: "800px",
            margin: "0 auto 25px auto",
          }}
        >
          Our RAG AI-powered legal assistant is available 24/7 to analyze case precedents, answer Indian legal questions, and summarize court documents.
        </p>

        <a href="/ai-assistant" style={{ textDecoration: "none" }}>
          <button style={{ ...buttonStyle, width: "240px" }}>
            💬 Open AI Assistant
          </button>
        </a>
      </div>
    </div>
  );
}
