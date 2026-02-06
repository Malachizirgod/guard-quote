import { useState, useEffect, useCallback } from "react";
import { getAuthHeaders, useAuth } from "../../context/AuthContext";
import { 
  Lightbulb, Plus, ChevronUp, Trash2, ExternalLink, Filter,
  AlertCircle, Clock, CheckCircle, XCircle, ArrowUpDown
} from "lucide-react";

interface Feature {
  id: number;
  title: string;
  description: string | null;
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "rejected";
  category: string | null;
  requester_name: string;
  assignee_name: string | null;
  monday_item_id: string | null;
  votes: number;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  byStatus: { status: string; count: string }[];
  byPriority: { priority: string; count: string }[];
}

const priorityColors = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusIcons = {
  pending: <Clock className="w-4 h-4" />,
  in_progress: <ArrowUpDown className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
};

const statusColors = {
  pending: "text-yellow-400",
  in_progress: "text-blue-400",
  completed: "text-green-400",
  rejected: "text-red-400",
};

export default function Features() {
  const { user } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", category: "" });
  const [saving, setSaving] = useState(false);

  const fetchFeatures = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterPriority) params.set("priority", filterPriority);
      
      const [featuresRes, statsRes] = await Promise.all([
        fetch(`/api/features?${params}`, { headers: getAuthHeaders() }),
        fetch("/api/features/stats", { headers: getAuthHeaders() }),
      ]);
      
      setFeatures(await featuresRes.json());
      setStats(await statsRes.json());
    } catch (e) {
      console.error("Failed to fetch features", e);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority]);

  useEffect(() => { fetchFeatures(); }, [fetchFeatures]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/features", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...form, requested_by: user?.id }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ title: "", description: "", priority: "medium", category: "" });
    fetchFeatures();
  };

  const handleVote = async (id: number) => {
    await fetch(`/api/features/${id}/vote`, { method: "POST", headers: getAuthHeaders() });
    fetchFeatures();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/features/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    fetchFeatures();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this feature request?")) return;
    await fetch(`/api/features/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    setSelectedFeature(null);
    fetchFeatures();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  });

  if (loading) return <div className="p-8 text-text-secondary">Loading features...</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Lightbulb className="w-7 h-7 text-accent" />
            Feature Requests
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Track and prioritize feature requests • {stats?.total || 0} total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-orange-600 text-black font-medium rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.byStatus.map(({ status, count }) => (
            <div key={status} className="bg-surface border border-border rounded-lg p-4">
              <div className={`flex items-center gap-2 ${statusColors[status as keyof typeof statusColors]}`}>
                {statusIcons[status as keyof typeof statusIcons]}
                <span className="text-sm capitalize">{status.replace("_", " ")}</span>
              </div>
              <div className="text-2xl font-bold mt-1">{count}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Feature List */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-sm">Requests ({features.length})</h2>
          </div>
          {features.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No feature requests yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  onClick={() => setSelectedFeature(feature)}
                  className={`p-4 cursor-pointer hover:bg-elevated/50 transition ${
                    selectedFeature?.id === feature.id ? "bg-elevated" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleVote(feature.id); }}
                      className="flex flex-col items-center p-2 rounded hover:bg-accent/10 transition group"
                    >
                      <ChevronUp className="w-5 h-5 text-text-muted group-hover:text-accent" />
                      <span className="text-sm font-medium">{feature.votes}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded border ${priorityColors[feature.priority]}`}>
                          {feature.priority}
                        </span>
                        <span className={`flex items-center gap-1 text-xs ${statusColors[feature.status]}`}>
                          {statusIcons[feature.status]}
                          {feature.status.replace("_", " ")}
                        </span>
                      </div>
                      <h3 className="font-medium">{feature.title}</h3>
                      {feature.description && (
                        <p className="text-sm text-text-muted mt-1 line-clamp-2">{feature.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        <span>{feature.requester_name}</span>
                        <span>•</span>
                        <span>{formatDate(feature.created_at)}</span>
                        {feature.category && (
                          <>
                            <span>•</span>
                            <span className="bg-elevated px-2 py-0.5 rounded">{feature.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="bg-surface border border-border rounded-lg">
          {selectedFeature ? (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-sm">Details</h2>
                <div className="flex items-center gap-2">
                  {selectedFeature.monday_item_id && (
                    <a
                      href={`https://monday.com/boards/item/${selectedFeature.monday_item_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-text-muted hover:text-accent transition"
                      title="View in Monday.com"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(selectedFeature.id)}
                    className="p-1.5 text-critical hover:bg-critical/10 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 text-xs rounded border ${priorityColors[selectedFeature.priority]}`}>
                    {selectedFeature.priority}
                  </span>
                  <select
                    value={selectedFeature.status}
                    onChange={(e) => handleStatusChange(selectedFeature.id, e.target.value)}
                    className={`bg-transparent text-sm font-medium ${statusColors[selectedFeature.status]} focus:outline-none cursor-pointer`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{selectedFeature.title}</h3>
                
                <p className="text-sm text-text-muted mb-4">
                  Requested by {selectedFeature.requester_name} • {formatDate(selectedFeature.created_at)}
                </p>
                
                {selectedFeature.description && (
                  <div className="prose prose-invert prose-sm max-w-none mb-4 text-text-secondary whitespace-pre-wrap">
                    {selectedFeature.description}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <ChevronUp className="w-5 h-5 text-accent" />
                    <span className="font-bold">{selectedFeature.votes}</span>
                    <span className="text-sm text-text-muted">votes</span>
                  </div>
                  <button
                    onClick={() => handleVote(selectedFeature.id)}
                    className="px-3 py-1.5 bg-accent/10 text-accent text-sm rounded hover:bg-accent/20 transition"
                  >
                    Upvote
                  </button>
                </div>

                {/* Monday.com Integration Placeholder */}
                {!selectedFeature.monday_item_id && (
                  <div className="mt-4 p-3 bg-elevated rounded-lg border border-border">
                    <div className="flex items-center gap-2 text-text-muted">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Not synced to Monday.com</span>
                    </div>
                    <button className="mt-2 text-xs text-accent hover:underline">
                      Connect to Monday.com →
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-text-muted">
              <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Select a request to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">New Feature Request</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-elevated rounded">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Brief description of the feature"
                  className="w-full px-3 py-2 bg-void border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed explanation, use cases, etc."
                  rows={4}
                  className="w-full px-3 py-2 bg-void border border-border rounded-lg focus:outline-none focus:border-accent resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-void border border-border rounded-lg focus:outline-none focus:border-accent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. UI, API, Integration"
                    className="w-full px-3 py-2 bg-void border border-border rounded-lg focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.title.trim()}
                className="px-4 py-2 bg-accent hover:bg-orange-600 text-black font-medium rounded-lg disabled:opacity-50 transition"
              >
                {saving ? "Creating..." : "Create Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
