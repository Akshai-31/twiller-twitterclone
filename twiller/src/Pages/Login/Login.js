import React, { useState } from "react";
import twitterimg from "../../image/twitter.jpeg";
import TwitterIcon from "@mui/icons-material/Twitter";
import GoogleButton from "react-google-button";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";
import { useUserAuth } from "../../context/UserAuthContext";

export function getDeviceInfo() {
  const ua = navigator.userAgent;

  const isMobile = /Mobi|Android/i.test(ua);
  const isEdge = /Edg/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !isEdge;

  return { isMobile, isEdge, isChrome };
}

export function isTimeAllowedForMobile() {
  const time = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });
  const hour = new Date(time).getHours();

  return hour >= 10 && hour < 13;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { googleSignIn, logIn } = useUserAuth();
  const { isMobile, isEdge } = getDeviceInfo();

  // Normal login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ ADDED VALIDATION HERE
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return; // Stop execution if fields are empty
    }

    try {
      // Call login-check API
      if (isMobile) {
        if (!isTimeAllowedForMobile()) {
          alert("⛔ Mobile login allowed only 10 AM - 1 PM IST");
          return;
        }
        navigate("/otp", { state: { email, loginMethod: "normal", password } });
        return;
      }

      // Desktop Edge → Direct login
      if (isEdge) {
        await logIn(email, password);
        navigate("/");
        return;
      }

      // Desktop Chrome or Others → OTP required
      navigate("/otp", { state: { email, loginMethod: "normal", password } });
    } catch (err) {
      setError(err.message);
      alert(err.message);
    }
  };

  // Google login
  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    try {
      
      const { isMobile, isEdge } = getDeviceInfo();

      if (isMobile && !isTimeAllowedForMobile()) {
        alert("⛔ Mobile login only between 10 AM - 1 PM IST");
        return;
      }

      if (isEdge) {
        navigate("/");
        return;
      }

      const result = await googleSignIn();
      const user = result.user;
      const newUser = {
        username: user.email.split("@")[0],
        name: user.displayName,
        email: user.email,
        profileImage: user.photoURL,
        coverImage: "",
      };

      // Register user in DB
      await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(newUser),
      });
      // If OTP not required, login successful
      navigate("/");
    } catch (err) {
      console.error(err.message);
      alert("Google Sign-in Failed");
    }
  };

  return (
    <div className="login-container">
      <div className="image-container">
        <img src={twitterimg} className="image" alt="twitterimg" />
      </div>
      <div className="form-container">
        <div className="form-box">
          <TwitterIcon style={{ color: "skyblue" }} />
          <h2 className="heading">Happening now</h2>

          {/* Error Message Display */}
          {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}
          
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              className="email"
              placeholder="Email address"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="btn-login">
              <button type="submit" className="btn">
                Log In
              </button>
              <Link
                to="/forgot-password"
                style={{
                  textDecoration: "none",
                  color: "var(--twitter-color)",
                  fontWeight: "600",
                  marginTop: "10px",
                  display: "block",
                }}
              >
                Forgot password?
              </Link>
            </div>
          </form>
          <hr />
          <div>
            <GoogleButton className="g-btn" type="light" onClick={handleGoogleSignIn} />
          </div>
        </div>
        <div>
          Don't have an account
          <Link
            to="/signup"
            style={{
              textDecoration: "none",
              color: "var(--twitter-color)",
              fontWeight: "600",
              marginLeft: "5px",
            }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;