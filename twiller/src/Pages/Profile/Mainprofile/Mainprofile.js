import React, { useState, useEffect } from 'react'
import Post from '../Posts/posts'
import { useNavigate } from 'react-router-dom'
import './Mainprofile.css'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak'
import Editprofile from '../Editprofile/Editprofile'
import axios from 'axios'
import useLoggedinuser from '../../../hooks/useLoggedinuser'
import GoogleMap from '../GoogleMap' // ⭐ ADD THIS IMPORT
import { uploadMediaToCloudinary } from '../../../utils/cloudinaryUpload'
import NotificationsIcon from '@mui/icons-material/Notifications' // filled
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone' // outlined

const Mainprofile = ({ user, location, weather, handleGetLocation }) => {
  const navigate = useNavigate()
  const [isloading, setisloading] = useState(false)
  const [showAvatarPopup, setShowAvatarPopup] = useState(false)
  const [loggedinuser] = useLoggedinuser()
  const username = user?.email?.split('@')[0]
  const [post, setpost] = useState([])
  const [notifToggle, setNotifToggle] = useState(
    loggedinuser?.isNotification ?? true
  )

  const avatarList = ['/avatar/a1.jpg', '/avatar/a2.jpg', '/avatar/a3.jpg']

  // Fetch User Posts
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/userpost?email=${user?.email}`)
      .then((res) => res.json())
      .then((data) => setpost(data))
  }, [user.email])

  const chooseAvatar = async (localPath) => {
  try {
    // 1. Fetch the local avatar file
    const response = await fetch(localPath);
    const blob = await response.blob();
    const file = new File([blob], 'avatar.jpg', { type: blob.type });

    // 2. Upload to Cloudinary
    const cloudRes = await uploadMediaToCloudinary(file);

    // 3. Update user profile with the Cloudinary URL
    await axios.patch(
      `${process.env.REACT_APP_API_URL}/userupdate/${user.email}`,
      {
        profileImage: cloudRes.secure_url,
        publicId: cloudRes.public_id,
        mediaType: cloudRes.resource_type,
      }
    );

    // 4. Close popup and reload
    setShowAvatarPopup(false);
    window.location.reload();
  } catch (err) {
    console.error('Error uploading avatar:', err);
  }
};


  // Upload Avatar
  const handleuploadprofileimage = async (e) => {
    try {
      setisloading(true)
      const file = e.target.files[0]

      const cloudRes = await uploadMediaToCloudinary(file)

      await axios.patch(
        `${process.env.REACT_APP_API_URL}/userupdate/${user?.email}`,
        {
          profileImage: cloudRes.secure_url,
          publicId: cloudRes.public_id,
          mediaType: cloudRes.resource_type,
        }
      )

      setisloading(false)
      window.location.reload()
    } catch (error) {
      console.error(error)
      setisloading(false)
    }
  }
  const handleToggleNotification = async () => {
    const newValue = !notifToggle
    setNotifToggle(newValue)

    await axios.patch(
      `${process.env.REACT_APP_API_URL}/user/toggle-notification/${user.email}`,
      {
        isNotification: newValue,
      }
    )
  }
  return (
    <div>
      <ArrowBackIcon className="arrow-icon" onClick={() => navigate('/')} />
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
                    const file = e.target.files[0]
                    const cloudRes = await uploadMediaToCloudinary(file)

                    await axios.patch(
                      `${process.env.REACT_APP_API_URL}/userupdate/${user.email}`,
                      {
                        coverImage: cloudRes.secure_url,
                        publicId: cloudRes.public_id,
                        mediaType: cloudRes.resource_type,
                      }
                    )

                    window.location.reload()
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
                          onClick={() => chooseAvatar(src)} // JS function call
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
              <div className="notificationIconContainer">
                {notifToggle ? (
                  <NotificationsIcon
                    className="notifIcon activeNotif"
                    onClick={handleToggleNotification}
                  />
                ) : (
                  <NotificationsNoneIcon
                    className="notifIcon"
                    onClick={handleToggleNotification}
                  />
                )}
              </div>
              {/* LOCATION SECTION */}
              <div className="userInfo">
                <div className="locationAndLink">
                  <span className="subInfo">
                    📍{' '}
                    {location
                      ? `${location.state}, ${location.country}`
                      : 'Location not set'}
                  </span>
                </div>

                <button onClick={handleGetLocation} className="getLocationBtn">
                  Get My Location
                </button>
              </div>

              {/* MAP + WEATHER SECTION ADDED HERE */}
              {location && (
                <div className="mapCard">
                  {/* <h3>Your Live Location</h3> */}
                  <GoogleMap
                    latitude={location.latitude}
                    longitude={location.longitude}
                  />
                </div>
              )}

              {weather && (
                <div className="weatherCard">
                  <h3>Weather at your location</h3>
                  <p>🌡 Temperature: {weather.main.temp}°C</p>
                  <p>☁ Condition: {weather.weather[0].description}</p>
                  <p>💧 Humidity: {weather.main.humidity}%</p>
                  <p>🌬 Wind: {weather.wind.speed} m/s</p>
                </div>
              )}

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
  )
}

export default Mainprofile
