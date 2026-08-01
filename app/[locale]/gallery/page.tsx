
"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Camera, Heart, MessageCircle, Send, X, Trash2 } from "lucide-react";
import GalleryUploadModal from "../../../components/GalleryUploadModal";

type Comment = {
  id: number;
  user_name: string;
  content: string;
  created_at: string;
  user_id?: string;
};

type Post = {
  id: number;
  image_url: string;
  caption: string;
  user_name: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id?: string;
};

type AuthState = {
  isAdmin: boolean;
  userId: string | null;
  loaded: boolean;
};

// --- Sub-component for individual Post Card ---
function PostCard({ 
  post, 
  auth, 
  isAr, 
  onLike, 
  onDeletePost, 
  likedPosts 
}: { 
  post: Post; 
  auth: AuthState; 
  isAr: boolean; 
  onLike: (id: number) => void; 
  onDeletePost: (post: Post) => void;
  likedPosts: Set<number>;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [localCommentsCount, setLocalCommentsCount] = useState(post.comments_count);
  const [confirmCommentId, setConfirmCommentId] = useState<number | null>(null);
  const [confirmPostDelete, setConfirmPostDelete] = useState(false);
  const deletedTempIds = useRef<Set<number>>(new Set());

  // Fetch comments only when user interacts or if we want to show some initially
  const fetchComments = async () => {
    if (commentsLoaded) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/gallery/comment?post_id=${post.id}`);
      const data = await res.json();
      if (data.ok) {
        setComments(data.comments);
        setCommentsLoaded(true);
      }
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    
    const tempId = Date.now();
    const tempComment: Comment = {
        id: tempId,
        user_name: isAr ? "أنا" : "Me",
        content: newComment,
        created_at: new Date().toISOString(),
        user_id: auth.userId || undefined
    };

    // Optimistically add comment
    setComments(prev => [tempComment, ...prev]);
    setLocalCommentsCount(prev => Number(prev) + 1);
    const commentToSend = newComment;
    setNewComment("");

    // Ensure comments are marked as loaded so we don't overwrite with old fetch
    setCommentsLoaded(true);

    try {
      const res = await fetch("/api/gallery/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          content: commentToSend,
          user_name: isAr ? "زائر" : "Guest"
        }),
      });
      
      const data = await res.json();
      if (data.ok && data.comment) {
        // Check if the user deleted this comment while it was posting
        if (deletedTempIds.current.has(tempId)) {
            // Delete the real comment immediately
            fetch(`/api/gallery/comment/${data.comment.id}`, { method: "DELETE" }).catch(console.error);
        } else {
            // Update the comment with the real ID from DB
            setComments(prev => prev.map(c => c.id === tempId ? { ...c, id: data.comment.id } : c));
        }
      } else {
        console.error("Failed to save comment", data.error);
        // Revert on server error (only if not already deleted)
        if (!deletedTempIds.current.has(tempId)) {
            setComments(prev => prev.filter(c => c.id !== tempId));
            setLocalCommentsCount(prev => Math.max(0, Number(prev) - 1));
            alert(isAr ? "فشل نشر التعليق" : "Failed to post comment");
        }
      }
    } catch (e) {
      console.error("Failed to post comment", e);
      // Revert optimistic update (only if not already deleted)
      if (!deletedTempIds.current.has(tempId)) {
        setComments(prev => prev.filter(c => c.id !== tempId));
        setLocalCommentsCount(prev => Math.max(0, Number(prev) - 1));
        alert(isAr ? "خطأ في الاتصال" : "Connection error");
      }
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    // Confirmation handled by UI state
    
    // Check for temp ID (optimistic comment)
    if (commentId > 2147483647) {
        deletedTempIds.current.add(commentId);
        setComments(prev => prev.filter(c => c.id !== commentId));
        setLocalCommentsCount(prev => Math.max(0, Number(prev) - 1));
        return;
    }

    try {
      const res = await fetch(`/api/gallery/comment/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setLocalCommentsCount(prev => Math.max(0, Number(prev) - 1));
      } else {
        const data = await res.json();
        alert(isAr ? `فشل الحذف: ${data.error || "خطأ غير معروف"}` : `Delete failed: ${data.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
      alert(isAr ? "حدث خطأ في الاتصال" : "Connection error");
    }
  };

  // Toggle comments visibility
  const toggleComments = () => {
    if (!commentsLoaded) {
      fetchComments();
    }
    setShowAllComments(!showAllComments);
  };

  // Determine which comments to show
  // If not expanded, show maybe last 2? Or none?
  // User wants "clear under the picture".
  // Let's show the input field always, and "View all comments" button if count > 0.
  // When clicked, it expands inline.
  
  return (
    <div className="rounded-2xl shadow-sm overflow-hidden border border-gray-100 bg-white mb-6">
      {/* Header */}
      <div className="p-3 flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xs font-bold">
          {post.user_name?.[0] || "?"}
        </div>
        <span className="font-semibold text-sm text-gray-800">{post.user_name}</span>
        
        {(auth.isAdmin || (auth.userId && auth.userId === post.user_id)) && (
          confirmPostDelete ? (
            <div className="mr-auto flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                <span className="text-xs text-red-500 font-bold">{isAr ? "حذف؟" : "Delete?"}</span>
                <button 
                    onClick={() => onDeletePost(post)}
                    className="bg-red-50 text-red-600 border border-red-200 rounded px-2 py-0.5 text-xs font-bold hover:bg-red-100"
                >
                    {isAr ? "نعم" : "Yes"}
                </button>
                <button onClick={() => setConfirmPostDelete(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                </button>
            </div>
          ) : (
            <button 
                onClick={() => setConfirmPostDelete(true)}
                className="mr-auto text-red-400 hover:text-red-600 p-1"
                title={isAr ? "حذف المشاركة" : "Delete Post"}
            >
                <Trash2 size={16} />
            </button>
          )
        )}
      </div>

      {/* Image */}
      <div className="relative w-full aspect-square bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.image_url}
          alt="Post"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Dark Gradient Overlay for Text Readability */}
        <div 
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10"
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} 
        />

        {/* Watermark in corner */}
        <span 
          className="absolute bottom-2 right-2 z-10 text-white/90 font-bold text-xs pointer-events-none drop-shadow-md"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
        >
          Layali Kashtat | ليالي كشتات
        </span>

        {/* Like Button Overlay - Restored to Image */}
        <button 
            onClick={(e) => {
              e.stopPropagation(); 
              onLike(post.id);
            }}
            className="absolute bottom-4 left-4 z-20 flex flex-row items-center gap-2 focus:outline-none active:scale-95 transition-transform bg-transparent border-none outline-none ring-0 shadow-none appearance-none"
            style={{ 
              position: 'absolute', 
              bottom: '16px', 
              left: '16px',
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              perspective: '1000px'
            }}
            title={isAr ? "إعجاب" : "Like"}
        >
            <Heart 
                className={`w-12 h-12 transition-all duration-300 ${
                    likedPosts.has(post.id) 
                        ? "animate-heartbeat" 
                        : "animate-slow-spin-3d"
                }`} 
                style={{ 
                    transformStyle: 'preserve-3d',
                    fill: likedPosts.has(post.id) ? '#FF0000' : '#FFFFFF',
                    stroke: likedPosts.has(post.id) ? '#000000' : 'transparent',
                    strokeWidth: likedPosts.has(post.id) ? '2px' : '0px',
                    filter: likedPosts.has(post.id)
                        ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' 
                        : 'brightness(1.5) drop-shadow(0 0 5px #FFFFFF)'
                }}
            />
            {post.likes_count > 0 && (
                <span 
                    className="text-white text-3xl font-black"
                    style={{ 
                        WebkitTextStroke: '1.5px black',
                        paintOrder: 'stroke fill',
                        textShadow: '0 4px 4px rgba(0,0,0,0.3)',
                        pointerEvents: 'none'
                    }}
                >
                    {post.likes_count}
                </span>
            )}
        </button>
      </div>

      {/* Actions Bar - Only Comments Toggle Now */}
      <div className="p-3 pb-0 flex items-center gap-4">
        <button 
          onClick={toggleComments}
          className="flex items-center gap-1 focus:outline-none transition-transform active:scale-90"
        >
          <MessageCircle className="w-7 h-7 text-gray-700 hover:text-gray-500" />
        </button>
      </div>

      {/* Caption & Comments Section */}
      <div className="p-3 pt-2 space-y-2">
        {/* Caption */}
        {post.caption && (
          <div className="text-sm text-gray-800 mb-2">
            <span className="font-bold ml-1">{post.user_name}</span>
            {post.caption}
          </div>
        )}

        {/* Comments Count / Toggle */}
        {localCommentsCount > 0 && (
          <button 
            onClick={toggleComments}
            className="text-gray-500 text-sm font-medium hover:text-gray-700"
          >
            {showAllComments 
              ? (isAr ? "إخفاء التعليقات" : "Hide comments") 
              : (isAr ? `عرض كل التعليقات (${localCommentsCount})` : `View all ${localCommentsCount} comments`)}
          </button>
        )}

        {/* Comments List - Inline */}
        {(showAllComments || comments.length > 0) && (
          <div className={`space-y-2 mt-2 ${!showAllComments ? 'hidden' : ''}`}>
            {loadingComments ? (
              <div className="text-xs text-gray-400">{isAr ? "جاري التحميل..." : "Loading..."}</div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="flex gap-2 items-start group">
                  <div className="flex-1 text-sm break-all whitespace-pre-wrap">
                    <span className="font-bold text-gray-800 ml-1">{comment.user_name}</span>
                    <span className="text-gray-700">{comment.content}</span>
                  </div>
                  {/* Delete Comment - Always Visible */}
                  {confirmCommentId === comment.id ? (
                      <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                        <span className="text-[10px] text-red-500 font-bold whitespace-nowrap">{isAr ? "حذف؟" : "Delete?"}</span>
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="bg-red-50 text-red-600 border border-red-200 rounded px-2 py-0.5 text-xs font-bold hover:bg-red-100"
                        >
                          {isAr ? "نعم" : "Yes"}
                        </button>
                        <button 
                          onClick={() => setConfirmCommentId(null)}
                          className="text-gray-400 hover:text-gray-600 p-0.5"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirmCommentId(comment.id)}
                        className="text-gray-400 hover:text-red-500 shrink-0 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )
                  }
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Comment Input - Always Visible */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
          <input
            type="text"
            placeholder={isAr ? "أضف تعليقاً..." : "Add a comment..."}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitComment()}
            onFocus={() => {
                // Optionally fetch comments when user focuses input
                if (!commentsLoaded && localCommentsCount > 0) fetchComments();
            }}
          />
          <button 
            onClick={submitComment}
            disabled={!newComment.trim()}
            className="text-purple-600 font-bold text-sm disabled:opacity-50 hover:text-purple-700"
          >
            {isAr ? "نشر" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const pathname = usePathname();
  const router = useRouter();
  const isAr = !(pathname === "/en" || pathname?.startsWith("/en/"));

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<AuthState>({ isAdmin: false, userId: null, loaded: false });
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchAuth();
    fetchPosts();
    const savedLikes = localStorage.getItem("layali_gallery_likes");
    if (savedLikes && savedLikes !== "undefined") {
      try {
        setLikedPosts(new Set(JSON.parse(savedLikes)));
      } catch (e) {
        console.error("Failed to parse likes", e);
      }
    }
  }, []);

  const fetchAuth = async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      setAuth({
        isAdmin: data.isAdmin,
        userId: data.user?.id || null,
        loaded: true
      });
    } catch (e) {
      console.error("Auth check failed", e);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/gallery?limit=50");
      const data = await res.json();
      if (data.ok) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    if (likedPosts.has(postId)) return;

    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
    ));
    
    const newLikedPosts = new Set(likedPosts);
    newLikedPosts.add(postId);
    setLikedPosts(newLikedPosts);
    localStorage.setItem("layali_gallery_likes", JSON.stringify(Array.from(newLikedPosts)));

    await fetch("/api/gallery/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    });
  };

  const handleDeletePost = async (post: Post) => {
    // Confirmation handled by UI
    try {
      const res = await fetch(`/api/gallery/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== post.id));
      } else {
        alert(isAr ? "فشل الحذف" : "Delete failed");
      }
    } catch (e) {
      console.error(e);
      alert(isAr ? "حدث خطأ" : "Error occurred");
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "#fcfcfc" }} dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center" style={{ background: "#eeeeee" }}>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Camera className="w-6 h-6 text-purple-600" />
          {isAr ? "تجارب العملاء" : "Moments"}
        </h1>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 transition"
        >
          {isAr ? "شارك صورة" : "Share Photo"}
        </button>
      </div>

      {/* Grid */}
      <div className="max-w-md mx-auto p-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">{isAr ? "جاري التحميل..." : "Loading..."}</div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id}
              post={post}
              auth={auth}
              isAr={isAr}
              onLike={handleLike}
              onDeletePost={handleDeletePost}
              likedPosts={likedPosts}
            />
          ))
        )}
      </div>
      <GalleryUploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        isAr={isAr}
        onUploadSuccess={() => {
          fetchPosts();
        }}
      />
    </div>
  );
}
