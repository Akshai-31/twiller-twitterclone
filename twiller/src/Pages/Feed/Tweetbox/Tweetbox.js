import React, { useState } from "react";
import "./Tweetbox.css";
import axios from "axios";
import { Avatar, Button } from "@mui/material";
import { useUserAuth } from "./../../../context/UserAuthContext";
import useLoggedinuser from "./../../../hooks/useLoggedinuser";
import { sendNotificationIfAllowed } from "../../../utils/notificationHelper";
const Tweetbox = ({ reloadPosts }) => {
  const [post, setPost] = useState("");
  const { user } = useUserAuth();
  const [loggedinuser] = useLoggedinuser();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!post.trim()) {
      alert("Tweet cannot be empty");
      return;
    }

    // 🔥 Backend expects these fields
    const newPost = {
      email: loggedinuser?.email,
      post: post,
      name: loggedinuser?.name,
      username: loggedinuser?.username,
      profilephoto: loggedinuser?.profilephoto,
      photo: "" // (image upload separate)
    };

    try {
      const res = await axios.post("http://localhost:5000/post", newPost);
sendNotificationIfAllowed(
    post,                     // tweet text
    loggedinuser?.email,      // who posted
    loggedinuser              // logged in user info
  );
      console.log("Tweet success:", res.data);
      setPost("");
      reloadPosts();

    } catch (err) {
      console.error("Tweet error:", err);

      const backend = err.response?.data;

      // 🔥🔥 handle backend posting rules properly
      if (backend?.errorType === "time") {
        alert("Posting allowed only between 10 AM - 10:30 AM (IST) because you have 0 followers.");
      }
      else if (backend?.errorType === "limit") {
        alert("Posting limit reached for today.");
      }
      else {
        alert(backend?.error || "Tweet failed");
      }
    }
  };

  return (
    <div className="tweetBox">
      <form onSubmit={handleSubmit}>
        <div className="tweetBox__input">
          <Avatar src={loggedinuser?.profilephoto} />
          <input
            placeholder="What's happening?"
            value={post}
            onChange={(e) => setPost(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          variant="contained"
          className="tweetBox__tweetButton"
        >
          Tweet
        </Button>
      </form>
    </div>
  );
};

export default Tweetbox;
