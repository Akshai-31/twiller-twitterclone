import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Post from '../Posts/posts'
import './OtherUserProfile.css'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import useLoggedinuser from '../../../hooks/useLoggedinuser'
import GoogleMap from '../GoogleMap'

const OtherUserProfile = () => {
  const { email } = useParams()
  const navigate = useNavigate()
  const [loggedinuser] = useLoggedinuser()

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [location, setLocation] = useState(null)
  const [weather, setWeather] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)

  const WEATHER_KEY = 'e064b116f8820c72fdcb38ecdff6e4b1'

  // 1. Load profile info
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/loggedinuser?email=${email}`)
      .then((res) => setProfile(res.data))
      .catch((e) => console.log(e))
  }, [email])

  // 2. Load posts
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/userpost?email=${email}`)
      .then((res) => setPosts(res.data))
  }, [email])

  // 3. Load location & weather of that user automatically
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/get-location?email=${email}`)
      .then((res) => {
        if (res.data.location) {
          const loc = res.data.location
          setLocation(loc)

          axios
            .get(
              `https://api.openweathermap.org/data/2.5/weather?lat=${loc.latitude}&lon=${loc.longitude}&appid=${WEATHER_KEY}&units=metric`
            )
            .then((w) => setWeather(w.data))
        }
      })
      .catch(() => {})
  }, [email])

  // 4. Check follow status
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/follow/status`, {
        params: { currentUser: loggedinuser?.email, targetUser: email },
      })
      .then((res) => setIsFollowing(res.data.following))
      .catch(() => setIsFollowing(false))
  }, [email, loggedinuser])

  // 5. Follow
  const followUser = async () => {
    await axios.post(`${process.env.REACT_APP_API_URL}/follow`, {
      currentUser: loggedinuser.email,
      targetUser: email,
    })
    setIsFollowing(true)
  }

  // 6. Unfollow
  const unfollowUser = async () => {
    await axios.post(`${process.env.REACT_APP_API_URL}/unfollow`, {
      currentUser: loggedinuser.email,
      targetUser: email,
    })
    setIsFollowing(false)
  }

  if (!profile) return <div>Loading...</div>

  const username = profile.email.split('@')[0]

  return (
    <div className="otherProfilePage">
      <ArrowBackIcon className="arrow-icon" onClick={() => navigate('/')} />
      <h4 className="heading-4">{username}</h4>

      <div className="mainprofile">
        <div className="profile-bio">
          {/* COVER IMAGE */}
          <div className="coverImageContainer">
            <img
              src={profile.coverImage || '/default-cover.jpg'}
              alt="cover"
              className="coverImage"
            />
          </div>

          {/* PROFILE IMAGE */}
          <div className="avatar-img">
            <div className="avatarContainer">
              <img
                src={profile.profileImage || '/avatar/a1.jpg'}
                alt="avatar"
                className="avatar"
              />
            </div>

            {/* USER INFO */}
            <div className="userInfo">
              <h3 className="heading-3">{profile.name}</h3>
              <p className="usernameSection">@{username}</p>

              {/* Follow / Unfollow */}
              {loggedinuser?.email !== email && (
                <div className="follow-section">
                  {isFollowing ? (
                    <button className="unfollowBtn" onClick={unfollowUser}>
                      Unfollow
                    </button>
                  ) : (
                    <button className="followBtn" onClick={followUser}>
                      Follow
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* LOCATION */}
            {location && (
              <div className="locationSection">
                <span className="subInfo">
                  📍 {location.state}, {location.country}
                </span>
              </div>
            )}

            {/* MAP */}
            {location && (
              <div className="mapCard">
                <GoogleMap
                  latitude={location.latitude}
                  longitude={location.longitude}
                />
              </div>
            )}

            {/* WEATHER */}
            {weather && (
              <div className="weatherCard">
                <h3>Weather</h3>
                <p>🌡 Temp: {weather.main.temp}°C</p>
                <p>☁ {weather.weather[0].description}</p>
                <p>💧 Humidity: {weather.main.humidity}%</p>
              </div>
            )}

            <h4 className="tweetsText">Tweets</h4>
          </div>

          {/* POSTS */}
          {posts.map((p) => (
            <Post key={p._id} p={p} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default OtherUserProfile
