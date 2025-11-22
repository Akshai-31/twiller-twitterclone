import React, { useState, useEffect } from "react";
import Post from "../Posts/posts";
import { useNavigate } from "react-router-dom";
import "./Mainprofile.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CenterFocusWeakIcon from "@mui/icons-material/CenterFocusWeak";
import Editprofile from "../Editprofile/Editprofile";
import axios from "axios";
import useLoggedinuser from "../../../hooks/useLoggedinuser";
import L from "leaflet";
import "leaflet/dist/leaflet.css";




const Mainprofile = ({ user, location, handleGetLocation }) => {
  const navigate = useNavigate();
  const [isloading, setisloading] = useState(false);
  const [showAvatarPopup, setShowAvatarPopup] = useState(false);
  const [loggedinuser] = useLoggedinuser();
  const username = user?.email?.split("@")[0];
  const [post, setpost] = useState([]);

  const avatarList = ["/avatar/a1.jpg", "/avatar/a2.jpg", "/avatar/a3.jpg"];

  // Fetch User Posts
  useEffect(() => {
    fetch(`http://localhost:5000/userpost?email=${user?.email}`)
      .then((res) => res.json())
      .then((data) => setpost(data));
  }, [user.email]);

  // CLOUDINARY
  const CLOUDINARY_UPLOAD_PRESET = "twitter-mern";
  const CLOUDINARY_CLOUD_NAME = "devksymwg";

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    return data.secure_url;
  };

  // Choose Avatar
  const chooseAvatar = async (url) => {
    try {
      await axios.patch(`http://localhost:5000/userupdate/${user.email}`, {
        profileImage: url,
      });
      setShowAvatarPopup(false);
      window.location.reload();
    } catch (err) {
      console.log(err);
    }
  };

  // Upload Avatar
  const handleuploadprofileimage = async (e) => {
    try {
      setisloading(true);
      const file = e.target.files[0];

      const imageUrl = await uploadToCloudinary(file);

      await axios.patch(`http://localhost:5000/userupdate/${user?.email}`, {
        profileImage: imageUrl,
      });

      setisloading(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
      setisloading(false);
    }
  };

  return (
    <div>
      <ArrowBackIcon className="arrow-icon" onClick={() => navigate("/")} />
      <h4 className="heading-4">{username}</h4>

      <div className="mainprofile">
        <div className="profile-bio">
          <div>
            {/* COVER IMAGE */}
            <div className="coverImageContainer">
              <img
                src={loggedinuser?.coverImage || user?.photoURL}
                alt="cover"
                className="coverImage"
              />

              <div className="hoverCoverImage">
                <label htmlFor="coverUpload" className="imageIcon">
                  <CenterFocusWeakIcon className="photoIcon" />
                </label>
                <input
                  type="file"
                  id="coverUpload"
                  className="imageInput"
                  onChange={async (e) => {
                    const img = await uploadToCloudinary(e.target.files[0]);
                    await axios.patch(
                      `http://localhost:5000/userupdate/${user.email}`,
                      { coverImage: img }
                    );
                    window.location.reload();
                  }}
                />
              </div>
            </div>

            {/* PROFILE IMAGE */}
            <div className="avatar-img">
              <div className="avatarContainer">
                <img
                  src={loggedinuser?.profileImage || user?.photoURL}
                  alt="avatar"
                  className="avatar"
                  onClick={() => setShowAvatarPopup(true)}
                />
              </div>

              {/* AVATAR POPUP */}
              {showAvatarPopup && (
                <div className="avatarPopup">
                  <div className="avatarPopupContent">
                    <h3>Choose Avatar</h3>

                    <div className="avatarOptions">
                      {avatarList.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt="avatar"
                          className="avatarChoice"
                          onClick={() => chooseAvatar(src)}
                        />
                      ))}
                    </div>

                    <label className="uploadBtn">
                      Upload New
                      <input
                        type="file"
                        className="avatarUploadInput"
                        onChange={handleuploadprofileimage}
                      />
                    </label>

                    <button
                      className="closeAvatarPopup"
                      onClick={() => setShowAvatarPopup(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* USER INFO */}
              <div className="userInfo">
                <h3 className="heading-3">
                  {loggedinuser?.name || user?.displayName}
                </h3>
                <p className="usernameSection">@{username}</p>
                <Editprofile user={user} loggedinuser={loggedinuser} />
              </div>

              {/* LOCATION SECTION (CLEANED & FIXED) */}
              <div className="userInfo">
                <h3 className="heading-3">{user?.displayName}</h3>

                <div className="locationAndLink">
                  <span className="subInfo">
                    📍 {location ? location : "Location not set"}
                  </span>
                </div>

                {/* Location Button */}
                <button onClick={handleGetLocation} className="getLocationBtn">
                  Get My Location
                </button>
              </div>

              <h4 className="tweetsText">Tweets</h4>
            </div>

            {/* POSTS */}
            {post.map((p) => (
              <Post key={p._id} p={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mainprofile;
