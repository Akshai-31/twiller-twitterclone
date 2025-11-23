import React, { useState, useEffect, useRef  } from "react";
import twitterimg from "../../image/twitter.jpeg";
import TwitterIcon from "@mui/icons-material/Twitter";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./otp.css";
import { useUserAuth } from "../../context/UserAuthContext";


const OTPPage = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { googleSignIn ,logIn} = useUserAuth();

  const sentOtpRef = useRef(false);

  const email = location.state?.email || "";
  const loginMethod = location.state?.loginMethod || "normal";
  const password = location.state?.password || "password";

  // Automatically send OTP when OTP page loads
  useEffect(() => {
    const sendOtp = async () => {
      try {
        const res = await fetch("http://localhost:5000/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, loginMethod }),
        });

        const data = await res.json();
        setMessage(data.message || "OTP sent to your email");
      } catch (err) {
        console.error(err);
        setError("Failed to send OTP. Please try again.");
      }
    };
    if (!sentOtpRef.current && email) {
      sentOtpRef.current = true; // mark OTP as sent
      sendOtp();
    }
  }, [email, loginMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, loginMethod }),
      });

      const data = await res.json();

      if (data.success) {
        await logIn(email, password);
        navigate("/"); // Redirect after successful OTP
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong!");
    }
  };

  return (
    <div className="otp-container">
      <div className="image-container">
        <img src={twitterimg} className="image" alt="twitterimg" />
      </div>
      <div className="form-container">
        <div className="form-box">
          <TwitterIcon style={{ color: "skyblue" }} />
          <h2 className="heading">Enter OTP</h2>
          {message && <p className="infoMessage">{message}</p>}
          {error && <p className="errorMessage">{error}</p>}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="otp-input"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <div className="btn-login">
              <button type="submit" className="btn">
                Verify OTP
              </button>
              <Link
                to="/login"
                style={{
                  textDecoration: "none",
                  color: "var(--twitter-color)",
                  fontWeight: "600",
                  marginTop: "10px",
                  display: "block",
                }}
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPPage;
