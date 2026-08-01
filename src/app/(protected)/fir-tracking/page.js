"use client";

import { useState, useEffect } from "react";

export default function FIRTracking() {
  const BACKEND = "http://127.0.0.1:8000";

  const [firs, setFirs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFir, setSelectedFir] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUserFirs();
  }, []);

  const token = () => localStorage.getItem("access_token");

  async function loadUserFirs() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND}/firs`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setFirs(data);
      } else {
        setError(data.detail || "Failed to load FIR records.");
      }
    } catch {
      setError("Could not connect to backend server.");
    } finally {
      setLoading(false);
    }
  }

  async function searchFir() {
    if (!search.trim()) {
      loadUserFirs();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND}/fir?fir_number=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFirs([data]);
        setSelectedFir(data);
      } else {
        setError(data.detail || "FIR not found.");
        setFirs([]);
      }
    } catch {
      setError("Server error while searching FIR.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", padding: "40px", fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
            <h1 style={{ color: "#F8FAFC", fontSize: "36px", fontWeight: "800", margin: 0 }}>
              🚔 FIR Tracking & Investigation Portal
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "16px", marginTop: "6px" }}>
              Citizen Police Records • Investigation Status • Official Verification
            </p>
          </div>
          <button
            onClick={loadUserFirs}
            style={{ background: "rgba(239, 68, 68, 0.15)", color: "#F87171", border: "1px solid #EF4444", padding: "10px 20px", borderRadius: "12px", cursor: "pointer", fontWeight: "600" }}
          >
            🔄 Refresh FIRs
          </button>
        </div>

        {/* SEARCH CARD */}
        <div className="glass-card" style={{ padding: "25px", marginBottom: "35px" }}>
          <h3 style={{ color: "#D4AF37", margin: "0 0 15px 0" }}>🔍 Search Specific FIR Record</h3>
          <div style={{ display: "flex", gap: "15px" }}>
            <input
              type="text"
              placeholder="Enter FIR Number (e.g. FIR2026/1025)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchFir()}
              style={{ flex: 1, padding: "14px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "12px", outline: "none" }}
            />
            <button
              onClick={searchFir}
              style={{ background: "#EF4444", color: "white", border: "none", padding: "14px 28px", borderRadius: "12px", cursor: "pointer", fontWeight: "700" }}
            >
              TRACK FIR
            </button>
          </div>
          {error && (
            <div style={{ marginTop: "15px", padding: "12px", background: "rgba(239, 68, 68, 0.15)", color: "#FCA5A5", border: "1px solid #EF4444", borderRadius: "10px" }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* LIST OF FIRS */}
        {loading ? (
          <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
            Loading your registered FIR records...
          </div>
        ) : firs.length === 0 ? (
          <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
            No FIR records registered under your citizen profile.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "25px" }}>
            {firs.map((fir, idx) => (
              <div key={idx} className="glass-card" style={{ padding: "25px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h3 style={{ color: "#F87171", margin: 0, fontSize: "18px" }}>🚔 {fir.fir_number}</h3>
                  <span style={{ padding: "4px 12px", borderRadius: "15px", fontSize: "12px", fontWeight: "700", background: "rgba(245, 158, 11, 0.2)", color: "#FBBF24", border: "1px solid #F59E0B" }}>
                    {fir.status}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "#CBD5E1" }}>
                  <div><strong style={{ color: "#94A3B8" }}>Police Station:</strong> {fir.police_station}</div>
                  <div><strong style={{ color: "#94A3B8" }}>Complaint Type:</strong> {fir.complaint_type}</div>
                  <div><strong style={{ color: "#94A3B8" }}>Date Filed:</strong> {fir.date_registered}</div>
                  <div><strong style={{ color: "#94A3B8" }}>Investigation Status:</strong> <span style={{ color: "#34D399" }}>{fir.investigation_status || "Under Investigation"}</span></div>
                </div>

                <button
                  onClick={() => setSelectedFir(fir)}
                  style={{ marginTop: "20px", width: "100%", padding: "10px", background: "#334155", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}
                >
                  View Station Details
                </button>
              </div>
            ))}
          </div>
        )}

        {/* SELECTED FIR MODAL */}
        {selectedFir && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div className="glass-card" style={{ width: "100%", maxWidth: "600px", padding: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ color: "#F87171", margin: 0 }}>🚔 FIR Record: {selectedFir.fir_number}</h2>
                <button onClick={() => setSelectedFir(null)} style={{ background: "transparent", color: "#94A3B8", border: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
              </div>
              
              <div style={{ background: "#0F172A", padding: "20px", borderRadius: "14px", border: "1px solid #334155", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div><span style={{ color: "#94A3B8" }}>Police Station Jurisdiction:</span> <strong style={{ color: "#F8FAFC" }}>{selectedFir.police_station}</strong></div>
                <div><span style={{ color: "#94A3B8" }}>Complaint Offense:</span> <strong style={{ color: "#F8FAFC" }}>{selectedFir.complaint_type}</strong></div>
                <div><span style={{ color: "#94A3B8" }}>Registration Date:</span> <strong style={{ color: "#FBBF24" }}>{selectedFir.date_registered}</strong></div>
                <div><span style={{ color: "#94A3B8" }}>Investigation Officer Status:</span> <strong style={{ color: "#34D399" }}>{selectedFir.investigation_status || "Active Investigation"}</strong></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}