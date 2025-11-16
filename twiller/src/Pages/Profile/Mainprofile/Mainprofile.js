import React, { useState, useEffect } from "react";
import Post from "../Posts/posts";
import { useNavigate } from "react-router-dom";
import "./Mainprofile.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CenterFocusWeakIcon from "@mui/icons-material/CenterFocusWeak";
import LockResetIcon from "@mui/icons-material/LockReset";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import AddLinkIcon from "@mui/icons-material/AddLink";
import Editprofile from "../Editprofile/Editprofile";
import axios from "axios";
import useLoggedinuser from "../../../hooks/useLoggedinuser";

const Mainprofile = ({ user }) => {
  const navigate = useNavigate();
  const [isloading, setisloading] = useState(false);
  const [loggedinuser] = useLoggedinuser();
  const username = user?.email?.split("@")[0];
  const [post, setpost] = useState([]);

  // Fetch user posts
  useEffect(() => {
    fetch(`http://localhost:5000/userpost?email=${user?.email}`)
      .then((res) => res.json())
      .then((data) => setpost(data));
  }, [user.email]);

 



// CLOUDINARY CONFIG
const CLOUDINARY_UPLOAD_PRESET = "twitter-mern"; // your preset name
const CLOUDINARY_CLOUD_NAME = "devksymwg"; // your cloud name

// Upload to Cloudinary
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
  return data.secure_url; // returns the URL of uploaded image
};








    

const handleuploadcoverimage = async (e) => {
  try {
    setisloading(true);
    const image = e.target.files[0];

    // 1️⃣ Upload to Cloudinary from frontend
    const imageUrl = await uploadToCloudinary(image);

    // 2️⃣ Send URL to backend to update user
    await axios.patch(`http://localhost:5000/userupdate/${user?.email}`, {
      coverImage: imageUrl,
    });

    setisloading(false);
    window.location.reload();
  } catch (error) {
    console.error(error);
    setisloading(false);
    alert("Failed to upload cover image");
  }
};





const handleuploadprofileimage = async (e) => {
  try {
    setisloading(true);
    const image = e.target.files[0];

    // 1️⃣ Upload to Cloudinary from frontend
    const imageUrl = await uploadToCloudinary(image);
    console.log("Uploaded to Cloudinary:", imageUrl);
    // 2️⃣ Send URL to backend to update user
    await axios.patch(`http://localhost:5000/userupdate/${user?.email}`, {
      profileImage: imageUrl,
    });

    setisloading(false);
    window.location.reload();
  } catch (error) {
    console.error(error);
    setisloading(false);
    alert("Failed to upload profile image");
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
                src={
                  loggedinuser?.coverImage
                    ? loggedinuser.coverImage
                    : user?.photoURL
                }
                alt="cover"
                className="coverImage"
              />
              <div className="hoverCoverImage">
                <div className="imageIcon_tweetButton">
                  <label htmlFor="coverUpload" className="imageIcon">
                    {isloading ? (
                      <LockResetIcon className="photoIcon photoIconDisabled" />
                    ) : (
                      <CenterFocusWeakIcon className="photoIcon" />
                    )}
                  </label>
                  <input
                    type="file"
                    id="coverUpload"
                    className="imageInput"
                    onChange={handleuploadcoverimage}
                  />
                </div>
              </div>
            </div>

            {/* PROFILE IMAGE */}
            <div className="avatar-img">
              <div className="avatarContainer">
                <img
                  src={
                    loggedinuser?.profileImage
                      ? loggedinuser.profileImage
                      : user?.photoURL
                  }
                  alt="avatar"
                  className="avatar"
                />
                <div className="hoverAvatarImage">
                  <div className="imageIcon_tweetButton">
                    <label htmlFor="profileUpload" className="imageIcon">
                      {isloading ? (
                        <LockResetIcon className="photoIcon photoIconDisabled" />
                      ) : (
                        <CenterFocusWeakIcon className="photoIcon" />
                      )}
                    </label>
                    <input
                      type="file"
                      id="profileUpload"
                      className="imageInput"
                      onChange={handleuploadprofileimage}
                    />
                  </div>
                </div>
              </div>

              {/* USER INFO */}
              <div className="userInfo">
                <div>
                  <h3 className="heading-3">
                    {loggedinuser?.name || user?.displayName}
                  </h3>
                  <p className="usernameSection">@{username}</p>
                </div>
                <Editprofile user={user} loggedinuser={loggedinuser} />
              </div>

              {/* BIO + LOCATION + LINK */}
              <div className="infoContainer">
                {loggedinuser?.bio && <p>{loggedinuser.bio}</p>}
                <div className="locationAndLink">
                  {loggedinuser?.location && (
                    <p className="subInfo">
                      <MyLocationIcon /> {loggedinuser.location}
                    </p>
                  )}
                  {loggedinuser?.website && (
                    <p className="subInfo link">
                      <AddLinkIcon /> {loggedinuser.website}
                    </p>
                  )}
                </div>
              </div>

              <h4 className="tweetsText">Tweets</h4>
              <hr />
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
