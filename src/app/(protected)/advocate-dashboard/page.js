"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND = "http://127.0.0.1:8000";

export default function AdvocateDashboard() {
  const [activeTab, setActiveTab] = useState("bookings");
  const [advocateName, setAdvocateName] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [assignedCases, setAssignedCases] = useState([]);
  const [hearings, setHearings] = useState([]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Case Status Update modal/state
  const [selectedCaseNum, setSelectedCaseNum] = useState("");
  const [newStatus, setNewStatus] = useState("In Progress");
  const [hearingDate, setHearingDate] = useState("");
  const [notes, setNotes] = useState("");

  // Document Upload state
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("Evidence / Affidavits");
  const [docCaseId, setDocCaseId] = useState("");
  const [docFilePath, setDocFilePath] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    setAdvocateName(localStorage.getItem("user_name") || "Advocate");
    loadData();
  }, []);

  function getToken() {
    return localStorage.getItem("access_token");
  }

  function showMsg(msg, isErr = false) {
    if (isErr) {
      setError(msg);
      setSuccess("");
    } else {
      setSuccess(msg);
      setError("");
    }
    setTimeout(() => {
      setSuccess("");
      setError("");
    }, 4000);
  }

  async function loadData() {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [appRes, caseRes, hearRes] = await Promise.allSettled([
        axios.get(`${BACKEND}/appointments`, { headers }),
        axios.get(`${BACKEND}/advocate/assigned-cases`, { headers }),
        axios.get(`${BACKEND}/court-schedule`, { headers }),
      ]);

      if (appRes.status === "fulfilled") setAppointments(appRes.value.data || []);
      if (caseRes.status === "fulfilled") setAssignedCases(caseRes.value.data || []);
      if (hearRes.status === "fulfilled") setHearings(hearRes.value.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleBookingResponse(appId, status) {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      await axios.post(
        `${BACKEND}/advocate/booking/respond`,
        { appointment_id: appId, status },
        { headers }
      );
      showMsg(`Booking marked as '${status}'!`);
      loadData();
    } catch (e) {
      showMsg("Failed to update booking status.", true);
    }
  }

  async function handleUpdateCaseStatus(e) {
    e.preventDefault();
    if (!selectedCaseNum) return showMsg("Select a case number.", true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      await axios.put(
        `${BACKEND}/advocate/update-case-status`,
        {
          case_number: selectedCaseNum,
          status: newStatus,
          next_hearing_date: hearingDate || null,
          advocate_notes: notes || null,
        },
        { headers }
      );
      showMsg("Case status updated successfully!");
      setSelectedCaseNum("");
      setNotes("");
      loadData();
    } catch (e) {
      showMsg("Failed to update case status.", true);
    }
  }

  async function handleUploadDoc(e) {
    e.preventDefault();
    if (!docTitle || !docFilePath) return showMsg("Please enter Title and Document File Path.", true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      await axios.post(
        `${BACKEND}/documents`,
        {
          title: docTitle,
          document_type: docType,
          uploaded_by: advocateName || "Advocate",
          case_id: docCaseId || null,
          file_path: docFilePath,
        },
        { headers }
      );
      showMsg("Document uploaded successfully!");
      setDocTitle("");
      setDocFilePath("");
      setDocCaseId("");
    } catch (e) {
      showMsg("Document upload failed.", true);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", fontFamily: "-apple-system, sans-serif", color: "#F8FAFC" }}>
      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #0B0F19 100%)", borderBottom: "1px solid rgba(245, 158, 11, 0.3)", padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: "#FBBF24", fontSize: "28px", fontWeight: "800" }}>
            ⚖️ Advocate Legal Control Panel
          </h1>
          <p style={{ margin: "5px 0 0", color: "#94A3B8", fontSize: "14px" }}>
            Welcome, Advocate {advocateName} • Manage Cases, Client Bookings & Hearings
          </p>
        </div>
        <button
          onClick={loadData}
          style={{ padding: "10px 18px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", border: "1px solid #F59E0B", color: "#FBBF24", fontWeight: "700", cursor: "pointer" }}
        >
          🔄 Refresh Panel
        </button>
      </div>

      {/* ALERT MESSAGES */}
      {success && <div style={{ margin: "16px 40px", padding: "14px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10B981", borderRadius: "12px", color: "#34D399", fontWeight: "600" }}>✅ {success}</div>}
      {error && <div style={{ margin: "16px 40px", padding: "14px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", borderRadius: "12px", color: "#F87171", fontWeight: "600" }}>⚠️ {error}</div>}

      <div style={{ padding: "30px 40px" }}>
        {/* TABS */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "16px" }}>
          {[
            { id: "bookings", label: "📅 Client Bookings" },
            { id: "cases", label: "⚖️ Assigned Cases" },
            { id: "hearings", label: "🏛️ Court Hearings" },
            { id: "upload", label: "📄 Upload Document" },
            { id: "status", label: "✏️ Update Case Status" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "12px 20px",
                borderRadius: "12px",
                border: "none",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                background: activeTab === t.id ? "#D97706" : "rgba(255,255,255,0.06)",
                color: activeTab === t.id ? "white" : "#94A3B8",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: CLIENT BOOKINGS */}
        {activeTab === "bookings" && (
          <div>
            <h2 style={{ color: "#FBBF24", marginBottom: "20px" }}>Client Consultation Bookings</h2>
            {appointments.length === 0 ? (
              <p style={{ color: "#94A3B8" }}>No consultation bookings found.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                {appointments.map((a, i) => (
                  <div key={i} style={{ background: "rgba(30, 41, 59, 0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <h4 style={{ margin: 0, color: "#F8FAFC", fontSize: "18px" }}>{a.name || a.user_name || "Client"}</h4>
                      <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", background: a.status === "Accepted" ? "rgba(16, 185, 129, 0.2)" : a.status === "Rejected" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)", color: a.status === "Accepted" ? "#34D399" : a.status === "Rejected" ? "#F87171" : "#FBBF24" }}>
                        {a.status || "Pending"}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0", color: "#94A3B8", fontSize: "14px" }}>📞 {a.phone}</p>
                    <p style={{ margin: "4px 0", color: "#94A3B8", fontSize: "14px" }}>📅 Date: {a.appointment_date || a.date}</p>
                    <p style={{ margin: "4px 0", color: "#94A3B8", fontSize: "14px" }}>⏰ Slot: {a.time_slot}</p>

                    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                      <button
                        onClick={() => handleBookingResponse(a.id, "Accepted")}
                        style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10B981", color: "#34D399", fontWeight: "700", cursor: "pointer" }}
                      >
                        ✅ Accept
                      </button>
                      <button
                        onClick={() => handleBookingResponse(a.id, "Rejected")}
                        style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.2)", border: "1px solid #EF4444", color: "#F87171", fontWeight: "700", cursor: "pointer" }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ASSIGNED CASES */}
        {activeTab === "cases" && (
          <div>
            <h2 style={{ color: "#FBBF24", marginBottom: "20px" }}>Assigned Legal Cases</h2>
            {assignedCases.length === 0 ? (
              <p style={{ color: "#94A3B8" }}>No active assigned cases found.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#0F172A" }}>
                      {["Case Number", "Title", "Petitioner vs Respondent", "Court", "Priority", "Status"].map((h) => (
                        <th key={h} style={{ padding: "14px", color: "#CBD5E1", textAlign: "left", fontSize: "13px", borderBottom: "1px solid #334155" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assignedCases.map((c, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "14px", color: "#FBBF24", fontWeight: "700" }}>{c.case_number}</td>
                        <td style={{ padding: "14px", color: "#F8FAFC" }}>{c.case_title}</td>
                        <td style={{ padding: "14px", color: "#94A3B8", fontSize: "13px" }}>{c.petitioner} vs {c.respondent}</td>
                        <td style={{ padding: "14px", color: "#94A3B8", fontSize: "13px" }}>{c.court_name}</td>
                        <td style={{ padding: "14px", color: "#60A5FA", fontSize: "13px" }}>{c.priority}</td>
                        <td style={{ padding: "14px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.2)", color: "#60A5FA", fontSize: "12px", fontWeight: "700" }}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COURT HEARINGS */}
        {activeTab === "hearings" && (
          <div>
            <h2 style={{ color: "#FBBF24", marginBottom: "20px" }}>Assigned Court Proceedings & Hearings</h2>
            {hearings.length === 0 ? (
              <p style={{ color: "#94A3B8" }}>No scheduled hearings listed.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                {hearings.map((h, i) => (
                  <div key={i} style={{ background: "rgba(30, 41, 59, 0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "20px" }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#F8FAFC" }}>🏛️ {h.court_name || "Court Session"}</h4>
                    <p style={{ margin: "4px 0", color: "#FBBF24", fontSize: "14px", fontWeight: "700" }}>Case #: {h.case_number}</p>
                    <p style={{ margin: "4px 0", color: "#94A3B8", fontSize: "13px" }}>📅 Date: {h.hearing_date}</p>
                    <p style={{ margin: "4px 0", color: "#94A3B8", fontSize: "13px" }}>⚖️ Judge: {h.judge_name || "Hon'ble Judge"}</p>
                    <p style={{ margin: "4px 0", color: "#34D399", fontSize: "13px" }}>Purpose: {h.purpose || "Hearing"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: UPLOAD DOCUMENT */}
        {activeTab === "upload" && (
          <div style={{ maxWidth: "600px", background: "rgba(30, 41, 59, 0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "30px" }}>
            <h2 style={{ color: "#FBBF24", marginTop: 0 }}>Upload Case Evidence & Legal Affidavits</h2>
            <form onSubmit={handleUploadDoc}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ color: "#CBD5E1", fontSize: "14px", display: "block", marginBottom: "6px" }}>Document Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Witness Affidavit / Evidence Submission"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  style={{ width: "100%", padding: "12px", background: "#0B0F19", color: "white", border: "1px solid #334155", borderRadius: "10px" }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ color: "#CBD5E1", fontSize: "14px", display: "block", marginBottom: "6px" }}>Case Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. HC/2026/102"
                  value={docCaseId}
                  onChange={(e) => setDocCaseId(e.target.value)}
                  style={{ width: "100%", padding: "12px", background: "#0B0F19", color: "white", border: "1px solid #334155", borderRadius: "10px" }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ color: "#CBD5E1", fontSize: "14px", display: "block", marginBottom: "6px" }}>Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  style={{ width: "100%", padding: "12px", background: "#0B0F19", color: "white", border: "1px solid #334155", borderRadius: "10px" }}
                >
                  <option value="Evidence / Affidavits">Evidence / Affidavits</option>
                  <option value="Vakalatnama">Vakalatnama</option>
                  <option value="Bail Application">Bail Application</option>
                  <option value="Legal Notice">Legal Notice</option>
                </select>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#CBD5E1", fontSize: "14px", display: "block", marginBottom: "6px" }}>File Path / Document URL *</label>
                <input
                  type="text"
                  placeholder="/uploads/affidavit_case102.pdf"
                  value={docFilePath}
                  onChange={(e) => setDocFilePath(e.target.value)}
                  style={{ width: "100%", padding: "12px", background: "#0B0F19", color: "white", border: "1px solid #334155", borderRadius: "10px" }}
                />
              </div>
              <button
                type="submit"
                style={{ width: "100%", padding: "14px", background: "#D97706", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}
              >
                Upload Document
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: UPDATE CASE STATUS */}
        {activeTab === "status" && (
          <div style={{ maxWidth: "600px", background: "rgba(30, 41, 59, 0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "30px" }}>
            <h2 style={{ color: "#FBBF24", marginTop: 0 }}>Update Case Proceedings & Hearing Status</h2>
            <form onSubmit={handleUpdateCaseStatus}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ color: "#CBD5E1", fontSize: "14px", display: "block", marginBottom: "6px" }}>Case Number *</label>
                <input
                  type="text"
                  placeholder="e.g. HC/2026/101"
                  value={selectedCaseNum}
                  onChange={(e) => setSelectedCaseNum(e.target.value)}
                  style={{ width: "100%", padding: "12px", background: "#0B0F19", color: "white", border: "1px solid #334155", borderRadius: "10px" }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ color: "#CBD5E1", fontSize: "14px", display: "block", marginBottom: "6px" }}>New Case Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: "100%", padding: "12px", background: "#0B0F19", color: "white", border: "1px solid #334155", borderRadius: "10px" }}
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Hearing Scheduled">Hearing Scheduled</option>
                  <option value="Evidence Submitted">Evidence Submitted</option>
                  <option value="Arguments Completed">Arguments Completed</option>
                  <option value="Awaiting Verdict">Awaiting Verdict</option>
                </select>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ color: "#CBD5E1", fontSize: "14px", display: "block", marginBottom: "6px" }}>Next Hearing Date</label>
                <input
                  type="date"
                  value={hearingDate}
                  onChange={(e) => setHearingDate(e.target.value)}
                  style={{ width: "100%", padding: "12px", background: "#0B0F19", color: "white", border: "1px solid #334155", borderRadius: "10px" }}
                />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#CBD5E1", fontSize: "14px", display: "block", marginBottom: "6px" }}>Advocate Consultation Notes</label>
                <textarea
                  rows="4"
                  placeholder="Enter detailed legal notes for court or client consultation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: "100%", padding: "12px", background: "#0B0F19", color: "white", border: "1px solid #334155", borderRadius: "10px" }}
                />
              </div>
              <button
                type="submit"
                style={{ width: "100%", padding: "14px", background: "#D97706", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}
              >
                Update Case Record
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
