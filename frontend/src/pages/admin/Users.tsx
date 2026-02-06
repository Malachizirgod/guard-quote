import { useState, useEffect } from "react";
import { getAuthHeaders } from "../../context/AuthContext";
import { Plus, Pencil, Trash2, X, Loader2, Shield, User, Activity, LogIn, FileText, MessageSquare, Settings, ChevronRight } from "lucide-react";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const actionIcons: Record<string, typeof LogIn> = {
  login: LogIn,
  create_quote: FileText,
  update_quote: FileText,
  create_blog: MessageSquare,
  update_blog: MessageSquare,
  create_feature: Settings,
  update_feature: Settings,
};

const actionLabels: Record<string, string> = {
  login: "Logged in",
  create_quote: "Created quote",
  update_quote: "Updated quote",
  create_blog: "Created blog post",
  update_blog: "Updated blog post",
  create_feature: "Created feature request",
  update_feature: "Updated feature request",
  view_dashboard: "Viewed dashboard",
};

interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

interface ActivityLog {
  id: number;
  action: string;
  details: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", role: "user", password: "" });
  const [saving, setSaving] = useState(false);
  
  // Activity panel state
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  
  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users", { headers: getAuthHeaders() });
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  
  const fetchActivity = async (userId: number) => {
    setActivityLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/activity?limit=50`, { headers: getAuthHeaders() });
      const data = await res.json();
      setActivity(Array.isArray(data) ? data : []);
    } catch {
      setActivity([]);
    }
    setActivityLoading(false);
  };
  
  useEffect(() => { fetchUsers(); }, []);
  
  const handleSelectUser = (u: UserData) => {
    if (selectedUser?.id === u.id) {
      setSelectedUser(null);
      setActivity([]);
    } else {
      setSelectedUser(u);
      fetchActivity(u.id);
    }
  };
  
  const openCreate = () => {
    setEditUser(null);
    setForm({ email: "", firstName: "", lastName: "", role: "user", password: "" });
    setShowModal(true);
  };
  
  const openEdit = (u: UserData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditUser(u);
    setForm({ email: u.email, firstName: u.first_name, lastName: u.last_name, role: u.role, password: "" });
    setShowModal(true);
  };
  
  const handleSave = async () => {
    setSaving(true);
    const url = editUser ? `/api/admin/users/${editUser.id}` : "/api/admin/users";
    const method = editUser ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    fetchUsers();
  };
  
  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    if (selectedUser?.id === id) {
      setSelectedUser(null);
      setActivity([]);
    }
    fetchUsers();
  };
  
  if (loading) return <div className="p-8 text-text-secondary">Loading users...</div>;
  
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Users</h1>
          <p className="text-text-secondary text-sm">Manage admin accounts and permissions</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-void font-medium rounded transition">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>
      
      <div className="flex gap-6">
        {/* Users Table */}
        <div className={`bg-surface border border-border rounded-lg overflow-hidden transition-all ${selectedUser ? "flex-1" : "w-full"}`}>
          <table className="w-full">
            <thead className="bg-elevated/50">
              <tr className="text-left text-xs font-mono text-text-muted uppercase">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last Active</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr 
                  key={u.id} 
                  onClick={() => handleSelectUser(u)}
                  className={`hover:bg-elevated/30 transition cursor-pointer ${selectedUser?.id === u.id ? "bg-accent/10 border-l-2 border-l-accent" : ""}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                        {u.first_name?.[0] || "?"}{u.last_name?.[0] || "?"}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {u.first_name} {u.last_name}
                          {selectedUser?.id === u.id && <ChevronRight className="w-4 h-4 text-accent" />}
                        </div>
                        <div className="text-xs text-text-muted font-mono">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${u.role === "admin" ? "bg-accent/20 text-accent" : "bg-blue-500/20 text-blue-400"}`}>
                      {u.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${u.is_active ? "bg-success/20 text-success" : "bg-text-muted/20 text-text-muted"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {u.last_login ? (
                      <span className="text-text-secondary" title={new Date(u.last_login).toLocaleString()}>
                        {formatRelativeTime(u.last_login)}
                      </span>
                    ) : (
                      <span className="text-text-muted">Never</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-text-secondary">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={(e) => openEdit(u, e)} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-elevated rounded transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleDelete(u.id, e)} className="p-1.5 text-text-muted hover:text-critical hover:bg-critical/10 rounded transition ml-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Activity Panel */}
        {selectedUser && (
          <div className="w-96 bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-elevated/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">
                    {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                  </div>
                  <div>
                    <div className="font-semibold">{selectedUser.first_name} {selectedUser.last_name}</div>
                    <div className="text-xs text-text-muted">{selectedUser.email}</div>
                  </div>
                </div>
                <button onClick={() => { setSelectedUser(null); setActivity([]); }} className="p-1 text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex gap-4 mt-3 text-xs">
                <div>
                  <span className="text-text-muted">Role:</span>{" "}
                  <span className={selectedUser.role === "admin" ? "text-accent" : "text-blue-400"}>{selectedUser.role}</span>
                </div>
                <div>
                  <span className="text-text-muted">Since:</span>{" "}
                  <span className="text-text-secondary">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="w-4 h-4 text-accent" />
                Activity Log
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[500px]">
              {activityLoading ? (
                <div className="p-8 text-center text-text-muted">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading activity...
                </div>
              ) : activity.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-sm">
                  No activity recorded yet
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activity.map((a) => {
                    const Icon = actionIcons[a.action] || Activity;
                    const label = actionLabels[a.action] || a.action;
                    return (
                      <div key={a.id} className="px-4 py-3 hover:bg-elevated/30">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon className="w-3.5 h-3.5 text-text-muted" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{label}</div>
                            {a.details && Object.keys(a.details).length > 0 && (
                              <div className="text-xs text-text-muted mt-0.5 truncate">
                                {a.details.email && <span>{String(a.details.email)}</span>}
                                {a.details.title && <span>"{String(a.details.title)}"</span>}
                                {a.details.quote_number && <span>#{String(a.details.quote_number)}</span>}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                              <span title={new Date(a.created_at).toLocaleString()}>
                                {formatRelativeTime(a.created_at)}
                              </span>
                              {a.ip_address && a.ip_address !== "unknown" && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">{a.ip_address.split(",")[0]}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{editUser ? "Edit User" : "Add User"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">First Name</label>
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 bg-elevated border border-border rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Last Name</label>
                  <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 bg-elevated border border-border rounded text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-elevated border border-border rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 bg-elevated border border-border rounded text-sm">
                  <option value="user">User</option>
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">{editUser ? "New Password (leave blank to keep)" : "Password"}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 bg-elevated border border-border rounded text-sm" />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-border hover:bg-elevated rounded transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-accent hover:bg-accent/90 text-void font-medium rounded transition flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
