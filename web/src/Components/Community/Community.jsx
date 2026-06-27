import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaComment, FaPlus, FaImage, FaRunning, FaPaperPlane, FaTrash, FaSpinner } from 'react-icons/fa';
import { auth, db, storage } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, increment, serverTimestamp, where, getDocs, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import ConfirmDialog from './ConfirmDialog';
import Notification from '../Notification/Notification';
import { parseMentions, processMentionsForStorage, sendMentionNotifications } from './mentionUtils';
import firebaseService from '../../services/firebaseService';
import { formatDate } from '../../utils/dateUtils';
import { useLocation, useNavigate } from 'react-router-dom';
import './Community.css';
import './Mention.css';

const Community = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [rankedUsers, setRankedUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [postComments, setPostComments] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState(null);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const calculateUserStats = async (userId) => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      let totalRuns = 0;
      querySnapshot.forEach((doc) => {
        const booking = doc.data();
        if (booking.status === undefined || booking.status === 'completed' || booking.status === 'confirmed') {
          totalRuns++;
        }
      });
      if (totalRuns === 0 && querySnapshot.size > 0) totalRuns = querySnapshot.size;

      let totalDistance = totalRuns * 2;

      try {
        const statsResponse = await firebaseService.getUserStatistics(userId);
        if (statsResponse && statsResponse.totalRuns) {
          totalRuns = statsResponse.totalRuns;
          totalDistance = totalRuns * 2;
        }
      } catch (_) { }

      return { totalRuns, totalDistance };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return { totalRuns: 0, totalDistance: 0 };
    }
  };

  const showNotification = (message, type = 'info', duration = 5000) => {
    setNotification({ message, type });
    if (window.notificationTimeout) clearTimeout(window.notificationTimeout);
    window.notificationTimeout = setTimeout(() => setNotification(null), duration);
  };

  const closeNotification = () => setNotification(null);

  const isPostLikedByUser = (post, userId) =>
    Array.isArray(post.likedBy) && post.likedBy.includes(userId);

  const formatCommentTime = (timestamp) => {
    if (!timestamp) return '';
    if (timestamp.toDate) {
      const date = timestamp.toDate();
      const diffMs = Date.now() - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return formatDate(date);
    }
    return timestamp.toString();
  };

  // ── Firestore listeners ───────────────────────────────────────────────────

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => setCurrentUser(user));

    const postsQuery = query(
      collection(db, 'communityPosts'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const postsData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!Array.isArray(data.likedBy)) data.likedBy = [];
        postsData.push({ id: doc.id, ...data });
      });
      setPosts(postsData);
    }, (err) => console.error('Error fetching posts:', err));

    const buildRanking = async (usersData) => {
      const withStats = await Promise.all(
        usersData.map(async (user) => {
          const stats = await calculateUserStats(user.id);
          return { ...user, ...stats };
        })
      );
      withStats.sort((a, b) =>
        b.totalDistance !== a.totalDistance
          ? b.totalDistance - a.totalDistance
          : b.totalRuns - a.totalRuns
      );
      setRankedUsers(withStats);
    };

    const unsubscribeUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      buildRanking(usersData);
    }, (err) => console.error('Error fetching users:', err));

    const unsubscribeBookings = onSnapshot(query(collection(db, 'bookings')), async () => {
      const usersSnapshot = await getDocs(query(collection(db, 'users')));
      const usersData = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      buildRanking(usersData);
    }, (err) => console.error('Error fetching bookings:', err));

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
      unsubscribeUsers();
      unsubscribeBookings();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(notificationsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const n = change.doc.data();
          if (n.type === 'mention') showNotification(`${n.title}: ${n.message}`, 'warning', 8000);
        }
      });
    }, (err) => console.error('Error fetching notifications:', err));
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new-post') {
      setShowNewPostForm(true);
      navigate('/community', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    const unsubs = [];
    Object.entries(expandedComments).forEach(([postId, open]) => {
      if (!open) return;
      const q = query(
        collection(db, 'communityPosts', postId, 'comments'),
        orderBy('createdAt', 'asc'),
        limit(50)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setPostComments((prev) => ({
          ...prev,
          [postId]: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        }));
      }, (err) => console.error(`Error fetching comments for ${postId}:`, err));
      unsubs.push(unsub);
    });
    return () => unsubs.forEach((u) => u());
  }, [expandedComments]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleLike = async (postId, isLiked) => {
    if (!currentUser) { alert('Please sign in to like posts'); return; }
    try {
      const postRef = doc(db, 'communityPosts', postId);
      await updateDoc(postRef, isLiked
        ? { likes: increment(-1), likedBy: arrayRemove(currentUser.uid) }
        : { likes: increment(1), likedBy: arrayUnion(currentUser.uid) }
      );
    } catch (err) { console.error('Error updating like:', err); }
  };

  const handleComment = (postId) =>
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));

  const handleCommentSubmit = async (postId, commentText) => {
    if (!commentText.trim() || !currentUser) return;
    try {
      const { processedText, mentionUserIds } = processMentionsForStorage(commentText, rankedUsers);
      const commentDoc = await addDoc(collection(db, 'communityPosts', postId, 'comments'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous User',
        userPhoto: currentUser.photoURL || '/redlogo.png',
        content: processedText,
        mentionUserIds,
        createdAt: serverTimestamp(),
      });
      await sendMentionNotifications(commentText, rankedUsers, currentUser, 'comment', postId, commentDoc.id);
      await updateDoc(doc(db, 'communityPosts', postId), { comments: increment(1) });
      setNewComment((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) { console.error('Error adding comment:', err); }
  };

  const handleDeleteComment = async (postId, commentId, commentUserId) => {
    if (!currentUser || currentUser.uid !== commentUserId) {
      showNotification('You can only delete your own comments', 'error');
      return;
    }
    try {
      await deleteDoc(doc(db, 'communityPosts', postId, 'comments', commentId));
      await updateDoc(doc(db, 'communityPosts', postId), { comments: increment(-1) });
    } catch (err) {
      console.error('Error deleting comment:', err);
      showNotification('Failed to delete comment. Please try again.', 'error');
    }
  };

  const handleDeletePost = (postId, postUserId) => {
    if (!currentUser || currentUser.uid !== postUserId) {
      showNotification('You can only delete your own posts', 'error');
      return;
    }
    setShowDeleteConfirm({ postId, message: 'Are you sure you want to delete this post? This action cannot be undone.' });
  };

  const confirmDeletePost = async () => {
    if (!showDeleteConfirm) return;
    try {
      await deleteDoc(doc(db, 'communityPosts', showDeleteConfirm.postId));
      setShowDeleteConfirm(null);
      showNotification('Post deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting post:', err);
      setShowDeleteConfirm(null);
      showNotification('Failed to delete post. Please try again.', 'error');
    }
  };

  const handleNewPostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) { showNotification('Post content cannot be empty', 'error'); return; }
    if (!currentUser) { showNotification('You must be logged in to create a post', 'error'); return; }
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (newPostImage) {
        try {
          const imageRef = ref(storage, `communityPosts/${currentUser.uid}/${Date.now()}_${newPostImage.name}`);
          const snapshot = await uploadBytes(imageRef, newPostImage);
          imageUrl = await getDownloadURL(snapshot.ref);
        } catch (imgErr) {
          console.error('Error uploading image:', imgErr);
          showNotification('Failed to upload image. Post will be created without image.', 'error');
        }
      }
      const { processedText, mentionUserIds } = processMentionsForStorage(newPostContent, rankedUsers);
      const postDoc = await addDoc(collection(db, 'communityPosts'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous User',
        userPhoto: currentUser.photoURL || '/redlogo.png',
        userLevel: 'Beginner',
        content: processedText,
        image: imageUrl,
        likes: 0, comments: 0,
        likedBy: [],
        mentionUserIds,
        createdAt: serverTimestamp(),
        timestamp: new Date().toLocaleString(),
      });
      await sendMentionNotifications(newPostContent, rankedUsers, currentUser, 'post', postDoc.id);
      setNewPostContent('');
      setNewPostImage(null);
      setShowNewPostForm(false);
      showNotification('Post created successfully!', 'success');
    } catch (err) {
      console.error('Error creating post:', err);
      showNotification('Failed to create post. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // mention helpers
  const detectMention = (text, cursorPos) => {
    const before = text.substring(0, cursorPos);
    const idx = before.lastIndexOf('@');
    if (idx === -1 || (idx > 0 && !/\s/.test(before[idx - 1]))) return null;
    const query = before.substring(idx + 1);
    if (!query.length) return null;
    return { idx, query };
  };

  const handlePostContentChange = (e) => {
    const value = e.target.value;
    setNewPostContent(value);
    const result = detectMention(value, e.target.selectionStart);
    if (result) {
      const filtered = rankedUsers.filter((u) =>
        u.displayName?.toLowerCase().startsWith(result.query.toLowerCase())
      ).slice(0, 5);
      setMentionSuggestions(filtered);
      setShowMentionSuggestions(true);
      setMentionTriggerIndex(result.idx);
      setActiveMentionIndex(0);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleCommentChangeWithMentions = (postId, text) => {
    setNewComment((prev) => ({ ...prev, [postId]: text }));
    const result = detectMention(text, text.length);
    if (result) {
      const filtered = rankedUsers.filter((u) =>
        u.displayName?.toLowerCase().startsWith(result.query.toLowerCase())
      ).slice(0, 5);
      setMentionSuggestions(filtered);
      setShowMentionSuggestions(true);
      setMentionTriggerIndex(result.idx);
      setActiveMentionIndex(0);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const selectMention = (username, inputType, postId = null) => {
    const inject = (text) => {
      const after = text.substring(mentionTriggerIndex + 1);
      const spaceIdx = after.indexOf(' ');
      const tail = spaceIdx !== -1 ? after.substring(spaceIdx) : '';
      return text.substring(0, mentionTriggerIndex) + '@' + username + ' ' + tail;
    };
    if (inputType === 'post') setNewPostContent(inject(newPostContent));
    else if (inputType === 'comment' && postId)
      setNewComment((prev) => ({ ...prev, [postId]: inject(prev[postId] || '') }));
    setShowMentionSuggestions(false);
    setMentionSuggestions([]);
  };

  const handleMentionKeyDown = (e, inputType, postId = null) => {
    if (!showMentionSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveMentionIndex((p) => Math.min(p + 1, mentionSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveMentionIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (mentionSuggestions.length) selectMention(mentionSuggestions[activeMentionIndex].displayName, inputType, postId);
    } else if (e.key === 'Escape') {
      setShowMentionSuggestions(false);
      setMentionSuggestions([]);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="community">


      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={closeNotification} />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          message={showDeleteConfirm.message}
          onConfirm={confirmDeletePost}
          onCancel={() => setShowDeleteConfirm(null)}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}

      <div className="community-main">
        <div className="community-content">
          <div className="community-grid">

            {/* ── Feed ── */}
            <motion.div
              className="feed-section"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {/* Header */}
              <div className="section-header">
                <h2>Community feed</h2>
                <button className="new-post-btn" onClick={() => setShowNewPostForm(!showNewPostForm)}>
                  <FaPlus size={11} />
                  New post
                </button>
              </div>

              {/* New post form */}
              {showNewPostForm && (
                <motion.div
                  className="new-post-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <form onSubmit={handleNewPostSubmit}>
                    <textarea
                      value={newPostContent}
                      onChange={handlePostContentChange}
                      onKeyDown={(e) => handleMentionKeyDown(e, 'post')}
                      placeholder="Share your running experience, ask questions, or post updates…"
                      rows="4"
                    />

                    {showMentionSuggestions && mentionSuggestions.length > 0 && (
                      <div className="mention-suggestions">
                        {mentionSuggestions.map((user, idx) => (
                          <div
                            key={user.id}
                            className={`mention-suggestion ${idx === activeMentionIndex ? 'active' : ''}`}
                            onClick={() => selectMention(user.displayName, 'post')}
                          >
                            <img src={user.photoURL || '/redlogo.png'} alt={user.displayName} className="mention-avatar" />
                            <span>{user.displayName}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {newPostImage && (
                      <div className="image-preview">
                        <img src={URL.createObjectURL(newPostImage)} alt="Preview" className="preview-image" />
                        <button type="button" className="remove-image-btn" onClick={() => setNewPostImage(null)}>
                          Remove
                        </button>
                      </div>
                    )}

                    <div className="form-actions">
                      <label className="image-upload-label" title="Attach image">
                        <FaImage size={14} />
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            if (!file.type.startsWith('image/')) {
                              showNotification('Please select an image file', 'error');
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              showNotification('Image must be under 5 MB', 'error');
                              return;
                            }
                            setNewPostImage(file);
                          }}
                        />
                      </label>

                      <div className="form-buttons">
                        <button type="button" className="cancel-btn" onClick={() => setShowNewPostForm(false)}>
                          Cancel
                        </button>
                        <button type="submit" className={`submit-btn ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
                          {isSubmitting ? <><FaSpinner className="spinner" size={11} /> Posting…</> : 'Post'}
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Posts */}
              <div className="posts-container">
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    className="post-card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Post header */}
                    <div className="post-header">
                      <div className="user-info">
                        <img src={post.userPhoto} alt={post.userName} className="user-avatar" />
                        <div>
                          <h3>{post.userName}</h3>
                          <span className="user-level">{post.userLevel} runner</span>
                        </div>
                      </div>
                      <div className="post-header-actions">
                        <span className="post-timestamp">{post.timestamp}</span>
                        {currentUser?.uid === post.userId && (
                          <button className="delete-post-btn" onClick={() => handleDeletePost(post.id, post.userId)} title="Delete post">
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post body */}
                    <div className="post-content">
                      <p>{parseMentions(post.content, rankedUsers)}</p>
                      {post.image && <img src={post.image} alt="Post" className="post-image" />}
                    </div>

                    {/* Post actions */}
                    <div className="post-actions">
                      <button
                        className={`action-btn like-btn ${isPostLikedByUser(post, currentUser?.uid) ? 'liked' : ''}`}
                        onClick={() => handleLike(post.id, isPostLikedByUser(post, currentUser?.uid))}
                      >
                        <FaHeart size={12} />
                        {post.likes}
                      </button>
                      <button className="action-btn comment-btn" onClick={() => handleComment(post.id)}>
                        <FaComment size={12} />
                        {post.comments}
                      </button>
                    </div>

                    {/* Comments section */}
                    {expandedComments[post.id] && (
                      <div className="comments-section">
                        {/* Add comment */}
                        <div className="add-comment">
                          <img
                            src={currentUser?.photoURL || '/redlogo.png'}
                            alt="Your avatar"
                            className="comment-avatar"
                          />
                          <div className="comment-input-container">
                            <textarea
                              className="comment-input"
                              value={newComment[post.id] || ''}
                              onChange={(e) => handleCommentChangeWithMentions(post.id, e.target.value)}
                              onKeyDown={(e) => handleMentionKeyDown(e, 'comment', post.id)}
                              placeholder="Write a comment…"
                              rows="1"
                            />
                            <button
                              className="send-comment-btn"
                              onClick={() => handleCommentSubmit(post.id, newComment[post.id] || '')}
                              title="Send"
                            >
                              <FaPaperPlane size={12} />
                            </button>
                          </div>

                          {showMentionSuggestions && mentionSuggestions.length > 0 && (
                            <div className="mention-suggestions">
                              {mentionSuggestions.map((user, idx) => (
                                <div
                                  key={user.id}
                                  className={`mention-suggestion ${idx === activeMentionIndex ? 'active' : ''}`}
                                  onClick={() => selectMention(user.displayName, 'comment', post.id)}
                                >
                                  <img src={user.photoURL || '/redlogo.png'} alt={user.displayName} className="mention-avatar" />
                                  <span>{user.displayName}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Comment list */}
                        <div className="comments-list">
                          {postComments[post.id]?.length ? (
                            postComments[post.id].map((comment) => (
                              <div key={comment.id} className="comment-item">
                                <img src={comment.userPhoto} alt={comment.userName} className="comment-avatar" />
                                <div className="comment-content">
                                  <div className="comment-header">
                                    <span className="comment-author">{comment.userName}</span>
                                    <span className="comment-time">{formatCommentTime(comment.createdAt)}</span>
                                    {currentUser?.uid === comment.userId && (
                                      <button
                                        className="delete-comment-btn"
                                        onClick={() => handleDeleteComment(post.id, comment.id, comment.userId)}
                                        title="Delete comment"
                                        style={{ marginLeft: 'auto' }}
                                      >
                                        <FaTrash size={11} />
                                      </button>
                                    )}
                                  </div>
                                  <p className="comment-text">{parseMentions(comment.content, rankedUsers)}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="comment-placeholder">No comments yet. Be the first!</p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ── Sidebar: Leaderboard ── */}
            <div className="community-sidebar">
              <motion.div
                className="users-section"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 }}
              >
                <div className="section-header">
                  <h2>Top runners</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FaRunning className="section-icon" />
                    <span className="real-time-indicator">LIVE</span>
                  </div>
                </div>

                <div className="users-list">
                  {rankedUsers.slice(0, 10).map((user, index) => (
                    <div
                      key={user.id}
                      className={`user-item ${currentUser?.uid === user.id ? 'current-user' : ''}`}
                    >
                      <div className="user-rank">{index + 1}</div>

                      <div className="user-avatar-small">
                        {user.photoURL
                          ? <img src={user.photoURL} alt={user.displayName} />
                          : <div className="default-avatar">{user.displayName?.charAt(0) || 'U'}</div>
                        }
                      </div>

                      <div className="user-info">
                        <h4>
                          {user.displayName || 'Anonymous'}
                          {currentUser?.uid === user.id && ' (You)'}
                        </h4>
                        <div className="user-stats">
                          <span className="distance-stat">{user.totalDistance || 0} km</span>
                          <span className="runs-stat">{user.totalRuns || 0} runs</span>
                        </div>
                        <div className="distance-per-run">
                          {user.totalRuns > 0
                            ? `${(user.totalDistance / user.totalRuns).toFixed(1)} km/run`
                            : '—'}
                        </div>
                      </div>

                      <div className="real-time-badge">
                        <div className="pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;