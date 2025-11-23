import React from "react";
import "./Posts.css";
import { Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import RepeatIcon from "@mui/icons-material/Repeat";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PublishIcon from "@mui/icons-material/Publish";
import VideoPlayer from "./VideoPlayer";

const Posts = ({ p }) => {
  const navigate = useNavigate();
  const { name, username, post, profilephoto, email, mediaUrl, mediaType } = p;

  const goToProfile = () => {
    navigate(`/home/profile/${email}`);
  };

  return (
    <div className="post">
      <div className="post__avatar" onClick={goToProfile} style={{ cursor: "pointer" }}>
        <Avatar src={profilephoto} />
      </div>

      <div className="post__body">
        <div className="post__header">
          <div className="post__headerText" onClick={goToProfile} style={{ cursor: "pointer" }}>
            <h3>
              {name}{" "}
              <span className="post__headerSpecial">
                <VerifiedUserIcon className="post__badge" /> @{username}
              </span>
            </h3>
          </div>

          <div className="post__headerDescription">
            <p>{post}</p>
          </div>
        </div>

        {mediaUrl && (
          mediaType === "video" ? (
            <VideoPlayer src={mediaUrl} />
          ) : mediaType === "image" ? (
            <img src={mediaUrl} alt="" className="post_media" />
          ) : mediaType === "raw" ? (
            <audio className="post_audio" controls>
              <source src={mediaUrl} />
            </audio>
          ) : null
        )}


        <div className="post__footer">
          <ChatBubbleOutlineIcon className="post__footer__icon" fontSize="small" />
          <RepeatIcon className="post__footer__icon" fontSize="small" />
          <FavoriteBorderIcon className="post__footer__icon" fontSize="small" />
          <PublishIcon className="post__footer__icon" fontSize="small" />
        </div>
      </div>
    </div>
  );
};

export default Posts;
