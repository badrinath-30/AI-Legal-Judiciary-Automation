"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND = "http://127.0.0.1:8000";
const getToken = () => localStorage.getItem("access_token");

const VALID_ROLES = ["User", "Police", "Advocate", "Court Management", "Super Admin"];

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("analytics");
  const [adminName, setAdminName] = useState("");

  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [suspiciousEvents, setSuspiciousEvents] = useState([]);

  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [roleFilter, setRoleFilter] = useState("All");
  const [auditSearch, setAuditSearch] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role !== "Super Admin") {
      window.location.href = "/dashboard";
      return;
    }
    setAdminName(localStorage.getItem("user_name") || "Admin");
    loadAnalytics();
  }, []);

  function showSuccess(msg) { setSuccessMsg(msg); setErrorMsg(""); setTimeout(() => setSuccessMsg(""), 5000); }
  function showError(msg) { setErrorMsg(msg); setSuccessMsg(""); setTimeout(() => setErrorMsg(""), 5000); }

  async function loadAnalytics() {
    setLoadingAnalytics(true);
    try {
      const res = await axios.get(`${BACKEND}/admin/analytics`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setAnalytics(res.data);
    } catch (e) {
      showError("Failed to load analytics.");
    }
    setLoadingAnalytics(false);
  }

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const res = await axios.get(`${BACKEND}/admin/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setUsers(res.data || []);
    } catch (e) {
      showError("Failed to load users.");
    }
    setLoadingUsers(false);
  }

  async function loadAuditLogs() {
    setLoadingAudit(true);
    try {
      const res = await axios.get(`${BACKEND}/admin/audit-logs?limit=200`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setAuditLogs(res.data || []);
    } catch (e) {
      showError("Failed to load audit logs.");
    }
    setLoadingAudit(false);
  }

  async function loadSecurity() {
    setLoadingSecurity(true);
    try {
      const res = await axios.get(`${BACKEND}/admin/security/suspicious`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSuspiciousEvents(res.data?.suspicious_events || []);
    } catch (e) {
      showError("Failed to load security monitor.");
    }
    setLoadingSecurity(false);
  }

  async function updateUserRole(userId, newRole) {
    try {
      await axios.put(
        `${BACKEND}/admin/user/role`,
        { user_id: userId, new_role: newRole },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      showSuccess(`User #${userId} role updated to '${newRole}'.`);
      loadUsers();
    } catch (e) {
      showError(e?.response?.data?.detail || "Role update failed.");
    }
  }

  async function deleteUser(userId, email) {
    if (!confirm(`⚠️ Permanently delete user: ${email}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${BACKEND}/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      showSuccess(`User ${email} removed from system.`);
      loadUsers();
    } catch (e) {
      showError(e?.response?.data?.detail || "Delete failed.");
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "analytics") loadAnalytics();
    if (tab === "users") loadUsers();
    if (tab === "audit") loadAuditLogs();
    if (tab === "security") loadSecurity();
  };

  const roleColor = (r) => {
    switch (r) {
      case "Super Admin": return { bg: "rgba(168, 85, 247, 0.2)", color: "#C084FC" };
      case "Police": return { bg: "rgba(239, 68, 68, 0.2)", color: "#F87171" };
      case "Advocate": return { bg: "rgba(245, 158, 11, 0.2)", color: "#FBBF24" };
      case "Court Management": return { bg: "rgba(16, 185, 129, 0.2)", color: "#34D399" };
      default: return { bg: "rgba(96, 165, 250, 0.2)", color: "#60A5FA" };
    }
  };

  const actionColor = (a) => {
    if (!a) return "#94A3B8";
    if (a.includes("DELETE") || a.includes("FAILED")) return "#F87171";
    if (a.includes("CREATE") || a.includes("REGISTER")) return "#34D399";
    if (a.includes("UPDATE") || a.includes("RESPOND")) return "#FBBF24";
    return "#60A5FA";
  };

  const filteredUsers = users.filter(u => roleFilter === "All" || u.role === roleFilter);
  const filteredLogs = auditLogs.filter(l =>
    !auditSearch ||
    (l.action || "").toLowerCase().includes(auditSearch.toLowerCase()) ||
    (l.user_email || "").toLowerCase().includes(auditSearch.toLowerCase()) ||
    (l.details || "").toLowerCase().includes(auditSearch.toLowerCase())
  );

  const tabs = [
    { id: "analytics", label: "📊 Analytics" },
    { id: "users", label: "👥 User Management" },
    { id: "audit", label: "📋 Audit Logs" },
    { id: "security", label: "🛡️ Security Monitor" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #1a0a3e 0%, #0B0F19 100%)", borderBottom: "1px solid rgba(168, 85, 247, 0.3)", padding: "22px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: "#C084FC", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            🛡️ Super Admin Control Panel
          </h1>
          <p style={{ margin: "5px 0 0", color: "#94A3B8", fontSize: "14px" }}>
            {adminName} • Full System Access • All Modules
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "12px", padding: "8px 16px", color: "#C084FC", fontSize: "13px", fontWeight: "700" }}>
            🔴 LIVE SYSTEM
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {successMsg && <div style={{ margin: "16px 40px", padding: "14px 20px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10B981", borderRadius: "12px", color: "#34D399", fontWeight: "600" }}>✅ {successMsg}</div>}
      {errorMsg && <div style={{ margin: "16px 40px", padding: "14px 20px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", borderRadius: "12px", color: "#F87171", fontWeight: "600" }}>⚠️ {errorMsg}</div>}

      <div style={{ padding: "30px 40px" }}>

        {/* TAB NAV */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "20px" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)} style={{
              padding: "12px 24px", borderRadius: "12px", border: "none", cursor: "pointer",
              fontWeight: "700", fontSize: "14px",
              background: activeTab === t.id ? "#7C3AED" : "rgba(255,255,255,0.07)",
              color: activeTab === t.id ? "white" : "#94A3B8",
              transition: "all 0.2s"
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== TAB: ANALYTICS ===== */}
        {activeTab === "analytics" && (
          <div>
            {loadingAnalytics ? (
              <p style={{ color: "#94A3B8", textAlign: "center", padding: "60px" }}>Loading system analytics...</p>
            ) : analytics ? (
              <>
                {/* PRIMARY STATS */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                  {[
                    { label: "Total Users", value: analytics.users?.total, icon: "👥", color: "#60A5FA" },
                    { label: "Total Cases", value: analytics.cases?.total, icon: "⚖️", color: "#A78BFA" },
                    { label: "Active Cases", value: analytics.cases?.open, icon: "🔓", color: "#FBBF24" },
                    { label: "Total FIRs", value: analytics.firs?.total, icon: "📋", color: "#F87171" },
                    { label: "Appointments", value: analytics.appointments?.total, icon: "📅", color: "#34D399" },
                    { label: "Documents", value: analytics.documents?.total, icon: "📄", color: "#FB923C" },
                    { label: "Audit Events", value: analytics.audit?.total_events, icon: "🔍", color: "#C084FC" },
                    { label: "Cases Closed", value: analytics.cases?.closed, icon: "🔒", color: "#6EE7B7" },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "22px", textAlign: "center" }}>
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>{stat.icon}</div>
                      <div style={{ fontSize: "32px", fontWeight: "800", color: stat.color }}>{stat.value ?? 0}</div>
                      <div style={{ color: "#94A3B8", fontSize: "12px", marginTop: "4px" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* SECONDARY GRIDS */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  {/* Users by Role */}
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px" }}>
                    <h3 style={{ color: "#F8FAFC", margin: "0 0 20px 0" }}>👥 User Distribution by Role</h3>
                    {Object.entries(analytics.users?.by_role || {}).map(([role, count]) => {
                      const rc = roleColor(role);
                      const pct = analytics.users?.total ? Math.round((count / analytics.users.total) * 100) : 0;
                      return (
                        <div key={role} style={{ marginBottom: "14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span style={{ color: rc.color, fontWeight: "700", fontSize: "14px" }}>{role}</span>
                            <span style={{ color: "#94A3B8", fontSize: "14px" }}>{count} ({pct}%)</span>
                          </div>
                          <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: rc.color, borderRadius: "4px", transition: "width 1s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Appointment Stats */}
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px" }}>
                    <h3 style={{ color: "#F8FAFC", margin: "0 0 20px 0" }}>📅 Appointment Status Breakdown</h3>
                    {[
                      { label: "Pending Approval", value: analytics.appointments?.pending, color: "#FBBF24" },
                      { label: "Accepted", value: analytics.appointments?.accepted, color: "#34D399" },
                      { label: "Rejected", value: analytics.appointments?.rejected, color: "#F87171" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ color: "#CBD5E1", fontSize: "14px" }}>{item.label}</span>
                        <span style={{ color: item.color, fontWeight: "800", fontSize: "18px" }}>{item.value ?? 0}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: "20px" }}>
                      <h4 style={{ color: "#F8FAFC", margin: "0 0 10px 0", fontSize: "14px" }}>FIR Investigation Pipeline</h4>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                        <span style={{ color: "#94A3B8", fontSize: "13px" }}>Under Investigation</span>
                        <span style={{ color: "#FBBF24", fontWeight: "700" }}>{analytics.firs?.under_investigation ?? 0}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                        <span style={{ color: "#94A3B8", fontSize: "13px" }}>Charge Sheet Filed</span>
                        <span style={{ color: "#F87171", fontWeight: "700" }}>{analytics.firs?.charge_sheet_filed ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : <p style={{ color: "#94A3B8" }}>No analytics data available.</p>}
          </div>
        )}

        {/* ===== TAB: USER MANAGEMENT ===== */}
        {activeTab === "users" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ color: "#F8FAFC", margin: 0 }}>Registered Users ({filteredUsers.length})</h2>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {["All", ...VALID_ROLES].map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)} style={{
                    padding: "7px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "700",
                    background: roleFilter === r ? roleColor(r).bg : "rgba(255,255,255,0.07)",
                    color: roleFilter === r ? roleColor(r).color : "#94A3B8",
                  }}>{r}</button>
                ))}
                <button onClick={loadUsers} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #334155", cursor: "pointer", background: "transparent", color: "#60A5FA", fontWeight: "700", fontSize: "13px" }}>🔄 Refresh</button>
              </div>
            </div>

            {loadingUsers ? (
              <p style={{ color: "#94A3B8" }}>Loading users...</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#0F172A" }}>
                      {["ID", "Name", "Email", "Phone", "Current Role", "Profile", "Change Role", "Action"].map(h => (
                        <th key={h} style={{ padding: "14px 12px", color: "#CBD5E1", textAlign: "left", fontWeight: "700", fontSize: "13px", borderBottom: "1px solid #334155" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, idx) => {
                      const rc = roleColor(u.role);
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "12px", color: "#475569", fontSize: "13px" }}>#{u.id}</td>
                          <td style={{ padding: "12px", color: "#F8FAFC", fontWeight: "600" }}>{u.full_name}</td>
                          <td style={{ padding: "12px", color: "#94A3B8", fontSize: "13px" }}>{u.email}</td>
                          <td style={{ padding: "12px", color: "#94A3B8", fontSize: "13px" }}>{u.phone || "—"}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: rc.bg, color: rc.color }}>{u.role || "User"}</span>
                          </td>
                          <td style={{ padding: "12px", fontSize: "12px", color: "#94A3B8" }}>
                            {u.police_station && <div>🚔 {u.police_station}</div>}
                            {u.bar_council_id && <div>⚖️ {u.bar_council_id}</div>}
                            {u.court_id && <div>🏛️ {u.court_id}</div>}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <select
                              defaultValue={u.role || "User"}
                              onChange={e => updateUserRole(u.id, e.target.value)}
                              style={{ padding: "6px 10px", background: "#1E293B", color: "#60A5FA", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}
                            >
                              {VALID_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <button
                              onClick={() => deleteUser(u.id, u.email)}
                              style={{ padding: "6px 12px", background: "rgba(239, 68, 68, 0.2)", color: "#F87171", border: "1px solid #EF4444", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && <p style={{ color: "#94A3B8", textAlign: "center", padding: "40px" }}>No users found for selected filter.</p>}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: AUDIT LOGS ===== */}
        {activeTab === "audit" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ color: "#F8FAFC", margin: 0 }}>System Audit Trail ({filteredLogs.length} events)</h2>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Search by action, email, details..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  style={{ padding: "8px 14px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "10px", width: "280px", fontSize: "13px" }}
                />
                <button onClick={loadAuditLogs} style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid #334155", cursor: "pointer", background: "transparent", color: "#60A5FA", fontWeight: "700", fontSize: "13px" }}>🔄</button>
              </div>
            </div>

            {loadingAudit ? (
              <p style={{ color: "#94A3B8" }}>Loading audit logs...</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#0F172A" }}>
                      {["#", "Action", "Resource", "User Email", "Role", "Details", "Timestamp"].map(h => (
                        <th key={h} style={{ padding: "12px 14px", color: "#CBD5E1", textAlign: "left", fontWeight: "700", fontSize: "12px", borderBottom: "1px solid #334155" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "11px 14px", color: "#475569", fontSize: "12px" }}>{log.id}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <span style={{ color: actionColor(log.action), fontWeight: "700", fontSize: "12px" }}>{log.action}</span>
                        </td>
                        <td style={{ padding: "11px 14px", color: "#94A3B8", fontSize: "12px" }}>{log.resource}</td>
                        <td style={{ padding: "11px 14px", color: "#CBD5E1", fontSize: "12px" }}>{log.user_email}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <span style={{ padding: "3px 8px", borderRadius: "8px", fontSize: "10px", fontWeight: "700", ...roleColor(log.user_role) }}>{log.user_role}</span>
                        </td>
                        <td style={{ padding: "11px 14px", color: "#94A3B8", fontSize: "11px", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.details}</td>
                        <td style={{ padding: "11px 14px", color: "#475569", fontSize: "11px" }}>{log.timestamp ? log.timestamp.substring(0, 19).replace("T", " ") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredLogs.length === 0 && <p style={{ color: "#94A3B8", textAlign: "center", padding: "40px" }}>No audit events found.</p>}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: SECURITY MONITOR ===== */}
        {activeTab === "security" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#F87171", margin: 0 }}>🛡️ Security & Suspicious Activity Monitor</h2>
              <button onClick={loadSecurity} style={{ padding: "8px 18px", borderRadius: "10px", border: "1px solid #EF4444", cursor: "pointer", background: "rgba(239, 68, 68, 0.1)", color: "#F87171", fontWeight: "700", fontSize: "13px" }}>🔄 Scan Now</button>
            </div>

            {suspiciousEvents.length === 0 && !loadingSecurity && (
              <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10B981", borderRadius: "16px", padding: "30px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                <h3 style={{ color: "#34D399", margin: "0 0 8px 0" }}>All Clear — No Suspicious Events Detected</h3>
                <p style={{ color: "#94A3B8", margin: 0 }}>No high-risk actions such as unauthorized deletions or role escalations found.</p>
              </div>
            )}

            {loadingSecurity && <p style={{ color: "#94A3B8" }}>Scanning for suspicious activity...</p>}

            {suspiciousEvents.length > 0 && (
              <>
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #EF4444", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px", color: "#F87171", fontWeight: "700" }}>
                  ⚠️ {suspiciousEvents.length} suspicious event{suspiciousEvents.length > 1 ? "s" : ""} detected. Review immediately.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {suspiciousEvents.map((e, idx) => (
                    <div key={idx} style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px", padding: "18px 22px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <span style={{ color: "#F87171", fontWeight: "800", fontSize: "14px" }}>⚑ {e.action}</span>
                        <span style={{ color: "#475569", fontSize: "12px" }}>{e.timestamp ? e.timestamp.substring(0, 19).replace("T", " ") : "—"}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div><span style={{ color: "#94A3B8", fontSize: "12px" }}>User: </span><span style={{ color: "#CBD5E1", fontSize: "12px", fontWeight: "600" }}>{e.user_email}</span></div>
                        <div><span style={{ color: "#94A3B8", fontSize: "12px" }}>Role: </span><span style={{ ...roleColor(e.user_role), fontSize: "12px", fontWeight: "600" }}>{e.user_role}</span></div>
                        <div><span style={{ color: "#94A3B8", fontSize: "12px" }}>Resource: </span><span style={{ color: "#CBD5E1", fontSize: "12px" }}>{e.resource}</span></div>
                      </div>
                      {e.details && <p style={{ color: "#94A3B8", margin: "10px 0 0", fontSize: "12px", fontStyle: "italic" }}>{e.details}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}