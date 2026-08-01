"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function AdvocateBooking() {
  const BACKEND = "http://127.0.0.1:8000";

  const [role, setRole] = useState("User");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");

  const [booking, setBooking] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Advocate specific state
  const [incomingBookings, setIncomingBookings] = useState([]);
  const [assignedCases, setAssignedCases] = useState([]);
  const [advocateLoading, setAdvocateLoading] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem("user_role") || "User";
    setRole(userRole);
    setName(localStorage.getItem("user_name") || "");

    if (userRole === "Advocate" || userRole === "Super Admin") {
      loadAdvocateDashboard();
    }
  }, []);

  const getToken = () => localStorage.getItem("access_token");

  async function loadAdvocateDashboard() {
    setAdvocateLoading(true);
    try {
      // Fetch incoming bookings for advocate
      const bookingRes = await axios.get(`${BACKEND}/appointments`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setIncomingBookings(bookingRes.data || []);

      // Fetch assigned cases
      const caseRes = await axios.get(`${BACKEND}/advocate/assigned-cases`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setAssignedCases(caseRes.data || []);
    } catch (e) {
      console.error(e);
    }
    setAdvocateLoading(false);
  }

  async function handleBookingResponse(appointmentId, responseStatus) {
    try {
      await axios.post(
        `${BACKEND}/advocate/booking/respond`,
        {
          appointment_id: appointmentId,
          status: responseStatus,
        },
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      alert(`Booking #${appointmentId} has been ${responseStatus.toUpperCase()}! Citizen notified via SMS.`);
      loadAdvocateDashboard();
    } catch (e) {
      alert("Failed to update booking status.");
    }
  }

  async function updateCaseStatus(caseNumber, newStatus) {
    try {
      await axios.put(
        `${BACKEND}/advocate/update-case-status`,
        {
          case_number: caseNumber,
          status: newStatus,
        },
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      alert(`Case ${caseNumber} status updated to '${newStatus}'!`);
      loadAdvocateDashboard();
    } catch (e) {
      alert("Failed to update case status.");
    }
  }

  const advocates = [
    { name: "Ramesh Kumar", specialization: "Criminal Law", experience: "12 Years", rating: "4.8" },
    { name: "Priya Sharma", specialization: "Family Law", experience: "10 Years", rating: "4.7" },
    { name: "Arjun Reddy", specialization: "Property Law", experience: "8 Years", rating: "4.6" },
  ];

  const bookAppointment = async (advocateName) => {
    if (!name || !phone || !date || !timeSlot) {
      alert("Please fill all consultation details");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${BACKEND}/book-appointment`,
        {
          name,
          phone,
          advocate_name: advocateName,
          date,
          time_slot: timeSlot,
        },
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      setBooking({
        appointmentId: "APT" + Math.floor(Math.random() * 100000),
        name,
        phone,
        advocate: advocateName,
        date,
        timeSlot,
        status: "Pending Advocate Approval",
      });

      setShowPayment(true);
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }
      alert("Booking Request Failed");
    }
    setLoading(false);
  };

  const makePayment = async () => {
    try {
      const res = await axios.post(
        `${BACKEND}/payment/create`,
        {
          user_name: booking.name,
          user_email: booking.name + "@gmail.com",
          amount: 500,
          purpose: "Advocate Consultation",
          advocate_name: booking.advocate,
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      const paymentData = res.data.payment;

      await axios.post(
        `${BACKEND}/payment/verify`,
        { payment_id: paymentData.payment_id, status: "success" },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      setBooking({ ...booking, status: "Confirmed & Paid" });
      setShowPayment(false);
      setMessage("✅ Consultation fee paid! Twilio SMS confirmation sent to your phone.");
    } catch (err) {
      alert("Payment Failed");
    }
  };

  // ==========================================
  // ADVOCATE DASHBOARD VIEW
  // ==========================================
  if (role === "Advocate" || role === "Super Admin") {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0F19", padding: "40px", fontFamily: "-apple-system, sans-serif" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
          
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "35px" }}>
            <div>
              <h1 style={{ color: "#FBBF24", fontSize: "36px", fontWeight: "800", margin: 0 }}>
                ⚖️ Legal Advocate Management Portal
              </h1>
              <p style={{ color: "#CBD5E1", fontSize: "16px", marginTop: "6px" }}>
                Welcome Advocate {name} • Accept/Reject Consultation Requests & Manage Assigned Client Cases
              </p>
            </div>
            <button
              onClick={loadAdvocateDashboard}
              style={{ background: "rgba(245, 158, 11, 0.2)", color: "#FBBF24", border: "1px solid #F59E0B", padding: "12px 24px", borderRadius: "12px", cursor: "pointer", fontWeight: "700" }}
            >
              🔄 Refresh Requests
            </button>
          </div>

          {/* SECTION 1: INCOMING CITIZEN BOOKINGS */}
          <div className="glass-card" style={{ padding: "30px", marginBottom: "35px" }}>
            <h2 style={{ color: "#F8FAFC", marginTop: 0, marginBottom: "20px" }}>
              📩 Incoming Citizen Consultation Requests
            </h2>

            {advocateLoading ? (
              <p style={{ color: "#94A3B8" }}>Loading requests...</p>
            ) : incomingBookings.length === 0 ? (
              <p style={{ color: "#94A3B8" }}>No pending consultation requests at this time.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155" }}>
                      <th style={{ padding: "14px", color: "#CBD5E1", textAlign: "left" }}>ID</th>
                      <th style={{ padding: "14px", color: "#CBD5E1", textAlign: "left" }}>Citizen Name</th>
                      <th style={{ padding: "14px", color: "#CBD5E1", textAlign: "left" }}>Phone</th>
                      <th style={{ padding: "14px", color: "#CBD5E1", textAlign: "left" }}>Requested Date</th>
                      <th style={{ padding: "14px", color: "#CBD5E1", textAlign: "left" }}>Time Slot</th>
                      <th style={{ padding: "14px", color: "#CBD5E1", textAlign: "left" }}>Status</th>
                      <th style={{ padding: "14px", color: "#CBD5E1", textAlign: "left" }}>Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomingBookings.map((b, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "14px", color: "#60A5FA" }}>#{b.id}</td>
                        <td style={{ padding: "14px", color: "#F8FAFC", fontWeight: "600" }}>{b.name || b.recipient_name}</td>
                        <td style={{ padding: "14px", color: "#CBD5E1" }}>{b.phone || b.recipient_phone}</td>
                        <td style={{ padding: "14px", color: "#FBBF24" }}>{b.appointment_date || b.date}</td>
                        <td style={{ padding: "14px", color: "#CBD5E1" }}>{b.time_slot || b.timeSlot}</td>
                        <td style={{ padding: "14px" }}>
                          <span style={{
                            padding: "4px 12px",
                            borderRadius: "15px",
                            fontSize: "12px",
                            fontWeight: "700",
                            background: b.status === "Accepted" ? "rgba(16, 185, 129, 0.2)" : b.status === "Rejected" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                            color: b.status === "Accepted" ? "#34D399" : b.status === "Rejected" ? "#F87171" : "#FBBF24"
                          }}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px", display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => handleBookingResponse(b.id, "Accepted")}
                            style={{ background: "#10B981", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}
                          >
                            ✓ ACCEPT
                          </button>
                          <button
                            onClick={() => handleBookingResponse(b.id, "Rejected")}
                            style={{ background: "#EF4444", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}
                          >
                            ✕ REJECT
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 2: ASSIGNED CASES & STATUS UPDATES */}
          <div className="glass-card" style={{ padding: "30px" }}>
            <h2 style={{ color: "#F8FAFC", marginTop: 0, marginBottom: "20px" }}>
              📋 Assigned Client Cases
            </h2>

            {assignedCases.length === 0 ? (
              <p style={{ color: "#94A3B8" }}>No active client cases assigned to your bar council profile.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
                {assignedCases.map((c, idx) => (
                  <div key={idx} style={{ background: "#0F172A", padding: "20px", borderRadius: "16px", border: "1px solid #334155" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <h4 style={{ color: "#60A5FA", margin: 0 }}>{c.case_number}</h4>
                      <span style={{ color: "#FBBF24", fontSize: "13px", fontWeight: "700" }}>{c.status}</span>
                    </div>
                    <p style={{ color: "#F8FAFC", fontWeight: "600", margin: "0 0 10px 0" }}>{c.case_title}</p>
                    <p style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 6px 0" }}>Petitioner: {c.petitioner} vs {c.respondent}</p>
                    <p style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 15px 0" }}>Court: {c.court_name} | Next Hearing: {c.next_hearing_date}</p>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => updateCaseStatus(c.case_number, "In Arguments")}
                        style={{ flex: 1, padding: "8px", background: "#3B82F6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                      >
                        Set: In Arguments
                      </button>
                      <button
                        onClick={() => updateCaseStatus(c.case_number, "Judgement Reserved")}
                        style={{ flex: 1, padding: "8px", background: "#F59E0B", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                      >
                        Set: Reserved
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // CITIZEN USER BOOKING VIEW
  // ==========================================
  return (
    <div style={{ background: "#0B0F19", minHeight: "100vh", padding: "40px", fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1100px", margin: "auto" }}>
        
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ color: "#F8FAFC", fontSize: "40px", fontWeight: "800", margin: "0 0 10px 0" }}>
            ⚖️ Advocate Consultation Booking
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "17px" }}>
            Book appointments with verified senior legal practitioners. Receive Twilio SMS notifications & calls.
          </p>
        </div>

        {/* CONSULTATION DETAILS INPUT */}
        <div className="glass-card" style={{ padding: "35px", marginBottom: "35px" }}>
          <h2 style={{ color: "#D4AF37", marginTop: 0, marginBottom: "25px" }}>Your Contact & Consultation Details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ color: "#CBD5E1", fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Full Name *</label>
              <input
                type="text"
                placeholder="Enter Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: "14px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "12px" }}
              />
            </div>
            <div>
              <label style={{ color: "#CBD5E1", fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Phone Number (Twilio SMS Alert) *</label>
              <input
                type="text"
                placeholder="+91 XXXXX XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", padding: "14px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "12px" }}
              />
            </div>
            <div>
              <label style={{ color: "#CBD5E1", fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Preferred Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: "100%", padding: "14px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", borderRadius: "12px" }}
              />
            </div>
            <div>
              <label style={{ color: "#CBD5E1", fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Preferred Time Slot *</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                style={{ width: "100%", padding: "14px", background: "#0F172A", color: "#60A5FA", border: "1px solid #334155", borderRadius: "12px" }}
              >
                <option value="">Select Preferred Time</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:30 PM">02:30 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>
          </div>
        </div>

        {/* PAYMENT MODAL CARD */}
        {showPayment && booking && (
          <div className="glass-card" style={{ padding: "30px", marginBottom: "35px", border: "1px solid #D4AF37" }}>
            <h2 style={{ color: "#D4AF37", marginTop: 0 }}>💳 Complete Consultation Fee</h2>
            <p style={{ color: "#CBD5E1" }}>Advocate: <strong>{booking.advocate}</strong></p>
            <p style={{ color: "#CBD5E1" }}>Consultation Fee: <strong>₹500</strong></p>
            <button
              onClick={makePayment}
              style={{ background: "#10B981", color: "white", border: "none", padding: "14px 28px", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "16px" }}
            >
              PAY ₹500 VIA SECURE GATEWAY
            </button>
          </div>
        )}

        {message && (
          <div style={{ padding: "16px", background: "rgba(16, 185, 129, 0.15)", color: "#6EE7B7", border: "1px solid #10B981", borderRadius: "12px", marginBottom: "30px" }}>
            {message}
          </div>
        )}

        {/* AVAILABLE ADVOCATES LIST */}
        <h2 style={{ color: "#F8FAFC", textAlign: "center", marginBottom: "25px", fontSize: "28px" }}>
          Senior Verified Legal Practitioners
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "25px" }}>
          {advocates.map((item, index) => (
            <div key={index} className="glass-card" style={{ padding: "30px", textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#1E293B", margin: "0 auto 15px auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", border: "2px solid #3B82F6" }}>
                ⚖️
              </div>
              <h3 style={{ color: "#F8FAFC", margin: "0 0 6px 0" }}>{item.name}</h3>
              <p style={{ color: "#D4AF37", fontWeight: "600", margin: "0 0 10px 0" }}>{item.specialization} Specialist</p>
              <p style={{ color: "#94A3B8", fontSize: "14px", margin: "0 0 6px 0" }}>Experience: {item.experience}</p>
              <p style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "20px" }}>Rating: ⭐ {item.rating} / 5</p>

              <button
                onClick={() => bookAppointment(item.name)}
                disabled={loading}
                style={{ width: "100%", background: "#3B82F6", color: "white", border: "none", padding: "12px", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}
              >
                {loading ? "Processing..." : "BOOK CONSULTATION"}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
