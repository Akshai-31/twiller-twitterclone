import React, { useState } from "react";
import "./Tweetbox.css";
import axios from "axios";
import { Avatar, Button } from "@mui/material";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";

import { useUserAuth } from "./../../../context/UserAuthContext";
import useLoggedinuser from "./../../../hooks/useLoggedinuser";

const Tweetbox = ({ reloadPosts }) => {
  const [post, setPost] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const { user } = useUserAuth();
  const [loggedinuser] = useLoggedinuser();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!post.trim()) {
      alert("Tweet cannot be empty");
      return;
    }

    const newPost = {
      email: loggedinuser?.email,   // ✅ backend expects this
      post: post,                   // ✅ tweet text
      photo: "",                    // no image support in backend yet
      name: loggedinuser?.name,
      username: loggedinuser?.username,
      profilephoto: loggedinuser?.profilephoto
    };

    try {
      const res = await axios.post("http://localhost:5000/post", newPost);

      console.log("Tweet success:", res.data);

      setPost("");
      reloadPosts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Tweet failed");
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

        <Button type="submit" variant="contained" className="tweetBox__tweetButton">
          Tweet
        </Button>
      </form>
    </div>
  );
};

export default Tweetbox;
