import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";
import firebaseService from "../../services/firebaseService";
import Notification from "../Notification/Notification";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./SignUp.css";

const SignUp = () => {
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [notification, setNotification] = useState(null);
  const [dob, setDob] = useState(null);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }, []);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const handleGetOtp = async () => {
    if (!phone || phone.length !== 10) {
      showNotification("Please enter a valid 10-digit phone number.", "error");
      return;
    }
    
    try {
      // Check if phone number already exists
      const phoneExists = await firebaseService.isPhoneNumberExists(phone);
      if (phoneExists) {
        showNotification("This phone number is already registered. Redirecting to sign in...", "warning");
        // Navigate to sign in page after a short delay
        setTimeout(() => {
          navigate("/SignIn");
        }, 2000);
        return;
      }
      
      const appVerifier = window.recaptchaVerifier;
      const phoneNumber = `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setTimer(20);
      showNotification("✅ OTP sent successfully!", "success");
    } catch (error) {
      console.error("Error sending OTP:", error);
      showNotification("❌ " + (error.message || "Failed to send OTP."), "error");
    }
  };

  // Calculate maximum date (13 years ago from today)
  const getMaxDate = () => {
    const today = new Date();
    return new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
  };

  // Calculate minimum date (100 years ago from today)
  const getMinDate = () => {
    const today = new Date();
    return new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  };

  const handleDobChange = (date) => {
    setDob(date);
    
    if (date) {
      // Check if user is under 13
      const today = new Date();
      const thirteenYearsAgo = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
      
      if (date > thirteenYearsAgo) {
        showNotification("You must be at least 13 years old to register.", "error");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate DOB
    if (!dob) {
      showNotification("Please enter your date of birth.", "error");
      setSubmitting(false);
      return;
    }

    // Check if user is under 13
    if (dob) {
      const today = new Date();
      const thirteenYearsAgo = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
      
      if (dob > thirteenYearsAgo) {
        showNotification("You must be at least 13 years old to register.", "error");
        setSubmitting(false);
        return;
      }
    }

    if (!confirmationResult) {
      showNotification("Please get an OTP first.", "error");
      setSubmitting(false);
      return;
    }

    try {
      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;

      const formData = new FormData(e.target);
      const rawData = Object.fromEntries(formData.entries());

      // Update Firebase Auth profile with displayName
      await updateProfile(user, {
        displayName: rawData.fullname
      });

      // Map form data to the correct structure for Firestore
      const formattedDob = dob ? dob.toISOString().split('T')[0] : "";
      
      const userData = {
        displayName: rawData.fullname,
        gender: rawData.gender,
        dateOfBirth: formattedDob, // Use the formatted string
        profession: rawData.profession,
        phone: rawData.phone,
        emergencyContact: rawData.emergency,
        firebase_uid: user.uid,
        joinCrew: formData.get("joinCrew") ? true : false,
        termsAccepted: formData.get("termsAccepted") ? true : false,
      };

      // Store user details in localStorage
      const userDetails = {
        fullName: userData.displayName,
        phone: userData.phone,
        emergencyContact: userData.emergencyContact,
        firebase_uid: user.uid
      };
      localStorage.setItem('currentUser', JSON.stringify(userDetails));

      // Register user in Firestore
      await firebaseService.saveUserProfile(user.uid, userData);

      showNotification("✅ User registered successfully!", "success");
      e.target.reset();
      navigate("/dashboard");
    } catch (error) {
      console.error("Error confirming OTP or registering user:", error);
      showNotification("❌ " + (error.message || "Failed to sign up."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log("Google Sign-Up successful!", user.email);
      
      // Store user details in localStorage
      const userDetails = {
        fullName: user.displayName || "Google User",
        phone: user.phoneNumber || "",
        emergencyContact: "",
        firebase_uid: user.uid
      };
      localStorage.setItem('currentUser', JSON.stringify(userDetails));

      // Register user in Firestore
      await firebaseService.saveUserProfile(user.uid, {
        displayName: user.displayName || "Google User",
        firebase_uid: user.uid,
        email: user.email,
        joinCrew: false,
        termsAccepted: true
      });

      showNotification("✅ Signed up with Google successfully!", "success");
      navigate("/dashboard");
    } catch (err) {
      console.error("Google Sign-Up Error:", err);
      showNotification(err.message || "Google Sign-Up failed. Please try again.", "error");
    }
  };

  const handleTermsClick = (e) => {
    e.preventDefault();
    navigate('/terms');
  };

  const handleSignInClick = () => {
    navigate("/SignIn");
  };

  return (
    <div className="register-wrapper">
      <div className="SignUp-background">
        <div className="blur SignUp-blur-1"></div>
        <div className="blur SignUp-blur-2"></div>
      </div>
      <div id="recaptcha-container"></div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
      <div className="form-box">
        <div className="logo">
          <img src="redlogo.png" alt="logo" className="logo-img" />
        </div>
        <div className="top-buttons">
          <button className="toggle-btn active">Sign Up</button>
          <button className="toggle-btn" onClick={handleSignInClick}>LogIn</button>
        </div>
        <div className="club">
          <h2>Join the club</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" name="fullname" placeholder="Enter your full name" required />
            </div>
            <div className="form-group">
              <label>Gender *</label>
              <select name="gender" required>
                <option value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth *</label>
              <div className="date-input-wrapper">
                <DatePicker
                  selected={dob}
                  onChange={handleDobChange}
                  maxDate={getMaxDate()}
                  minDate={getMinDate()}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  placeholderText="mm/dd/yyyy"
                  className="date-input"
                  required
                />
                <span className="calendar-icon">
                  📅
                </span>
              </div>
            </div>
            <div className="form-group">
              <label>Profession *</label>
              <select name="profession" required>
                <option value="">Select your profession</option>
                <option>Student</option>
                <option>Employee</option>
                <option>Business</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone Number * (10 digits)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="tel" name="phone" placeholder="10-digit mobile number" maxLength={10} required style={{ flex: 1 }} value={phone} onChange={(e) => setPhone(e.target.value)} />
                <button 
                  type="button" 
                  onClick={handleGetOtp} 
                  className={`get-otp-btn ${confirmationResult ? 'sent' : ''}`}
                  disabled={timer > 0 || (phone && phone.length !== 10)}
                >
                  {confirmationResult ? (timer > 0 ? `Resend in ${timer}s` : "Resend OTP") : "Get OTP"}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Emergency Contact</label>
              <input type="tel" name="emergency" placeholder="Emergency contact number" maxLength={10} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Enter OTP *</label>
              <input type="text" name="otp" placeholder="Enter the 6-digit OTP" maxLength="6" required value={otp} onChange={(e) => setOtp(e.target.value)} />
            </div>
          </div>
          <div className="form-check">
            <input type="checkbox" name="termsAccepted" required /> I accept the{" "}
            <button type="button" className="link-button" onClick={handleTermsClick}>Terms and Conditions</button>
          </div>
          <div className="form-check">
            <input type="checkbox" name="joinCrew" /> I want to join the crew
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Sign Up"}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
            <span style={{ color: '#666', padding: '0 10px', fontSize: '14px', fontWeight: 'bold' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
          </div>

          <button
            type="button"
            className="btn-SignIn google-btn"
            onClick={handleGoogleSignUp}
            style={{ backgroundColor: '#fff', color: '#000', marginTop: '0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
            Sign Up with Google
          </button>

          <p className="SignIn-text">
            Already have an account?{" "}
            <button
              type="button"
              className="link-button"
              onClick={(e) => {
                e.preventDefault();
                handleSignInClick();
              }}
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;