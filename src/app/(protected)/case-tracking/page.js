"use client";

import { useEffect, useState } from "react";

export default function CaseTracking() {
  const BACKEND = "http://127.0.0.1:8000";

  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    hearing: 0,
    closed: 0,
  });

  useEffect(() => {
    loadCases();
  }, []);

  const token = () => localStorage.getItem("access_token");

  async function loadCases() {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND}/all-cases`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Failed to fetch cases.");
        setLoading(false);
        return;
      }

      setCases(data);
      setFilteredCases(data);

      let pending = 0;
      let hearing = 0;
      let closed = 0;

      data.forEach((item) => {
        const s = (item.status || "").toLowerCase();
        if (s.includes("pending")) pending++;
        else if (s.includes("hearing") || s.includes("open")) hearing++;
        else if (s.includes("closed") || s.includes("completed")) closed++;
      });

      setStats({
        total: data.length,
        pending,
        hearing,
        closed,
      });
    } catch {
      setError("Backend server not running.");
    } finally {
      setLoading(false);
    }
  }

  async function searchCase() {
    if (!search.trim()) {
      setFilteredCases(cases);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`${BACKEND}/case?case_number=${search}`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setFilteredCases([]);
        setSelectedCase(null);
        setError(data.detail || "Case not found.");
      } else {
        setFilteredCases([data]);
        setSelectedCase(data);
        setError("");
      }
    } catch {
      setError("Server Connection Error");
    }
    setSearchLoading(false);
  }

  async function fetchCaseTimeline(caseNumber) {
    setTimelineLoading(true);
    try {
      const response = await fetch(`${BACKEND}/case/timeline/${caseNumber}`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setTimelineData(data);
        setShowTimeline(true);
      }
    } catch (e) {
      console.error(e);
    }
    setTimelineLoading(false);
  }

  function resetSearch() {
    setSearch("");
    setFilteredCases(cases);
    setSelectedCase(null);
    setError("");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B0F19",
        padding: "40px",
        fontFamily: "-apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
            <h1 style={{ color: "#F8FAFC", fontSize: "38px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
              ⚖️ Case Tracking Portal
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "16px", marginTop: "6px" }}>
              Real-time monitoring of your judicial proceedings & legal timelines
            </p>
          </div>
          <button
            onClick={loadCases}
            style={{
              background: "rgba(59, 130, 246, 0.15)",
              color: "#60A5FA",
              border: "1px solid #3B82F6",
              padding: "10px 20px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            🔄 Refresh Cases
          </button>
        </div>

        {/* DASHBOARD CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "35px" }}>
          <div className="glass-card" style={{ padding: "22px" }}>
            <h3 style={{ color: "#94A3B8", fontSize: "14px", margin: "0 0 8px 0" }}>Total Cases</h3>
            <h1 style={{ color: "#60A5FA", fontSize: "36px", margin: 0, fontWeight: "800" }}>{stats.total}</h1>
          </div>

          <div className="glass-card" style={{ padding: "22px" }}>
            <h3 style={{ color: "#94A3B8", fontSize: "14px", margin: "0 0 8px 0" }}>Pending</h3>
            <h1 style={{ color: "#FBBF24", fontSize: "36px", margin: 0, fontWeight: "800" }}>{stats.pending}</h1>
          </div>

          <div className="glass-card" style={{ padding: "22px" }}>
            <h3 style={{ color: "#94A3B8", fontSize: "14px", margin: "0 0 8px 0" }}>Active Hearings</h3>
            <h1 style={{ color: "#38BDF8", fontSize: "36px", margin: 0, fontWeight: "800" }}>{stats.hearing}</h1>
          </div>

          <div className="glass-card" style={{ padding: "22px" }}>
            <h3 style={{ color: "#94A3B8", fontSize: "14px", margin: "0 0 8px 0" }}>Closed / Disposed</h3>
            <h1 style={{ color: "#34D399", fontSize: "36px", margin: 0, fontWeight: "800" }}>{stats.closed}</h1>
          </div>
        </div>

        {/* SEARCH CARD */}
        <div className="glass-card" style={{ padding: "25px", marginBottom: "35px" }}>
          <h3 style={{ color: "#D4AF37", margin: "0 0 15px 0", fontSize: "18px" }}>🔍 Search Case Record</h3>
          <div style={{ display: "flex", gap: "15px" }}>
            <input
              type="text"
              placeholder="Enter Case Number (e.g. HC2026-1001)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                padding: "14px",
                background: "#0F172A",
                color: "#F8FAFC",
                border: "1px solid #334155",
                borderRadius: "12px",
                outline: "none",
                fontSize: "15px"
              }}
            />
            <button
              onClick={searchCase}
              disabled={searchLoading}
              style={{
                background: "#3B82F6",
                color: "white",
                border: "none",
                padding: "14px 28px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "700"
              }}
            >
              {searchLoading ? "Searching..." : "SEARCH"}
            </button>
            <button
              onClick={resetSearch}
              style={{
                background: "#334155",
                color: "white",
                border: "none",
                padding: "14px 24px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Reset
            </button>
          </div>
          {error && (
            <div style={{ marginTop: "15px", padding: "12px", background: "rgba(239, 68, 68, 0.15)", color: "#FCA5A5", border: "1px solid #EF4444", borderRadius: "10px", fontSize: "14px" }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* CASES TABLE */}
        {loading ? (
          <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
            Loading case records...
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
            No case records associated with your account.
          </div>
        ) : (
          <div className="glass-card" style={{ overflow: "hidden", marginBottom: "35px" }}>
            <div style={{ padding: "20px 25px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <h3 style={{ color: "#F8FAFC", margin: 0, fontSize: "20px" }}>📋 Registered Case Dossiers</h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(15, 23, 42, 0.9)", borderBottom: "1px solid #334155" }}>
                  <th style={{ color: "#CBD5E1", padding: "16px", textAlign: "left" }}>Case Number</th>
                  <th style={{ color: "#CBD5E1", padding: "16px", textAlign: "left" }}>Title</th>
                  <th style={{ color: "#CBD5E1", padding: "16px", textAlign: "left" }}>Court</th>
                  <th style={{ color: "#CBD5E1", padding: "16px", textAlign: "left" }}>Advocate</th>
                  <th style={{ color: "#CBD5E1", padding: "16px", textAlign: "left" }}>Next Hearing</th>
                  <th style={{ color: "#CBD5E1", padding: "16px", textAlign: "left" }}>Status</th>
                  <th style={{ color: "#CBD5E1", padding: "16px", textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((item, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px", color: "#60A5FA", fontWeight: "700" }}>{item.case_number}</td>
                    <td style={{ padding: "16px", color: "#F8FAFC" }}>{item.case_title}</td>
                    <td style={{ padding: "16px", color: "#CBD5E1" }}>{item.court_name}</td>
                    <td style={{ padding: "16px", color: "#CBD5E1" }}>{item.advocate_assigned || "Unassigned"}</td>
                    <td style={{ padding: "16px", color: "#FBBF24" }}>{item.next_hearing_date}</td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", background: "rgba(59, 130, 246, 0.2)", color: "#60A5FA", border: "1px solid #3B82F6" }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => setSelectedCase(item)}
                        style={{ background: "#334155", color: "white", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => fetchCaseTimeline(item.case_number)}
                        style={{ background: "#3B82F6", color: "white", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                      >
                        Timeline ⏱️
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`${BACKEND}/report/case/${item.case_number}`, {
                              headers: { Authorization: `Bearer ${token()}` }
                            });
                            const report = await res.json();
                            if (!res.ok) { alert(report.detail || "Failed to generate report"); return; }
                            
                            const reportTxt = `NATIONAL JUDICIAL SYSTEM - OFFICIAL CASE REPORT
