
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from "firebase/auth";
import { auth } from "../../firebase";
import firebaseService from "../../services/firebaseService";
import "./SignUp.css";

const SignUp = () => {
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }, []);

  const handleGetOtp = async () => {
    if (!phone || phone.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    try {
      const appVerifier = window.recaptchaVerifier;
      const phoneNumber = `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      alert("✅ OTP sent successfully!");
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("❌ " + (error.message || "Failed to send OTP."));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!confirmationResult) {
      alert("Please get an OTP first.");
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
      const userData = {
        displayName: rawData.fullname,
        gender: rawData.gender,
        dateOfBirth: rawData.dob,
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

      alert("✅ User registered successfully!");
      e.target.reset();
      navigate("/dashboard");
    } catch (error) {
      console.error("Error confirming OTP or registering user:", error);
      alert("❌ " + (error.message || "Failed to sign up."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTermsClick = (e) => {
    e.preventDefault();
    navigate('/terms-and-conditions');
  };

  const handleSignInClick = () => {
    navigate("/SignIn");
  };

  return (
    <div className="register-wrapper">
      <div id="recaptcha-container"></div>
      <div className="form-box">
        <div className="logo">
          <img src="redlogo.png" alt="logo" className="logo-img" />
        </div>
        <div className="top-buttons">
          <button className="toggle-btn active">Sign Up</button>
          <button className="toggle-btn" onClick={handleSignInClick}>SignIn</button>
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
              <input type="date" name="dob" required />
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
                <button type="button" onClick={handleGetOtp} className="get-otp-btn">Get OTP</button>
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

          <p className="SignIn-text">
            Already have an account ?{" "}
            <button
              type="button"
              className="link-button"
              onClick={(e) => {
                e.preventDefault();
                handleSignInClick();
              }}
            >
              SignIn
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;