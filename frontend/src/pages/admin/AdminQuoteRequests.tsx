import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./AdminQuoteRequests.module.css";

interface QuoteRequest {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  home_type: string | null;
  household_size: string | null;
  device_count: string | null;
  primary_use: string | null;
  works_from_home: string | null;
  has_smart_home: boolean;
  smart_home_details: string | null;
  current_protection: string[] | null;
  past_incidents: boolean;
  incident_details: string | null;
  online_activity: string | null;
  technical_comfort: string | null;
  budget: number | null;
  security_concerns: string | null;
  urgency: string | null;
  preferred_contact: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUS_OPTIONS = ["pending", "reviewed", "quoted", "accepted", "rejected"];

export default function AdminQuoteRequests() {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/quote-requests", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          navigate("/admin/login");
          return;
        }
        throw new Error("Failed to fetch quote requests");
      }
      const data = await res.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;

    try {
      const res = await fetch(`/api/admin/quote-requests/${selectedRequest.id}`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus || undefined,
          adminNotes: adminNotes || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      fetchRequests();
      setSelectedRequest(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#fdb927";
      case "reviewed": return "#3b82f6";
      case "quoted": return "#8b5cf6";
      case "accepted": return "#22c55e";
      case "rejected": return "#ef4444";
      default: return "#888";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <div className={styles.loading}>Loading quote requests...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quote Requests</h1>
        <p className={styles.subtitle}>
          {requests.length} request{requests.length !== 1 ? "s" : ""} submitted
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        {requests.map((req) => (
          <div
            key={req.id}
            className={styles.card}
            onClick={() => {
              setSelectedRequest(req);
              setAdminNotes(req.admin_notes || "");
              setNewStatus(req.status);
            }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <strong>{req.first_name} {req.last_name}</strong>
                <span className={styles.email}>{req.email}</span>
              </div>
              <span
                className={styles.statusBadge}
                style={{ backgroundColor: getStatusColor(req.status) }}
              >
                {req.status}
              </span>
            </div>

            <div className={styles.cardDetails}>
              <div className={styles.detailRow}>
                <span>Budget:</span>
                <span>${req.budget || "N/A"}/mo</span>
              </div>
              <div className={styles.detailRow}>
                <span>Devices:</span>
                <span>{req.device_count || "N/A"}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Urgency:</span>
                <span>{req.urgency || "N/A"}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Comfort:</span>
                <span>{req.technical_comfort || "N/A"}</span>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <span>{formatDate(req.created_at)}</span>
              {req.phone && <span>{req.phone}</span>}
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className={styles.empty}>
            No quote requests yet. They'll appear here when users submit the quote form.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRequest(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Quote Request #{selectedRequest.id}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedRequest(null)}>
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              <section className={styles.section}>
                <h3>Contact Info</h3>
                <div className={styles.infoGrid}>
                  <div><strong>Name:</strong> {selectedRequest.first_name} {selectedRequest.last_name}</div>
                  <div><strong>Email:</strong> {selectedRequest.email}</div>
                  <div><strong>Phone:</strong> {selectedRequest.phone || "N/A"}</div>
                  <div><strong>Home Type:</strong> {selectedRequest.home_type || "N/A"}</div>
                  <div><strong>Household:</strong> {selectedRequest.household_size || "N/A"}</div>
                  <div><strong>Preferred Contact:</strong> {selectedRequest.preferred_contact}</div>
                </div>
              </section>

              <section className={styles.section}>
                <h3>Setup</h3>
                <div className={styles.infoGrid}>
                  <div><strong>Devices:</strong> {selectedRequest.device_count || "N/A"}</div>
                  <div><strong>Primary Use:</strong> {selectedRequest.primary_use || "N/A"}</div>
                  <div><strong>WFH:</strong> {selectedRequest.works_from_home || "N/A"}</div>
                  <div><strong>Smart Home:</strong> {selectedRequest.has_smart_home ? "Yes" : "No"}</div>
                </div>
                {selectedRequest.smart_home_details && (
                  <p><strong>Smart Devices:</strong> {selectedRequest.smart_home_details}</p>
                )}
              </section>

              <section className={styles.section}>
                <h3>Security</h3>
                <div className={styles.infoGrid}>
                  <div><strong>Tech Comfort:</strong> {selectedRequest.technical_comfort || "N/A"}</div>
                  <div><strong>Online Activity:</strong> {selectedRequest.online_activity || "N/A"}</div>
                  <div><strong>Past Incidents:</strong> {selectedRequest.past_incidents ? "Yes" : "No"}</div>
                </div>
                {selectedRequest.current_protection && selectedRequest.current_protection.length > 0 && (
                  <p><strong>Current Protection:</strong> {selectedRequest.current_protection.join(", ")}</p>
                )}
                {selectedRequest.incident_details && (
                  <p><strong>Incident Details:</strong> {selectedRequest.incident_details}</p>
                )}
              </section>

              <section className={styles.section}>
                <h3>Needs</h3>
                <div className={styles.infoGrid}>
                  <div><strong>Budget:</strong> ${selectedRequest.budget}/mo</div>
                  <div><strong>Urgency:</strong> {selectedRequest.urgency || "N/A"}</div>
                </div>
                {selectedRequest.security_concerns && (
                  <p><strong>Concerns:</strong> {selectedRequest.security_concerns}</p>
                )}
              </section>

              <section className={styles.section}>
                <h3>Admin Actions</h3>
                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this request..."
                    rows={3}
                  />
                </div>
                <button className={styles.saveBtn} onClick={handleUpdateStatus}>
                  Save Changes
                </button>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
