"use client";

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

const FEATURES = [
  {
    icon: "🤖",
    title: "AI Legal Assistant",
    desc: "Get instant answers to legal questions, powered by Groq LLM and real legal document retrieval (RAG).",
  },
  {
    icon: "🚔",
    title: "FIR Tracking",
    desc: "Register and track FIR status in real time, straight from the police record system.",
  },
  {
    icon: "📂",
    title: "Case Management",
    desc: "Track case status, hearings, and history for every case assigned to you or your advocate.",
  },
  {
    icon: "⚖️",
    title: "Advocate Booking",
    desc: "Book appointments with experienced advocates and get instant SMS/voice confirmation.",
  },
  {
    icon: "📄",
    title: "Legal Documents",
    desc: "Upload, organize, and access all your important legal documents in one secure place.",
  },
  {
    icon: "🔒",
    title: "Secure & Role-Based",
    desc: "Every action is protected with JWT authentication and role-based access control.",
  },
];

export default function Home() {
  return (
    <div
      style={{
        background: theme.background,
        minHeight: "100vh",
        fontFamily: "Arial",
        color: theme.textMain,
      }}
    >
      {/* Simple top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 60px",
        }}
      >
        <div style={{ fontSize: "24px", fontWeight: "bold", color: theme.gold }}>
          ⚖️ LegalAI
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <a href="/login" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "10px 22px",
                background: "transparent",
                border: `1px solid ${theme.border}`,
                color: theme.textMain,
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
              }}
            >
              Login
            </button>
          </a>
          <a href="/register" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "10px 22px",
                background: theme.primary,
                border: "none",
                color: theme.textMain,
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "bold",
              }}
            >
              Register
            </button>
          </a>
        </div>
      </div>

      {/* Hero section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "40px",
          padding: "60px 60px 100px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ flex: 1, maxWidth: "560px" }}>
          <div
            style={{
              display: "inline-block",
              padding: "8px 18px",
              borderRadius: "20px",
              background: "rgba(212, 175, 55, 0.12)",
              border: `1px solid ${theme.gold}`,
              color: theme.gold,
              fontSize: "13px",
              fontWeight: "bold",
              marginBottom: "28px",
              letterSpacing: "0.05em",
            }}
          >
            AI-POWERED LEGAL & JUDICIARY AUTOMATION
          </div>

          <h1
            style={{
              fontSize: "50px",
              lineHeight: 1.15,
              margin: "0 0 24px",
            }}
          >
            Legal help, powered by{" "}
            <span style={{ color: theme.gold }}>AI</span>, available{" "}
            <span style={{ color: theme.primary }}>24/7</span>
          </h1>

          <p
            style={{
              fontSize: "18px",
              color: theme.textSecondary,
              lineHeight: 1.6,
              marginBottom: "40px",
            }}
          >
            File FIRs, track cases, book advocates, and get instant legal
            guidance from an AI assistant trained on real Indian law —
            all in one secure platform.
          </p>

          <div style={{ display: "flex", gap: "18px" }}>
            <a href="/register" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "16px 34px",
                  background: theme.primary,
                  border: "none",
                  color: theme.textMain,
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "17px",
                  fontWeight: "bold",
                }}
              >
                Get Started Free
              </button>
            </a>
            <a href="/login" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "16px 34px",
                  background: "transparent",
                  border: `1px solid ${theme.border}`,
                  color: theme.textMain,
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "17px",
                }}
              >
                I Already Have an Account
              </button>
            </a>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            width="380"
            alt="Legal AI"
            style={{ filter: "drop-shadow(0 0 40px rgba(212, 175, 55, 0.25))" }}
          />
        </div>
      </div>

      {/* Features grid */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 40px 100px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "32px",
            color: theme.gold,
            marginBottom: "50px",
          }}
        >
          Everything you need, in one place
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: "16px",
                padding: "30px",
                cursor: "default",
                transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = `0 12px 30px rgba(212, 175, 55, 0.2)`;
                e.currentTarget.style.borderColor = theme.gold;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = theme.border;
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "16px" }}>{f.icon}</div>
              <h3 style={{ color: theme.textMain, marginBottom: "10px", fontSize: "19px" }}>
                {f.title}
              </h3>
              <p style={{ color: theme.textSecondary, fontSize: "14.5px", lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px 90px",
          background: theme.card,
          borderTop: `1px solid ${theme.border}`,
        }}
      >
        <h2 style={{ fontSize: "28px", marginBottom: "20px" }}>
          Ready to get started?
        </h2>
        <a href="/register" style={{ textDecoration: "none" }}>
          <button
            style={{
              padding: "16px 40px",
              background: theme.gold,
              border: "none",
              color: theme.background,
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "17px",
              fontWeight: "bold",
            }}
          >
            Create Your Free Account
          </button>
        </a>

        <p style={{ marginTop: "40px", color: theme.textSecondary, fontSize: "13px" }}>
          ⚖️ LegalAI — AI Powered Legal & Judiciary Automation System
        </p>
      </div>
    </div>
  );
}