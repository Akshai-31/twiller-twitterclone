import React, { useState,useContext } from "react";
import twitterimg from "../../image/twitter.jpeg";
import TwitterIcon from "@mui/icons-material/Twitter";
import GoogleButton from "react-google-button";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";

import { useUserAuth } from "../../context/UserAuthContext";
const Login = () => {
  const [email, seteamil] = useState("");
  const [password, setpassword] = useState("");
  const [error, seterror] = useState("");
  const navigate = useNavigate();
  const { googleSignIn ,logIn} = useUserAuth();
  const handlesubmit = async (e) => {
    e.preventDefault();
    seterror("");
    try {
      await logIn(email,password)
      navigate("/");
    } catch (error) {
      seterror(error.message);
      window.alert(error.message);
    }
  };
  const hanglegooglesignin = async (e) => {
  console.log("Google Sign-in initiated");
  e.preventDefault();
  try {
    const result = await googleSignIn();
    const user = result.user;
console.log(user);
    // Google user details
    const newUser = {
      username: user.email.split("@")[0],
      name: user.displayName,
      email: user.email,
      profileImage: user.photoURL,
      coverImage: "",  // initially empty
    };

    // Check or insert user in MongoDB
    const res = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(newUser),
    });

    const data = await res.json();

    navigate("/");
  } catch (error) {
    console.log(error.message);
    alert("Google Sign-in Failed");
  }
};
  return (
    <>
      <div className="login-container">
        <div className="image-container">
          <img src={twitterimg} className=" image" alt="twitterimg" />
        </div>
        <div className="form-container">
          <div className="form-box">
            <TwitterIcon style={{ color: "skyblue" }} />
            <h2 className="heading">Happening now</h2>
            {error && <p>{error.message}</p>}
            <form onSubmit={handlesubmit}>
              <input
                type="email"
                className="email"
                placeholder="Email address"
                onChange={(e) => seteamil(e.target.value)}
              />
              <input
                type="password"
                className="password"
                placeholder="Password"
                onChange={(e) => setpassword(e.target.value)}
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
              <GoogleButton className="g-btn" type="light" onClick={hanglegooglesignin}/>
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
    </>
  );
};

export default Login;