=====================================================
Case Number: ${report.case.case_number}
Case Title:  ${report.case.case_title}
Generated By:${report.generated_by}
Generated At:${report.generated_at}
=====================================================
PARTIES:
Petitioner:  ${report.case.petitioner}
Respondent:  ${report.case.respondent}

COURT DETAILS:
Court Name:  ${report.case.court_name}
Judge:       ${report.case.judge_name}
Advocate:    ${report.case.advocate_assigned}

CASE INFORMATION:
Case Type:   ${report.case.case_type}
Filing Date: ${report.case.filing_date}
Next Hearing:${report.case.next_hearing_date}
Priority:    ${report.case.priority}
Status:      ${report.case.status}
=====================================================
End of Official Record. Confidential Judicial Dossier.`;

                            const blob = new Blob([reportTxt], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `Case_Report_${item.case_number}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch (e) {
                            alert("Report generation failed");
                          }
                        }}
                        style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34D399", border: "1px solid #10B981", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                      >
                        PDF Report 📄
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CASE DETAILS CARD */}
        {selectedCase && (
          <div className="glass-card" style={{ padding: "30px", marginBottom: "35px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#D4AF37", margin: 0 }}>⚖️ Case File: {selectedCase.case_number}</h2>
              <button onClick={() => setSelectedCase(null)} style={{ background: "transparent", color: "#94A3B8", border: "none", cursor: "pointer", fontSize: "18px" }}>✕ Close</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" }}>
              <DetailBox label="Petitioner" value={selectedCase.petitioner} />
              <DetailBox label="Respondent" value={selectedCase.respondent} />
              <DetailBox label="Court Jurisdiction" value={selectedCase.court_name} />
              <DetailBox label="Presiding Judge" value={selectedCase.judge_name} />
              <DetailBox label="Assigned Advocate" value={selectedCase.advocate_assigned} />
              <DetailBox label="Case Type" value={selectedCase.case_type} />
              <DetailBox label="Filing Date" value={selectedCase.filing_date} />
              <DetailBox label="Next Hearing" value={selectedCase.next_hearing_date} />
              <DetailBox label="Case Priority" value={selectedCase.priority} />
            </div>
          </div>
        )}

        {/* JUDICIAL TIMELINE MODAL */}
        {showTimeline && timelineData && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
            <div className="glass-card" style={{ width: "100%", maxWidth: "800px", padding: "35px", maxHeight: "85vh", overflowY: "auto", border: "1px solid #3B82F6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                <div>
                  <h2 style={{ color: "#F8FAFC", margin: 0 }}>⏱️ Judicial Hearing Timeline</h2>
                  <p style={{ color: "#94A3B8", margin: "4px 0 0 0", fontSize: "14px" }}>{timelineData.case_number} - {timelineData.case_title}</p>
                </div>
                <button onClick={() => setShowTimeline(false)} style={{ background: "#334155", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>✕ Close</button>
              </div>

              <div style={{ position: "relative", paddingLeft: "30px", borderLeft: "3px solid #3B82F6" }}>
                {timelineData.timeline.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: "25px", position: "relative" }}>
                    <div style={{ position: "absolute", left: "-42px", top: 0, width: "20px", height: "20px", borderRadius: "50%", background: item.status === "Completed" ? "#10B981" : item.status === "In Progress" ? "#3B82F6" : "#475569", border: "3px solid #0B0F19" }} />
                    <div style={{ background: "#0F172A", padding: "16px", borderRadius: "12px", border: "1px solid #334155" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <h4 style={{ color: "#F8FAFC", margin: 0, fontSize: "16px" }}>Step {item.step}: {item.title}</h4>
                        <span style={{ fontSize: "12px", color: item.status === "Completed" ? "#34D399" : "#60A5FA", fontWeight: "700" }}>{item.status}</span>
                      </div>
                      <p style={{ color: "#94A3B8", margin: "4px 0 8px 0", fontSize: "14px" }}>{item.description}</p>
                      <span style={{ fontSize: "12px", color: "#FBBF24" }}>📅 Date: {item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div style={{ background: "#0F172A", padding: "14px", borderRadius: "12px", border: "1px solid #334155" }}>
      <div style={{ color: "#94A3B8", fontSize: "12px", marginBottom: "4px" }}>{label}</div>
      <div style={{ color: "#F8FAFC", fontWeight: "600", fontSize: "15px" }}>{value || "N/A"}</div>
    </div>
  );
}