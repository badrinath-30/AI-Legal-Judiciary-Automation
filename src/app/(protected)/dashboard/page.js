"use client";

import { useState } from "react";
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

export default function UserDashboard() {
  const [hoveredCard, setHoveredCard] = useState(null);
const modules = [
  {
    title: "📁 Add New Case",
    description: "Create and manage legal case records.",
    button: "➕ Create Case",
    link: "/add-case",
  },
  {
    title: "⚖️ Track Cases",
    description: "Monitor case progress and hearing details.",
    button: "🔍 View Cases",
    link: "/case-tracking",
  },
  {
    title: "📝 Register FIR",
    description: "Register a new FIR securely and quickly.",
    button: "🚔 Register FIR",
    link: "/add-fir",
  },
  {
    title: "🔍 FIR Tracking",
    description: "Track FIR status and related information.",
    button: "📌 Track FIR",
    link: "/fir-tracking",
  },
  {
    title: "👨‍⚖️ Book Advocate",
    description: "Book legal experts for consultation.",
    button: "📅 Book Now",
    link: "/advocate-booking",
  },
  {
    title: "📄 Legal Documents",
    description: "Upload and manage legal documents easily.",
    button: "📂 Manage Documents",
    link: "/legal-documents",
  },
  {
    title: "🤖 AI Assistant",
    description: "Ask legal questions and receive AI assistance.",
    button: "💬 Ask AI",
    link: "/ai-assistant",
  },
  {
    title: "📞 Contact Support",
    description: "Reach our support team whenever needed.",
    button: "☎️ Contact Us",
    link: "/contact",
  },
];
return (
<div
style={{
minHeight: "100vh",
background: "#0F172A",
padding: "40px",
fontFamily: "Arial, sans-serif",
}}
>
{/* Header Section */}

```
  <div
    style={{
      textAlign: "center",
      marginBottom: "40px",
    }}
  >
    <h1
      style={{
        color: "#F8FAFC",
        fontSize: "46px",
        marginBottom: "10px",
        letterSpacing: "2px",
      }}
    >
      ⚖️ LEGAL AI DASHBOARD
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

    <p
      style={{
        color: "#CBD5E1",
        fontSize: "18px",
        marginBottom: "8px",
      }}
    >
      AI Powered Legal & Judiciary Automation System
    </p>

    <p
      style={{
        color: "#94A3B8",
        fontSize: "15px",
        letterSpacing: "1px",
      }}
    >
      Smart • Secure • Intelligent Legal Assistance
    </p>
  </div>

  {/* Welcome Card */}

  {/* Welcome Card */}

<div
  style={{
    background: "#111827",
    padding: "40px",
    borderRadius: "24px",
    margin: "0 auto 35px auto",
    width: "75%",
    textAlign: "center",
    boxShadow: "0 15px 35px rgba(0,0,0,0.30)",
  }}
>
  <h2
    style={{
      color: "#F8FAFC",
      marginBottom: "18px",
      fontSize: "38px",
      fontWeight: "700",
    }}
  >
    👋 Welcome Back!
  </h2>

  <p
    style={{
      color: "#CBD5E1",
      lineHeight: "32px",
      fontSize: "17px",
    }}
  >
    Manage your legal services securely and efficiently
    from one centralized dashboard.
    <br />
    <br />
    Track cases, monitor FIRs, consult advocates,
    manage legal documents, and access AI-powered
    legal assistance—all in one place.
  </p>
</div>
{/* Statistics Cards */}

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "20px",
    marginBottom: "35px",
  }}
>
  {[
      ["🏛️ 8+", "Legal Services"],
  ["🤖 24/7", "AI Assistance"],
  ["🔐 100%", "Secure Access"],
  ["📌 Real-Time", "Case Tracking"],
  ].map((item, index) => (
    <div
      key={index}
      style={{
        background: "#1E293B",
        padding: "25px",
        borderRadius: "20px",
        border: "1px solid #334155",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          color: "#D4AF37",
          marginBottom: "10px",
        }}
      >
        {item[0]}
      </h2>

      <p
        style={{
          color: "#CBD5E1",
        }}
      >
        {item[1]}
      </p>
    </div>
  ))}
</div>

  {/* Legal Services Section */}

  <div
    style={{
      background: "#111827",
      borderRadius: "20px",
      padding: "30px",
      boxShadow: "0 15px 35px rgba(0,0,0,0.30)",
    }}
  >
    <h2
      style={{
        textAlign: "center",
        color: "#F8FAFC",
        marginBottom: "30px",
        fontSize: "28px",
      }}
    >
      🚀 Quick Legal Services
    </h2>
    <p
  style={{
    textAlign: "center",
    color: "#94A3B8",
    marginBottom: "30px",
    fontSize: "16px",
  }}
>
  Access all your legal tools and services instantly.
</p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(260px, 1fr))",
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
        ? "translateY(-10px) scale(1.03)"
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
    marginBottom: "15px",
    fontSize: "21px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  }}
>
  {module.title}
</h3>

            <p
  style={{
    color: "#CBD5E1",
    lineHeight: "28px",
    marginBottom: "25px",
    fontSize: "15px",
  }}
>
  {module.description}
</p>
          </div>

          <a
            href={module.link}
            style={{
              textDecoration: "none",
            }}
          >
            <button
  style={{
    ...buttonStyle,
    background:
      hoveredCard === index
        ? "#6366F1"
        : "#4F46E5",
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
  {/* AI Assistant Section */}

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
  <h2
    style={{
      color: "#F8FAFC",
      marginBottom: "15px",
      fontSize: "32px",
    }}
  >
    💡Need Legal Assistance?
  </h2>

  <p
    style={{
      color: "#CBD5E1",
      lineHeight: "32px",
      fontSize: "17px",
      marginBottom: "25px",
    }}
  >
    Our AI-powered legal assistant is available
    24/7 to answer your legal questions and help
    you understand legal procedures and legal
    documents instantly.
  </p>

  <a
    href="/ai-assistant"
    style={{
      textDecoration: "none",
    }}
  >
    <button
      style={{
        ...buttonStyle,
        width: "250px",
      }}
    >
      Open AI Assistant
    </button>
  </a>
</div>
</div>
);
}
