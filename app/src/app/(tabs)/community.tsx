import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../../config/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, increment, serverTimestamp, where, getDocs, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CommunityScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [rankedUsers, setRankedUsers] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        const token = currentUser ? await currentUser.getIdToken() : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>);
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
        
        // Fetch posts
        const postsRes = await fetch(`${apiUrl}/api/community/posts`, { headers });
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          // Provide defaults for old data
          setPosts(postsData.map((p: any) => ({ ...p, likedBy: p.likedBy || [] })));
        }

        // Fetch leaderboard
        const boardRes = await fetch(`${apiUrl}/api/community/leaderboard`, { headers });
        if (boardRes.ok) {
          const boardData = await boardRes.json();
          setRankedUsers(boardData);
        }
      } catch (e) {
        console.error('Error fetching community data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
    // No snapshot available for REST, would need to implement pull-to-refresh
  }, [currentUser]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewPostImage(result.assets[0].uri);
    }
  };

  const handleNewPostSubmit = async () => {
    if (!newPostContent.trim()) {
      Alert.alert('Error', 'Post content cannot be empty');
      return;
    }
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (newPostImage) {
        const response = await fetch(newPostImage);
        const blob = await response.blob();
        const imageRef = ref(storage, `communityPosts/${currentUser.uid}/${Date.now()}.jpg`);
        const snapshot = await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const token = await currentUser.getIdToken();
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
      
      const res = await fetch(`${apiUrl}/api/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newPostContent,
          authorName: currentUser.displayName,
          authorPhoto: currentUser.photoURL,
          image: imageUrl
        })
      });

      if (!res.ok) throw new Error('Failed to create post');
      
      const newPost = await res.json();
      setPosts(prev => [newPost, ...prev]);

      setNewPostContent('');
      setNewPostImage(null);
    } catch (err) {
      console.error('Error creating post:', err);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!currentUser) return;
    try {
      // Optimistic UI update
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const newLikedBy = isLiked ? p.likedBy.filter((id: string) => id !== currentUser.uid) : [...p.likedBy, currentUser.uid];
          return { ...p, likes: p.likes + (isLiked ? -1 : 1), likedBy: newLikedBy };
        }
        return p;
      }));
      
      const token = await currentUser.getIdToken();
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
      
      await fetch(`${apiUrl}/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isLiked })
      });
    } catch (err) {
      console.error('Error updating like:', err);
    }
  };

  const handleDeletePost = (postId: string, postUserId: string) => {
    if (!currentUser || (currentUser.uid !== postUserId && postUserId !== currentUser.uid)) return; // Allow author logic
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await currentUser.getIdToken();
              const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
              
              const res = await fetch(`${apiUrl}/api/community/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (res.ok) {
                setPosts(prev => prev.filter(p => p.id !== postId));
              } else {
                Alert.alert('Error', 'Could not delete post');
              }
            } catch (err) {
              console.error('Error deleting post', err);
            }
          }
        }
      ]
    );
  };

  const renderLeaderboardItem = ({ item, index }: { item: any, index: number }) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.rankBadge}><Text style={styles.rankText}>{index + 1}</Text></View>
      <View style={styles.leaderboardAvatar}>
        <Text style={styles.leaderboardAvatarText}>{item.displayName?.charAt(0) || 'U'}</Text>
      </View>
      <View>
        <Text style={styles.leaderboardName}>{item.displayName || 'Anonymous'}</Text>
        <Text style={styles.leaderboardStats}>{item.totalDistance} km • {item.totalRuns} runs</Text>
      </View>
    </View>
  );

  const renderPost = ({ item }: { item: any }) => {
    const isLiked = Array.isArray(item.likedBy) && currentUser && item.likedBy.includes(currentUser.uid);

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.userName?.charAt(0) || 'U'}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{item.userName}</Text>
              <Text style={styles.postTime}>{item.timestamp}</Text>
            </View>
          </View>
          {currentUser?.uid === item.userId && (
            <TouchableOpacity onPress={() => handleDeletePost(item.id, item.userId)}>
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.postContent}>{item.content}</Text>
        
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.postImage} />
        )}
        
        <View style={styles.postActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, isLiked && styles.likedBtn]} 
            onPress={() => handleLike(item.id, isLiked)}
          >
            <Text style={[styles.actionText, isLiked && styles.likedText]}>
              {isLiked ? '❤️' : '🤍'} {item.likes}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>💬 {item.comments}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F15A24" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              <Text style={styles.sectionTitle}>Top Runners 🏃‍♂️</Text>
              <FlatList
                horizontal
                data={rankedUsers}
                keyExtractor={(item) => item.id}
                renderItem={renderLeaderboardItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.leaderboardContainer}
              />
              <Text style={styles.sectionTitle}>Community Feed</Text>
              
              <View style={styles.newPostContainer}>
                <TextInput
                  style={styles.newPostInput}
                  placeholder="Share your running experience..."
                  placeholderTextColor="#666"
                  value={newPostContent}
                  onChangeText={setNewPostContent}
                  multiline
                />
                {newPostImage && (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: newPostImage }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setNewPostImage(null)}>
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.newPostActions}>
                  <TouchableOpacity style={styles.iconBtn} onPress={pickImage}>
                    <Text style={styles.iconText}>📷 Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.submitBtn} 
                    onPress={handleNewPostSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.submitText}>Post</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
  },
  leaderboardContainer: {
    gap: 12,
    paddingRight: 16,
  },
  leaderboardItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F15A24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardAvatarText: {
    color: '#fff',
    fontSize: 16,
  },
  leaderboardName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  leaderboardStats: {
    color: '#F15A24',
    fontSize: 12,
  },
  newPostContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  newPostInput: {
    color: '#fff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  newPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  iconBtn: {
    padding: 8,
  },
  iconText: {
    color: '#aaa',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#F15A24',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  postCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
  },
  userName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  postTime: {
    color: '#888',
    fontSize: 12,
  },
  deleteText: {
    fontSize: 16,
  },
  postContent: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  likedBtn: {
    backgroundColor: 'rgba(241, 90, 36, 0.1)',
  },
  actionText: {
    color: '#aaa',
    fontSize: 14,
  },
  likedText: {
    color: '#F15A24',
  }
});
