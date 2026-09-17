"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND = "http://127.0.0.1:8000";
const getToken = () => localStorage.getItem("access_token");

export default function CourtDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staffName, setStaffName] = useState("");

  const [hearingForm, setHearingForm] = useState({
    case_number: "",
    hearing_date: "",
    hearing_time: "10:00 AM",
    court_room: "",
    judge_name: "",
    hearing_type: "Regular Hearing",
    notes: "",
  });

  const [judgementForm, setJudgementForm] = useState({
    case_number: "",
    judgement_date: new Date().toISOString().split("T")[0],
    judge_name: "",
    verdict: "Acquitted",
    judgement_summary: "",
    next_steps: "",
  });

  const [closureForm, setClosureForm] = useState({
    case_number: "",
    closure_reason: "",
    final_status: "Closed - Judgement Passed",
  });

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role !== "Judge" && role !== "Admin") {
      window.location.href = "/dashboard";
      return;
    }
    setStaffName(localStorage.getItem("user_name") || "Court Staff");
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND}/court/dashboard`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setDashboardData(res.data);
    } catch (e) {
      setErrorMsg("Failed to load court dashboard.");
    }
    setLoading(false);
  }

  function showSuccess(msg) { setSuccessMsg(msg); setErrorMsg(""); setTimeout(() => setSuccessMsg(""), 4000); }
  function showError(msg) { setErrorMsg(msg); setSuccessMsg(""); setTimeout(() => setErrorMsg(""), 4000); }

  async function scheduleHearing() {
    if (!hearingForm.case_number || !hearingForm.hearing_date || !hearingForm.hearing_time) {
      showError("Case number, hearing date and time are required.");
      return;
    }
    try {
      await axios.post(`${BACKEND}/court/hearing/schedule`, hearingForm, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      showSuccess(`Hearing scheduled for Case ${hearingForm.case_number} on ${hearingForm.hearing_date}.`);
      setHearingForm({ case_number: "", hearing_date: "", hearing_time: "10:00 AM", court_room: "", judge_name: "", hearing_type: "Regular Hearing", notes: "" });
      loadDashboard();
    } catch (e) {
      showError(e?.response?.data?.detail || "Failed to schedule hearing.");
    }
  }

  async function uploadJudgement() {
    if (!judgementForm.case_number || !judgementForm.judge_name || !judgementForm.judgement_summary) {
      showError("Case number, judge name and judgement summary are required.");
      return;
    }
    try {
      await axios.post(`${BACKEND}/court/judgement/upload`, judgementForm, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      showSuccess(`Judgement recorded for Case ${judgementForm.case_number}. Verdict: ${judgementForm.verdict}`);
      setJudgementForm({ case_number: "", judgement_date: new Date().toISOString().split("T")[0], judge_name: "", verdict: "Acquitted", judgement_summary: "", next_steps: "" });
      loadDashboard();
    } catch (e) {
      showError(e?.response?.data?.detail || "Failed to upload judgement.");
    }
  }

  async function closeCase() {
    if (!closureForm.case_number || !closureForm.closure_reason) {
      showError("Case number and closure reason are required.");
      return;
    }
    try {
      await axios.put(`${BACKEND}/court/case/close`, closureForm, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      showSuccess(`Case ${closureForm.case_number} officially closed.`);
      setClosureForm({ case_number: "", closure_reason: "", final_status: "Closed - Judgement Passed" });
      loadDashboard();
    } catch (e) {
      showError(e?.response?.data?.detail || "Failed to close case.");
    }
  }

  const priorityColor = (p) => {
    if (!p) return "#94A3B8";
    const l = p.toLowerCase();
    if (l === "critical") return "#F87171";
    if (l === "high") return "#FBBF24";
    if (l === "medium") return "#60A5FA";
    return "#94A3B8";
  };

  const statusStyle = (s) => {
    const l = (s || "").toLowerCase();
    if (l.includes("closed") || l.includes("disposed")) return { bg: "rgba(16, 185, 129, 0.15)", color: "#34D399" };
    if (l.includes("judgement")) return { bg: "rgba(167, 139, 250, 0.15)", color: "#A78BFA" };
    if (l.includes("open") || l.includes("hearing")) return { bg: "rgba(96, 165, 250, 0.15)", color: "#60A5FA" };
    return { bg: "rgba(148, 163, 184, 0.15)", color: "#94A3B8" };
  };

  const tabs = [
    { id: "overview", label: "📊 Overview" },
    { id: "cases", label: "⚖️ All Cases" },
    { id: "schedule-hearing", label: "📅 Schedule Hearing" },
    { id: "upload-judgement", label: "🏛️ Upload Judgement" },
    { id: "close-case", label: "🔒 Close Case" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #1a1040 0%, #0B0F19 100%)", borderBottom: "1px solid rgba(167, 139, 250, 0.3)", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: "#A78BFA", fontSize: "26px", fontWeight: "800" }}>
            🏛️ Court Registry Management System
          </h1>
          <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "14px" }}>
            {staffName} • Judicial Records, Hearings & Verdicts Portal
          </p>
        </div>
        <button onClick={loadDashboard} style={{ background: "rgba(167, 139, 250, 0.15)", color: "#A78BFA", border: "1px solid #7C3AED", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>
          🔄 Refresh
        </button>
      </div>

      {/* NOTIFICATIONS */}
      {successMsg && <div style={{ margin: "16px 40px", padding: "14px 20px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10B981", borderRadius: "12px", color: "#34D399", fontWeight: "600" }}>✅ {successMsg}</div>}
      {errorMsg && <div style={{ margin: "16px 40px", padding: "14px 20px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", borderRadius: "12px", color: "#F87171", fontWeight: "600" }}>⚠️ {errorMsg}</div>}

      <div style={{ padding: "30px 40px" }}>
        
        {/* TABS */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "30px", flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "14px", background: activeTab === t.id ? "#7C3AED" : "rgba(255,255,255,0.07)", color: activeTab === t.id ? "white" : "#94A3B8" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== TAB: OVERVIEW ===== */}
        {activeTab === "overview" && (
          <div>
            {loading ? <p style={{ color: "#94A3B8", textAlign: "center", padding: "60px" }}>Loading court records...</p> : dashboardData ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                  {[
                    { label: "Total Cases", value: dashboardData.total_cases, icon: "📁", color: "#A78BFA" },
                    { label: "Active Cases", value: dashboardData.active_cases, icon: "⚖️", color: "#60A5FA" },
                    { label: "Judgements Passed", value: dashboardData.judgements_passed, icon: "🏛️", color: "#FBBF24" },
                    { label: "Closed Cases", value: dashboardData.closed_cases, icon: "✅", color: "#34D399" },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
                      <div style={{ fontSize: "36px", marginBottom: "10px" }}>{stat.icon}</div>
                      <div style={{ fontSize: "36px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
                      <div style={{ color: "#94A3B8", fontSize: "14px", marginTop: "4px" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "25px" }}>
                  <h3 style={{ color: "#F8FAFC", margin: "0 0 20px 0" }}>⏱️ Upcoming Hearings</h3>
                  {(dashboardData.cases || []).filter(c => !c.status?.toLowerCase().includes("closed")).slice(0, 5).map((c, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "16px", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", alignItems: "center" }}>
                      <span style={{ color: "#A78BFA", fontWeight: "700" }}>{c.case_number}</span>
                      <span style={{ color: "#F8FAFC", fontSize: "14px" }}>{c.case_title}</span>
                      <span style={{ color: "#FBBF24", fontSize: "13px" }}>🗓 {c.next_hearing_date || "TBD"}</span>
                      <span style={{ padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", background: statusStyle(c.status).bg, color: statusStyle(c.status).color }}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ===== TAB: ALL CASES ===== */}
        {activeTab === "cases" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0F172A" }}>
                  {["Case No.", "Title", "Petitioner vs Respondent", "Court / Judge", "Next Hearing", "Priority", "Status"].map(h => (
                    <th key={h} style={{ padding: "14px 16px", color: "#CBD5E1", textAlign: "left", fontWeight: "700", fontSize: "13px", borderBottom: "1px solid #334155" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(dashboardData?.cases || []).map((c, idx) => {
                  const ss = statusStyle(c.status);
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px 16px", color: "#A78BFA", fontWeight: "700" }}>{c.case_number}</td>
                      <td style={{ padding: "14px 16px", color: "#F8FAFC", maxWidth: "180px" }}>{c.case_title}</td>
                      <td style={{ padding: "14px 16px", color: "#CBD5E1", fontSize: "13px" }}>{c.petitioner} <span style={{ color: "#475569" }}>vs</span> {c.respondent}</td>
                      <td style={{ padding: "14px 16px", color: "#94A3B8", fontSize: "13px" }}>{c.court_name}<br /><span style={{ color: "#60A5FA" }}>{c.judge_name}</span></td>
                      <td style={{ padding: "14px 16px", color: "#FBBF24", fontWeight: "600" }}>{c.next_hearing_date || "TBD"}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ color: priorityColor(c.priority), fontWeight: "700", fontSize: "13px" }}>{c.priority}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", background: ss.bg, color: ss.color }}>{c.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(dashboardData?.cases || []).length === 0 && <p style={{ color: "#94A3B8", textAlign: "center", padding: "40px" }}>No cases on record.</p>}
          </div>
        )}

        {/* ===== TAB: SCHEDULE HEARING ===== */}
        {activeTab === "schedule-hearing" && (
          <div style={{ maxWidth: "700px" }}>
            <h2 style={{ color: "#A78BFA", marginTop: 0 }}>📅 Schedule Hearing</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {[
                { label: "Case Number *", key: "case_number", placeholder: "CASE/2026/0001" },
                { label: "Hearing Date *", key: "hearing_date", type: "date" },
                { label: "Court Room", key: "court_room", placeholder: "Court Room No. 3" },
                { label: "Judge Name", key: "judge_name", placeholder: "Hon. Justice ..." },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>{f.label}</label>
                  <input type={f.type || "text"} placeholder={f.placeholder} value={hearingForm[f.key]} onChange={e => setHearingForm({ ...hearingForm, [f.key]: e.target.value })} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "10px", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Hearing Time *</label>
                <select value={hearingForm.hearing_time} onChange={e => setHearingForm({ ...hearingForm, hearing_time: e.target.value })} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#60A5FA", border: "1px solid #334155", borderRadius: "10px" }}>
                  <option>10:00 AM</option>
                  <option>11:00 AM</option>
                  <option>12:00 PM</option>
                  <option>02:00 PM</option>
                  <option>03:00 PM</option>
                  <option>04:00 PM</option>
                </select>
              </div>
              <div>
                <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Hearing Type</label>
                <select value={hearingForm.hearing_type} onChange={e => setHearingForm({ ...hearingForm, hearing_type: e.target.value })} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#60A5FA", border: "1px solid #334155", borderRadius: "10px" }}>
                  <option>Regular Hearing</option>
                  <option>Bail Hearing</option>
                  <option>Final Arguments</option>
                  <option>Judgement Pronouncement</option>
                  <option>Witness Examination</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Notes / Special Instructions</label>
                <textarea placeholder="Any special instructions for this hearing..." value={hearingForm.notes} onChange={e => setHearingForm({ ...hearingForm, notes: e.target.value })} rows={3} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "10px", boxSizing: "border-box", resize: "vertical" }} />
              </div>
            </div>
            <button onClick={scheduleHearing} style={{ marginTop: "24px", background: "#7C3AED", color: "white", border: "none", padding: "14px 32px", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "16px" }}>
              📅 SCHEDULE HEARING
            </button>
          </div>
        )}

        {/* ===== TAB: UPLOAD JUDGEMENT ===== */}
        {activeTab === "upload-judgement" && (
          <div style={{ maxWidth: "700px" }}>
            <h2 style={{ color: "#FBBF24", marginTop: 0 }}>🏛️ Upload Final Judgement</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {[
                { label: "Case Number *", key: "case_number", placeholder: "CASE/2026/0001" },
                { label: "Judgement Date *", key: "judgement_date", type: "date" },
                { label: "Judge Name *", key: "judge_name", placeholder: "Hon. Justice ..." },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>{f.label}</label>
                  <input type={f.type || "text"} placeholder={f.placeholder} value={judgementForm[f.key]} onChange={e => setJudgementForm({ ...judgementForm, [f.key]: e.target.value })} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "10px", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Verdict *</label>
                <select value={judgementForm.verdict} onChange={e => setJudgementForm({ ...judgementForm, verdict: e.target.value })} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#FBBF24", border: "1px solid #334155", borderRadius: "10px" }}>
                  <option>Acquitted</option>
                  <option>Convicted</option>
                  <option>Dismissed</option>
                  <option>Settled Out of Court</option>
                  <option>Remanded</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Judgement Summary *</label>
                <textarea placeholder="Summarize the court's judgement..." value={judgementForm.judgement_summary} onChange={e => setJudgementForm({ ...judgementForm, judgement_summary: e.target.value })} rows={4} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "10px", boxSizing: "border-box", resize: "vertical" }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Next Steps / Sentencing</label>
                <textarea placeholder="e.g., 5 years rigorous imprisonment, Fine of ₹50,000..." value={judgementForm.next_steps} onChange={e => setJudgementForm({ ...judgementForm, next_steps: e.target.value })} rows={2} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "10px", boxSizing: "border-box", resize: "vertical" }} />
              </div>
            </div>
            <button onClick={uploadJudgement} style={{ marginTop: "24px", background: "#D97706", color: "white", border: "none", padding: "14px 32px", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "16px" }}>
              🏛️ RECORD JUDGEMENT
            </button>
          </div>
        )}

        {/* ===== TAB: CLOSE CASE ===== */}
        {activeTab === "close-case" && (
          <div style={{ maxWidth: "600px" }}>
            <h2 style={{ color: "#34D399", marginTop: 0 }}>🔒 Close Case</h2>
            <p style={{ color: "#94A3B8", marginBottom: "25px" }}>
              This action will officially close the case and remove it from the active docket. All changes are permanently audited.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Case Number *</label>
                <input type="text" placeholder="CASE/2026/0001" value={closureForm.case_number} onChange={e => setClosureForm({ ...closureForm, case_number: e.target.value })} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "10px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Final Status</label>
                <select value={closureForm.final_status} onChange={e => setClosureForm({ ...closureForm, final_status: e.target.value })} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#34D399", border: "1px solid #334155", borderRadius: "10px" }}>
                  <option>Closed - Judgement Passed</option>
                  <option>Closed - Disposed</option>
                  <option>Closed - Withdrawn</option>
                  <option>Closed - Settled</option>
                </select>
              </div>
              <div>
                <label style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Closure Reason *</label>
                <textarea placeholder="Provide reason for closure..." value={closureForm.closure_reason} onChange={e => setClosureForm({ ...closureForm, closure_reason: e.target.value })} rows={4} style={{ width: "100%", padding: "12px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "10px", boxSizing: "border-box", resize: "vertical" }} />
              </div>
            </div>
            <button onClick={closeCase} style={{ marginTop: "24px", background: "#10B981", color: "white", border: "none", padding: "14px 32px", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "16px" }}>
              🔒 OFFICIALLY CLOSE CASE
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
