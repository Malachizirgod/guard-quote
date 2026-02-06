import { useState, useEffect, useCallback } from "react";
import { getAuthHeaders, useAuth } from "../../context/AuthContext";
import { FileText, Plus, Trash2, MessageSquare, Send, X, Edit3 } from "lucide-react";

interface Comment {
  id: number;
  content: string;
  author_name: string;
  created_at: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author_name: string;
  comment_count: number;
  created_at: string;
  comments?: Comment[];
}

export default function Blog() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [commentText, setCommentText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/blog/posts", { headers: getAuthHeaders() });
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch posts", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const fetchPost = async (id: number) => {
    const res = await fetch(`/api/blog/posts/${id}`, { headers: getAuthHeaders() });
    const data = await res.json();
    setSelectedPost(data);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    await fetch("/api/blog/posts", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...form, author_id: user?.id }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ title: "", content: "" });
    fetchPosts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this post and all its comments?")) return;
    await fetch(`/api/blog/posts/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    setSelectedPost(null);
    fetchPosts();
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    setSaving(true);
    await fetch(`/api/blog/posts/${selectedPost.id}/comments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content: commentText, author_id: user?.id }),
    });
    setSaving(false);
    setCommentText("");
    fetchPost(selectedPost.id);
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Delete this comment?")) return;
    await fetch(`/api/blog/comments/${commentId}`, { method: "DELETE", headers: getAuthHeaders() });
    if (selectedPost) fetchPost(selectedPost.id);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  if (loading) {
    return <div className="p-8 text-text-secondary">Loading posts...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="w-7 h-7 text-accent" />
            Blog
          </h1>
          <p className="text-text-secondary text-sm mt-1">Create and manage blog posts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-orange-600 text-black font-medium rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Posts List */}
        <div className="bg-surface border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-sm">All Posts ({posts.length})</h2>
          </div>
          {posts.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No posts yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 text-accent hover:underline text-sm"
              >
                Create your first post
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => fetchPost(post.id)}
                  className={`p-4 cursor-pointer hover:bg-elevated/50 transition ${
                    selectedPost?.id === post.id ? "bg-elevated" : ""
                  }`}
                >
                  <h3 className="font-medium truncate">{post.title}</h3>
                  <p className="text-sm text-text-muted mt-1 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                    <span>{post.author_name || "Unknown"}</span>
                    <span>•</span>
                    <span>{formatDate(post.created_at)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {post.comment_count || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Detail */}
        <div className="bg-surface border border-border rounded-lg">
          {selectedPost ? (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-sm">Post Details</h2>
                <button
                  onClick={() => handleDelete(selectedPost.id)}
                  className="p-1.5 text-critical hover:bg-critical/10 rounded transition"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold mb-2">{selectedPost.title}</h3>
                <p className="text-sm text-text-muted mb-4">
                  By {selectedPost.author_name || "Unknown"} • {formatDate(selectedPost.created_at)}
                </p>
                <div className="prose prose-invert prose-sm max-w-none mb-6 text-text-secondary whitespace-pre-wrap">
                  {selectedPost.content}
                </div>

                {/* Comments */}
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comments ({selectedPost.comments?.length || 0})
                  </h4>
                  
                  {selectedPost.comments && selectedPost.comments.length > 0 ? (
                    <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto">
                      {selectedPost.comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-elevated rounded-lg group">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-sm font-medium">{comment.author_name || "Unknown"}</span>
                              <span className="text-xs text-text-muted ml-2">{formatDate(comment.created_at)}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 text-text-muted hover:text-critical opacity-0 group-hover:opacity-100 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm text-text-secondary mt-1">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted mb-4">No comments yet</p>
                  )}

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 px-3 py-2 bg-void border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={saving || !commentText.trim()}
                      className="px-3 py-2 bg-accent hover:bg-orange-600 text-black rounded-lg disabled:opacity-50 transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-text-muted">
              <Edit3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Select a post to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Create New Post</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-elevated rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Post title"
                  className="w-full px-3 py-2 bg-void border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your post content..."
                  rows={6}
                  className="w-full px-3 py-2 bg-void border border-border rounded-lg focus:outline-none focus:border-accent resize-none"
                />
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
                disabled={saving || !form.title.trim() || !form.content.trim()}
                className="px-4 py-2 bg-accent hover:bg-orange-600 text-black font-medium rounded-lg disabled:opacity-50 transition"
              >
                {saving ? "Creating..." : "Create Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
