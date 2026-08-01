
import Link from "next/link";

export default function Services() {
  const services = [
    { name: "🤖 AI Legal Assistant", link: "/ai-assistant" },
    { name: "📂 Case Tracking", link: "/case-tracking" },
    { name: "⚖️ Advocate Appointment", link: "/advocate-booking" },
    { name: "📄 Legal Documents", link: "/legal-documents" },
    { name: "🚔 FIR Tracking", link: "/fir-tracking" },
    { name: "🔒 Secure Login", link: "/login" },
    { name: "📊 Analytics Dashboard", link: "/dashboard" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef4ff",
        fontFamily: "Arial, sans-serif",
        padding: "40px",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          fontSize: "50px",
          color: "#0B2447",
        }}
      >
        ⚖️ Our Services
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "gray",
          fontSize: "20px",
          marginBottom: "50px",
        }}
      >
        AI Powered Smart Judiciary & Legal Assistance Platform
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: "30px",
        }}
      >
        {services.map((item, index) => (
          <div
            key={index}
            style={{
              background: "white",
              borderRadius: "15px",
              padding: "30px",
              textAlign: "center",
              boxShadow: "0px 8px 20px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ color: "#003366" }}>{item.name}</h2>

            <p
              style={{
                marginTop: "15px",
                color: "#666",
                lineHeight: "1.6",
              }}
            >
              Smart AI-based legal assistance designed to simplify judicial
              services and improve citizen accessibility.
            </p>

            <Link href={item.link}>
              <button
                style={{
                  marginTop: "20px",
                  background: "#005eff",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Explore
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
