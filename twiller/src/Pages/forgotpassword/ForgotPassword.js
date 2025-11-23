import React, { useState } from "react";
import { useUserAuth } from "../../context/UserAuthContext";
import { Link } from "react-router-dom";
import "./forgotpassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { resetPassword } = useUserAuth();

  // Generate a random password (uppercase + lowercase only)
  const generatePassword = (length) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    // Check for daily limit using localStorage
    const lastResetTime = localStorage.getItem(`lastResetTime_${email}`);
    const now = new Date().getTime();

    if (lastResetTime && now - lastResetTime < 24 * 60 * 60 * 1000) {
      setError("You can request password reset only once in 24 hours.");
      return;
    }

    try {
      await resetPassword(email); // Firebase reset email
      const newPassword = generatePassword(10);
      console.log("Generated New Password:", newPassword);

      localStorage.setItem(`lastResetTime_${email}`, now);
      setMessage(
        `Password reset email sent! Check your inbox.\nTemporary password: ${newPassword}`
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="forgot-container">
      <div className="form-container">
        <div className="form-box">
          <h1 className="heading">Forgot Password</h1>
          <h3 className="sub-heading">Reset your password</h3>

          <form onSubmit={handleReset}>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="forgotpassword-email"
              required
            />
            <button type="submit" className="btn-reset">
              Send Reset Link
            </button>
          </form>

          {message && <p className="successMessage">{message}</p>}
          {error && <p className="errorMessage">{error}</p>}

          <p className="back-login">
            <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
