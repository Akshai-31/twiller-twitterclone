import React, { useState } from "react";
import "./Tweetbox.css";
import axios from "axios";
import { Avatar, Button } from "@mui/material";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import { useUserAuth } from "./../../../context/UserAuthContext";
import useLoggedinuser from "./../../../hooks/useLoggedinuser";
import { uploadMediaToCloudinary } from "../../../utils/cloudinaryUpload"; // ⭐ common upload utility

const Tweetbox = ({ reloadPosts }) => {
  const [post, setPost] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [preview, setPreview] = useState(null); // UI preview for media
  const [uploading, setUploading] = useState(false);

  const { user } = useUserAuth();
  const [loggedinuser] = useLoggedinuser();

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMediaFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!post.trim() && !mediaFile) {
      alert("Post cannot be empty!");
      return;
    }

    setUploading(true);

    let uploadedMedia = null;

    if (mediaFile) {
      uploadedMedia = await uploadMediaToCloudinary(mediaFile);
      console.log("Uploaded:", uploadedMedia);
    }

    const newPost = {
      email: loggedinuser?.email,
      post: post,
      mediaUrl: uploadedMedia?.secure_url || "",
      mediaType: uploadedMedia?.resource_type || "", 
      name: loggedinuser?.name,
      username: loggedinuser?.username,
      profilephoto: loggedinuser?.profilephoto,
      createdAt: new Date()
    };

    try {
      await axios.post("http://localhost:5000/post", newPost);

      setPost("");
      setMediaFile(null);
      setPreview(null);
      setUploading(false);
      reloadPosts();
    } catch (err) {
      console.error(err);
      alert("Tweet failed");
      setUploading(false);
    }
  };

  return (
    <div className="tweetBox">
      <form onSubmit={handleSubmit}>
        <div className="tweetBox__input">
          <Avatar src={loggedinuser?.profilephoto} />

          <textarea
            className="tweetBox__textarea"
            placeholder="What's happening?"
            value={post}
            onChange={(e) => setPost(e.target.value)}
            rows={1}
          />

        </div>

        {/* Media Preview */}
        {preview && (
          <div className="mediaPreview">
            {mediaFile.type.includes("image") && (
              <img src={preview} alt="preview" style={{ width: "100%", borderRadius: "10px" }} />
            )}

            {mediaFile.type.includes("video") && (
              <video controls style={{ width: "100%", borderRadius: "10px" }}>
                <source src={preview} />
              </video>
            )}

            {mediaFile.type.includes("audio") && (
              <audio controls>
                <source src={preview} />
              </audio>
            )}
          </div>
        )}

        <div className="tweetBox__footer">
          <div className="footer-icons">
            {/* Upload Media */}
            <label className="uploadMediaBtn">
              <AddPhotoAlternateOutlinedIcon />
              <input type="file" accept="image/*,video/*,audio/*" onChange={handleMediaSelect} />
            </label>

            {/* Audio Record Button */}
            <div className="audioRecordBtn" onClick={() => alert("Audio record feature coming soon!")}>
              🎤
            </div>
          </div>

          {/* Tweet Button */}
          <Button
            type="submit"
            disabled={uploading}
            variant="contained"
            className="tweetBox__tweetButton"
          >
            {uploading ? "Uploading..." : "Tweet"}
          </Button>
        </div>

      </form>
    </div>
  );
};

export default Tweetbox;
