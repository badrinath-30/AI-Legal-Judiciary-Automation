"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND = "http://127.0.0.1:8000";
const getToken = () => localStorage.getItem("access_token");

const INVESTIGATION_STAGES = [
  "Under Investigation",
  "Verified",
  "Charge Sheet Filed",
  "Charge Sheet Submitted",
  "Closed",
  "Flagged - Requires Review",
];

export default function PoliceDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [officerName, setOfficerName] = useState("");

  // FIR Register Form
  const [firForm, setFirForm] = useState({
    fir_number: "",
    police_station: "",
    complaint_type: "",
    date_registered: new Date().toISOString().split("T")[0],
    status: "Filed",
  });

  // Charge Sheet Form
  const [chargeForm, setChargeForm] = useState({
    fir_number: "",
    charge_sheet_number: "",
    charges: "",
    accused_name: "",
    date_filed: new Date().toISOString().split("T")[0],
  });

  // Case Register Form
  const [caseForm, setCaseForm] = useState({
    case_number: "",
    case_title: "",
    petitioner: "",
    respondent: "",
    court_name: "",
    judge_name: "",
    advocate_assigned: "",
    case_type: "Criminal",
    filing_date: new Date().toISOString().split("T")[0],
    next_hearing_date: "",
    priority: "Medium",
    status: "Open",
  });

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role !== "Police" && role !== "Super Admin") {
      window.location.href = "/dashboard";
      return;
    }
    setOfficerName(localStorage.getItem("user_name") || "Officer");
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND}/police/dashboard`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setDashboardData(res.data);
    } catch (e) {
      setErrorMsg("Failed to load dashboard data.");
    }
    setLoading(false);
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  function showError(msg) {
    setErrorMsg(msg);
    setSuccessMsg("");
    setTimeout(() => setErrorMsg(""), 4000);
  }

  async function registerFIR() {
    if (!firForm.fir_number || !firForm.police_station || !firForm.complaint_type) {
      showError("Please fill all required FIR fields.");
      return;
    }
    try {
      await axios.post(`${BACKEND}/add-fir`, firForm, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      showSuccess(`FIR ${firForm.fir_number} registered successfully! SMS sent to complainant.`);
      setFirForm({ fir_number: "", police_station: "", complaint_type: "", date_registered: new Date().toISOString().split("T")[0], status: "Filed" });
      loadDashboard();
    } catch (e) {
      showError(e?.response?.data?.detail || "FIR registration failed.");
    }
  }

  async function updateInvestigationStatus(firNumber, status) {
    try {
      await axios.put(
        `${BACKEND}/police/investigation/update`,
        { fir_number: firNumber, investigation_status: status, officer_name: officerName },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      showSuccess(`FIR ${firNumber} investigation updated to '${status}'.`);
      loadDashboard();
    } catch (e) {
      showError("Failed to update investigation status.");
    }
  }

  async function verifyComplaint(firNumber, verified) {
    try {
      await axios.post(
        `${BACKEND}/police/complaint/verify`,
        { fir_number: firNumber, verified, verification_remarks: `Verified by ${officerName}` },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      showSuccess(`FIR ${firNumber} ${verified ? "verified" : "flagged for review"}.`);
      loadDashboard();
    } catch (e) {
      showError("Verification failed.");
    }
  }

  async function fileChargeSheet() {
    if (!chargeForm.fir_number || !chargeForm.charge_sheet_number || !chargeForm.accused_name) {
      showError("Please fill all charge sheet fields.");
      return;
    }
    try {
      await axios.post(`${BACKEND}/police/charge-sheet/file`, chargeForm, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      showSuccess(`Charge sheet ${chargeForm.charge_sheet_number} filed. FIR escalated to court proceedings.`);
      setChargeForm({ fir_number: "", charge_sheet_number: "", charges: "", accused_name: "", date_filed: new Date().toISOString().split("T")[0] });
      loadDashboard();
    } catch (e) {
      showError(e?.response?.data?.detail || "Charge sheet filing failed.");
    }
  }

  async function registerCase() {
    if (!caseForm.case_number || !caseForm.case_title || !caseForm.petitioner) {
      showError("Please fill all required case fields.");
      return;
    }
    try {
      await axios.post(`${BACKEND}/add-case`, caseForm, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      showSuccess(`Case ${caseForm.case_number} registered successfully!`);
      setCaseForm({ case_number: "", case_title: "", petitioner: "", respondent: "", court_name: "", judge_name: "", advocate_assigned: "", case_type: "Criminal", filing_date: new Date().toISOString().split("T")[0], next_hearing_date: "", priority: "Medium", status: "Open" });
      loadDashboard();
    } catch (e) {
      showError(e?.response?.data?.detail || "Case registration failed.");
    }
  }

  const statusColor = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("charge") || s.includes("filed")) return { bg: "rgba(239, 68, 68, 0.2)", color: "#F87171" };
    if (s.includes("verified")) return { bg: "rgba(16, 185, 129, 0.2)", color: "#34D399" };
    if (s.includes("flagged")) return { bg: "rgba(245, 158, 11, 0.2)", color: "#FBBF24" };
    return { bg: "rgba(96, 165, 250, 0.2)", color: "#60A5FA" };
  };

  const tabs = [
    { id: "overview", label: "📊 Overview" },
    { id: "firs", label: "📋 Manage FIRs" },
    { id: "register-fir", label: "➕ Register FIR" },
    { id: "charge-sheet", label: "📑 Charge Sheet" },
    { id: "register-case", label: "⚖️ Register Case" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      
      {/* TOP HEADER */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0B0F19 100%)", borderBottom: "1px solid rgba(59, 130, 246, 0.3)", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: "#60A5FA", fontSize: "26px", fontWeight: "800" }}>
            🚔 Police Station Command Center
          </h1>
          <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "14px" }}>
            Officer {officerName} • Investigation & Case Management Portal
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={loadDashboard} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60A5FA", border: "1px solid #3B82F6", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* NOTIFICATION BANNERS */}
      {successMsg && (
        <div style={{ margin: "16px 40px", padding: "14px 20px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10B981", borderRadius: "12px", color: "#34D399", fontWeight: "600" }}>
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ margin: "16px 40px", padding: "14px 20px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", borderRadius: "12px", color: "#F87171", fontWeight: "600" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div style={{ padding: "30px 40px" }}>
        
        {/* TAB NAVIGATION */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "30px", flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "14px",
                background: activeTab === t.id ? "#3B82F6" : "rgba(255,255,255,0.07)",
                color: activeTab === t.id ? "white" : "#94A3B8",
                transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== TAB: OVERVIEW ===== */}
        {activeTab === "overview" && (
          <div>
            {loading ? (
              <p style={{ color: "#94A3B8", textAlign: "center", padding: "60px" }}>Loading station data...</p>
            ) : dashboardData ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                  {[
                    { label: "Total FIRs", value: dashboardData.total_firs, icon: "📋", color: "#60A5FA" },
                    { label: "Total Cases", value: dashboardData.total_cases, icon: "⚖️", color: "#A78BFA" },
                    { label: "Under Investigation", value: dashboardData.under_investigation, icon: "🔍", color: "#FBBF24" },
                    { label: "Charge Sheets Filed", value: dashboardData.charge_sheet_filed, icon: "📑", color: "#F87171" },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
                      <div style={{ fontSize: "36px", marginBottom: "10px" }}>{stat.icon}</div>
                      <div style={{ fontSize: "36px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
                      <div style={{ color: "#94A3B8", fontSize: "14px", marginTop: "4px" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "25px" }}>
                  <h3 style={{ color: "#F8FAFC", margin: "0 0 20px 0" }}>Recent Cases Filed</h3>
                  {dashboardData.recent_cases?.slice(0, 5).map((c, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div>
                        <p style={{ color: "#60A5FA", margin: 0, fontWeight: "700" }}>{c.case_number}</p>
                        <p style={{ color: "#CBD5E1", margin: "4px 0 0", fontSize: "14px" }}>{c.case_title}</p>
                      </div>
                      <span style={{ padding: "4px 12px", borderRadius: "15px", fontSize: "12px", fontWeight: "700", background: "rgba(96, 165, 250, 0.2)", color: "#60A5FA", alignSelf: "center" }}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ===== TAB: MANAGE FIRs ===== */}
        {activeTab === "firs" && (
          <div>
            {loading ? (
              <p style={{ color: "#94A3B8" }}>Loading FIR records...</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#0F172A" }}>
                      {["FIR Number", "Police Station", "Complaint Type", "Date Filed", "Investigation Status", "Actions"].map(h => (
                        <th key={h} style={{ padding: "14px 16px", color: "#CBD5E1", textAlign: "left", fontWeight: "700", fontSize: "13px", borderBottom: "1px solid #334155" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData?.firs || []).map((fir, idx) => {
                      const sc = statusColor(fir.investigation_status);
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "14px 16px", color: "#60A5FA", fontWeight: "700" }}>{fir.fir_number}</td>
                          <td style={{ padding: "14px 16px", color: "#F8FAFC" }}>{fir.police_station}</td>
                          <td style={{ padding: "14px 16px", color: "#CBD5E1" }}>{fir.complaint_type}</td>
                          <td style={{ padding: "14px 16px", color: "#94A3B8" }}>{fir.date_registered}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", background: sc.bg, color: sc.color }}>
                              {fir.investigation_status}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              <button onClick={() => updateInvestigationStatus(fir.fir_number, "Under Investigation")} style={{ padding: "5px 10px", background: "rgba(96, 165, 250, 0.2)", color: "#60A5FA", border: "1px solid #3B82F6", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>Investigating</button>
                              <button onClick={() => verifyComplaint(fir.fir_number, true)} style={{ padding: "5px 10px", background: "rgba(16, 185, 129, 0.2)", color: "#34D399", border: "1px solid #10B981", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>✓ Verify</button>
                              <button onClick={() => verifyComplaint(fir.fir_number, false)} style={{ padding: "5px 10px", background: "rgba(245, 158, 11, 0.2)", color: "#FBBF24", border: "1px solid #F59E0B", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>⚑ Flag</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {(dashboardData?.firs || []).length === 0 && (
                  <p style={{ color: "#94A3B8", textAlign: "center", padding: "40px" }}>No FIRs registered at this station yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: REGISTER FIR ===== */}
        {activeTab === "register-fir" && (
          <div style={{ maxWidth: "700px" }}>
            <h2 style={{ color: "#60A5FA", marginTop: 0 }}>📋 Register New FIR</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {[
                { label: "FIR Number *", key: "fir_number", placeholder: "FIR/2026/0001" },
                { label: "Police Station *", key: "police_station", placeholder: "Station Name" },
                { label: "Date Registered", key: "date_registered", type: "date" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>{f.label}</label>
                  <input
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={firForm[f.key]}
                    onChange={e => setFirForm({ ...firForm, [f.key]: e.target.value })}
                    style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "10px", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Complaint Type *</label>
                <select value={firForm.complaint_type} onChange={e => setFirForm({ ...firForm, complaint_type: e.target.value })} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#60A5FA", border: "1px solid #334155", borderRadius: "10px" }}>
                  <option value="">Select Complaint Type</option>
                  <option>Theft / Robbery</option>
                  <option>Assault / Bodily Harm</option>
                  <option>Cyber Crime</option>
                  <option>Fraud / Cheating</option>
                  <option>Domestic Violence</option>
                  <option>Murder / Attempt to Murder</option>
                  <option>Property Dispute</option>
                  <option>Missing Person</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <button onClick={registerFIR} style={{ marginTop: "24px", background: "#3B82F6", color: "white", border: "none", padding: "14px 32px", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "16px" }}>
              📋 REGISTER FIR
            </button>
          </div>
        )}

        {/* ===== TAB: CHARGE SHEET ===== */}
        {activeTab === "charge-sheet" && (
          <div style={{ maxWidth: "700px" }}>
            <h2 style={{ color: "#F87171", marginTop: 0 }}>📑 File Charge Sheet</h2>
            <p style={{ color: "#94A3B8", marginBottom: "25px" }}>
              Filing a charge sheet will escalate the FIR to court proceedings and update the investigation status automatically.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {[
                { label: "FIR Number *", key: "fir_number", placeholder: "FIR/2026/0001" },
                { label: "Charge Sheet Number *", key: "charge_sheet_number", placeholder: "CS/2026/0001" },
                { label: "Accused Name *", key: "accused_name", placeholder: "Full name of accused" },
                { label: "Date Filed", key: "date_filed", type: "date" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>{f.label}</label>
                  <input
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={chargeForm[f.key]}
                    onChange={e => setChargeForm({ ...chargeForm, [f.key]: e.target.value })}
                    style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "10px", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Charges Filed *</label>
                <textarea
                  placeholder="Describe IPC sections and charges..."
                  value={chargeForm.charges}
                  onChange={e => setChargeForm({ ...chargeForm, charges: e.target.value })}
                  rows={4}
                  style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "10px", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>
            </div>
            <button onClick={fileChargeSheet} style={{ marginTop: "24px", background: "#EF4444", color: "white", border: "none", padding: "14px 32px", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "16px" }}>
              📑 FILE CHARGE SHEET
            </button>
          </div>
        )}

        {/* ===== TAB: REGISTER CASE ===== */}
        {activeTab === "register-case" && (
          <div style={{ maxWidth: "900px" }}>
            <h2 style={{ color: "#A78BFA", marginTop: 0 }}>⚖️ Register New Case</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {[
                { label: "Case Number *", key: "case_number", placeholder: "CASE/2026/0001" },
                { label: "Case Title *", key: "case_title", placeholder: "State vs Accused" },
                { label: "Petitioner (Complainant) *", key: "petitioner", placeholder: "Full Name" },
                { label: "Respondent (Accused)", key: "respondent", placeholder: "Full Name" },
                { label: "Court Name", key: "court_name", placeholder: "District Court, Hyderabad" },
                { label: "Judge Name", key: "judge_name", placeholder: "Hon. Justice ..." },
                { label: "Advocate Assigned", key: "advocate_assigned", placeholder: "Advocate Name" },
                { label: "Filing Date", key: "filing_date", type: "date" },
                { label: "Next Hearing Date", key: "next_hearing_date", type: "date" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>{f.label}</label>
                  <input
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={caseForm[f.key]}
                    onChange={e => setCaseForm({ ...caseForm, [f.key]: e.target.value })}
                    style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "10px", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Case Type</label>
                <select value={caseForm.case_type} onChange={e => setCaseForm({ ...caseForm, case_type: e.target.value })} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#60A5FA", border: "1px solid #334155", borderRadius: "10px" }}>
                  <option>Criminal</option>
                  <option>Civil</option>
                  <option>Family</option>
                  <option>Property</option>
                  <option>Corporate</option>
                  <option>Cyber Crime</option>
                </select>
              </div>
              <div>
                <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Priority</label>
                <select value={caseForm.priority} onChange={e => setCaseForm({ ...caseForm, priority: e.target.value })} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#FBBF24", border: "1px solid #334155", borderRadius: "10px" }}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>
            <button onClick={registerCase} style={{ marginTop: "24px", background: "#7C3AED", color: "white", border: "none", padding: "14px 32px", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "16px" }}>
              ⚖️ REGISTER CASE
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
