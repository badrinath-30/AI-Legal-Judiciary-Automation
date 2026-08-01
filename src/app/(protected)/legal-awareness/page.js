"use client";

import { useEffect, useState } from "react";

export default function LegalAwareness() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/legal-awareness")
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", padding: "40px", fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ color: "#F8FAFC", fontSize: "40px", fontWeight: "800", margin: "0 0 10px 0" }}>
            ⚖️ Legal Awareness & Citizen Rights
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "18px", maxWidth: "800px", margin: "0 auto" }}>
            Empowering citizens with transparent knowledge of Indian Constitutional rights, FIR filing procedures, bail rights, and free legal aid.
          </p>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
            Loading Legal Awareness Portal...
          </div>
        ) : !data ? (
          <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
            Legal Awareness Services Temporarily Unavailable.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "30px" }}>
            {data.categories.map((item, idx) => (
              <div key={idx} className="glass-card" style={{ padding: "30px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <h2 style={{ color: "#60A5FA", fontSize: "22px", marginTop: 0, marginBottom: "12px" }}>
                  {item.title}
                </h2>
                <p style={{ color: "#CBD5E1", fontSize: "15px", lineHeight: "24px", marginBottom: "20px" }}>
                  {item.summary}
                </p>

                <h4 style={{ color: "#D4AF37", marginBottom: "10px", fontSize: "14px", textTransform: "uppercase" }}>
                  Key Constitutional Protections:
                </h4>
                <ul style={{ paddingLeft: "20px", color: "#94A3B8", fontSize: "14px", lineHeight: "22px", margin: 0 }}>
                  {item.key_points.map((pt, pIdx) => (
                    <li key={pIdx} style={{ marginBottom: "8px" }}>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
