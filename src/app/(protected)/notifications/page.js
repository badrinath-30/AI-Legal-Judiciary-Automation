"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND = "http://127.0.0.1:8000";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND}/notifications`);
      setNotifications(res.data || []);
    } catch (e) {
      console.error("Error loading notifications", e);
    }
    setLoading(false);
  }

  const filtered = notifications.filter(n =>
    filter === "All" || (n.notification_type || "").toLowerCase() === filter.toLowerCase()
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", padding: "40px 20px", fontFamily: "-apple-system, sans-serif", color: "#F8FAFC" }}>
      <div style={{ maxWidth: "1000px", margin: "auto" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #1E293B", paddingBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "800", margin: "0 0 8px 0", color: "#60A5FA" }}>
              🔔 Notifications & Alert Center
            </h1>
            <p style={{ color: "#94A3B8", margin: 0, fontSize: "15px" }}>
              Real-time hearing updates, case alerts, and SMS/Email notification logs
            </p>
          </div>
          <button
            onClick={fetchNotifications}
            style={{ padding: "10px 18px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.15)", border: "1px solid #3B82F6", color: "#60A5FA", fontWeight: "700", cursor: "pointer" }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* FILTERS */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
          {["All", "SMS", "Email", "System Alert"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "none",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                background: filter === f ? "#3B82F6" : "rgba(255,255,255,0.06)",
                color: filter === f ? "white" : "#94A3B8",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* NOTIFICATIONS LIST */}
        {loading ? (
          <p style={{ color: "#94A3B8", textAlign: "center", padding: "50px" }}>Loading notifications...</p>
        ) : filtered.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1E293B", borderRadius: "16px", padding: "60px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔕</div>
            <h3 style={{ color: "#CBD5E1", margin: "0 0 8px 0" }}>No Notifications Found</h3>
            <p style={{ color: "#94A3B8", margin: 0 }}>You're all caught up! New case updates and SMS alerts will appear here.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {filtered.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(17, 24, 39, 0.8)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  padding: "20px 24px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>
                      {item.notification_type?.toLowerCase() === "sms" ? "📱" : "✉️"}
                    </span>
                    <div>
                      <h4 style={{ margin: 0, color: "#F8FAFC", fontSize: "16px", fontWeight: "700" }}>
                        {item.subject || "Judiciary Notification"}
                      </h4>
                      <p style={{ margin: "2px 0 0", color: "#94A3B8", fontSize: "13px" }}>
                        To: {item.recipient_name} ({item.recipient_email || item.recipient_phone || "User"})
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "700",
                      background: item.status === "Sent" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                      color: item.status === "Sent" ? "#34D399" : "#FBBF24",
                    }}
                  >
                    {item.status || "Queued"}
                  </span>
                </div>
                <p style={{ margin: 0, color: "#CBD5E1", fontSize: "14px", lineHeight: "22px", background: "rgba(0,0,0,0.2)", padding: "12px 16px", borderRadius: "10px", borderLeft: "3px solid #3B82F6" }}>
                  {item.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
