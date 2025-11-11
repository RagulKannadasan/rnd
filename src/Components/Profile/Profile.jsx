import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { FaUser, FaEdit, FaSave, FaTimes, FaChartLine, FaTrophy, FaMapMarkerAlt, FaPhone, FaEnvelope, FaBirthdayCake, FaVenusMars, FaInstagram, FaRunning } from 'react-icons/fa';
import DashboardNav from '../DashboardNav/DashboardNav';
import { formatDate } from '../../utils/dateUtils';
import './Profile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    age: '',
    profession: '',
    fitnessLevel: 'beginner',
    goals: [],
    gender: '',
    dateOfBirth: '',
    emergencyContact: '',
    instagram: '',
    joinCrew: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [popupError, setPopupError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData = {};
          if (userDoc.exists()) {
            userData = userDoc.data();
          }
          
          setUser(currentUser);
          setFormData({
            displayName: currentUser.displayName || userData.displayName || '',
            email: currentUser.email || userData.email || '',
            phone: currentUser.phoneNumber || userData.phone || '',
            age: userData.age || '',
            profession: userData.profession || '',
            fitnessLevel: userData.fitnessLevel || 'beginner',
            goals: Array.isArray(userData.goals) ? userData.goals : [],
            gender: userData.gender || '',
            dateOfBirth: userData.dateOfBirth || '',
            emergencyContact: userData.emergencyContact || '',
            instagram: userData.instagram || '',
            joinCrew: userData.joinCrew || false
          });
        } catch (err) {
          console.error('Error fetching user data:', err);
          setPopupError('Failed to load profile data.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        navigate('/dashboard');
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setPopupError(null);
    
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      if (formData.displayName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: formData.displayName
        });
      }
      
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, {
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone || '',
        age: formData.age || '',
        profession: formData.profession || '',
        fitnessLevel: formData.fitnessLevel || 'beginner',
        goals: Array.isArray(formData.goals) ? formData.goals : [],
        gender: formData.gender || '',
        dateOfBirth: formData.dateOfBirth || '',
        emergencyContact: formData.emergencyContact || '',
        instagram: formData.instagram || '',
        joinCrew: formData.joinCrew || false,
        updatedAt: new Date()
      }, { merge: true });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setPopupError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (auth.currentUser) {
      window.location.reload();
    } else {
      navigate('/dashboard');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    setPopupError(null);
  
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setPopupError("No user is currently signed in.");
      return;
    }
  
    const uid = currentUser.uid;
  
    try {
      // 1. Delete the user from Firebase Authentication
      await deleteUser(currentUser);
  
      // 2. If successful, delete the user's document from Firestore
      const userDocRef = doc(db, 'users', uid);
      await deleteDoc(userDocRef);
  
      // 3. Redirect to the sign-in page
      navigate('/signin');
  
    } catch (error) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/requires-recent-login') {
        setPopupError("This is a sensitive operation and requires you to have signed in recently. Please sign out, sign back in, and try again.");
      } else {
        setPopupError("Failed to delete account. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="profile">
        <DashboardNav />
        <div className="profile-main">
          <div className="profile-content">
            <div className="loading-state"><p>Loading profile data...</p></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <DashboardNav />
      <div className="profile-main">
        <div className="profile-content">
          <div className="profile-header">
            <h1>My Profile</h1>
            {!isEditing ? (
              <button className="edit-profile-btn" onClick={() => setIsEditing(true)}><FaEdit /> Edit Profile</button>
            ) : (
              <div className="edit-actions">
                <button className="save-btn" onClick={handleSave} disabled={saving}><FaSave /> {saving ? 'Saving...' : 'Save'}</button>
                <button className="cancel-btn" onClick={handleCancel}><FaTimes /> Cancel</button>
              </div>
            )}
          </div>

          {popupError && (
            <div className="popup-overlay" onClick={() => setPopupError(null)}>
              <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={() => setPopupError(null)}>&times;</button>
                <div className="error-message">{popupError}</div>
              </div>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="popup-overlay">
              <div className="popup-content">
                <h2>Confirm Deletion</h2>
                <p>Are you sure you want to delete your account? This action is irreversible.</p>
                <div className="popup-actions">
                  <button className="popup-cancel-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                  <button className="popup-confirm-btn" onClick={confirmDeleteAccount}>Delete</button>
                </div>
              </div>
            </div>
          )}

          <div className="profile-grid">
            <div className="profile-card overview-card">
              <div className="card-header"><FaUser className="card-icon" /><h2>Profile Overview</h2></div>
              <div className="profile-overview">
                <div className="profile-avatar"><FaUser /></div>
                <div className="profile-basic-info">
                  <h3>{formData.displayName || 'User'}</h3>
                  <div className="user-level">Fitness Level: {formData.fitnessLevel?.charAt(0).toUpperCase() + formData.fitnessLevel?.slice(1) || 'Beginner'}</div>
                  <p className="member-since">Member since: {user?.metadata?.creationTime ? formatDate(new Date(user.metadata.creationTime)) : 'Unknown'}</p>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <div className="card-header"><FaUser className="card-icon" /><h2>Personal Details</h2></div>
              <div className="profile-details">
                <div className="detail-item">
                  <FaUser className="detail-icon" /><div className="detail-content"><span className="detail-label">Display Name</span>
                    {isEditing ? <input type="text" name="displayName" value={formData.displayName} onChange={handleInputChange} placeholder="Enter your display name" /> : <span className="detail-value">{formData.displayName || 'Not provided'}</span>}
                  </div>
                </div>
                <div className="detail-item">
                  <FaEnvelope className="detail-icon" /><div className="detail-content"><span className="detail-label">Email</span>
                    {isEditing ? <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Enter your email" /> : <span className="detail-value">{formData.email || 'Not provided'}</span>}
                  </div>
                </div>
                <div className="detail-item">
                  <FaPhone className="detail-icon" /><div className="detail-content"><span className="detail-label">Phone</span>
                    {isEditing ? <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter your phone number" /> : <span className="detail-value">{formData.phone || 'Not provided'}</span>}
                  </div>
                </div>
                <div className="detail-item">
                  <FaVenusMars className="detail-icon" /><div className="detail-content"><span className="detail-label">Gender</span>
                    {isEditing ? (
                      <select name="gender" value={formData.gender} onChange={handleInputChange}>
                        <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                      </select>
                    ) : <span className="detail-value">{formData.gender || 'Not provided'}</span>}
                  </div>
                </div>
                <div className="detail-item">
                  <FaBirthdayCake className="detail-icon" /><div className="detail-content"><span className="detail-label">Date of Birth</span>
                    {isEditing ? <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} /> : <span className="detail-value">{formData.dateOfBirth || 'Not provided'}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <div className="card-header"><FaChartLine className="card-icon" /><h2>Fitness Information</h2></div>
              <div className="profile-details">
                <div className="detail-item">
                  <FaMapMarkerAlt className="detail-icon" /><div className="detail-content"><span className="detail-label">Age</span>
                    {isEditing ? <input type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="Enter your age" /> : <span className="detail-value">{formData.age || 'Not provided'}</span>}
                  </div>
                </div>
                <div className="detail-item">
                  <FaChartLine className="detail-icon" /><div className="detail-content"><span className="detail-label">Profession</span>
                    {isEditing ? <input type="text" name="profession" value={formData.profession} onChange={handleInputChange} placeholder="Enter your profession" /> : <span className="detail-value">{formData.profession || 'Not provided'}</span>}
                  </div>
                </div>
                <div className="detail-item">
                  <FaRunning className="detail-icon" /><div className="detail-content"><span className="detail-label">Fitness Level</span>
                    {isEditing ? (
                      <select name="fitnessLevel" value={formData.fitnessLevel} onChange={handleInputChange}>
                        <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
                      </select>
                    ) : <span className="detail-value">{formData.fitnessLevel?.charAt(0).toUpperCase() + formData.fitnessLevel?.slice(1) || 'Beginner'}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-card">
                <div className="card-header"><FaUser className="card-icon" /><h2>Social & Emergency</h2></div>
                <div className="profile-details">
                    <div className="detail-item">
                        <FaInstagram className="detail-icon" /><div className="detail-content"><span className="detail-label">Instagram</span>
                            {isEditing ? <input type="text" name="instagram" value={formData.instagram} onChange={handleInputChange} placeholder="Enter Instagram username" /> : <span className="detail-value">{formData.instagram || 'Not provided'}</span>}
                        </div>
                    </div>
                    <div className="detail-item">
                        <FaPhone className="detail-icon" /><div className="detail-content"><span className="detail-label">Emergency Contact</span>
                            {isEditing ? <input type="tel" name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} placeholder="Enter emergency contact" /> : <span className="detail-value">{formData.emergencyContact || 'Not provided'}</span>}
                        </div>
                    </div>
                    <div className="detail-item">
                        <FaTrophy className="detail-icon" /><div className="detail-content"><span className="detail-label">Goals</span>
                            {isEditing ? (
                                <textarea name="goals" value={Array.isArray(formData.goals) ? formData.goals.join(', ') : ''} onChange={(e) => setFormData(prev => ({...prev, goals: e.target.value.split(',').map(goal => goal.trim())}))} placeholder="Enter goals (comma separated)" />
                            ) : <span className="detail-value">{Array.isArray(formData.goals) && formData.goals.length > 0 ? formData.goals.join(', ') : 'Not provided'}</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-card achievements-card">
                <div className="card-header"><FaTrophy className="card-icon" /><h2>Achievements</h2></div>
                <div className="achievements-grid">
                    <div className="achievement-item"><div className="achievement-icon">🏃‍♂️</div><div className="achievement-info"><h4>First Run</h4><span className="achievement-date">Completed</span></div></div>
                    <div className="achievement-item"><div className="achievement-icon">🏅</div><div className="achievement-info"><h4>5K Club</h4><span className="achievement-date">In Progress</span></div></div>
                </div>
            </div>

            {isEditing && (
              <div className="profile-card danger-zone">
                <div className="card-header"><h2>Danger Zone</h2></div>
                <div className="danger-zone-content">
                  <p>Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="delete-account-btn" onClick={handleDeleteAccount}>Delete Account</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
