import React, { useState } from 'react'
import Mainprofile from './Mainprofile/Mainprofile'
import { useUserAuth } from '../../context/UserAuthContext'
import { getCurrentLocation } from '../../utils/location'
import axios from 'axios'

const Profile = () => {
  const { user } = useUserAuth()
  const [location, setLocation] = useState(null)
  const [weather, setWeather] = useState(null)

  const GOOGLE_MAP_KEY = 'AIzaSyC-gw9E2Mo-OeVTw-IlPeSHndSfGZBx7Vk'
  const WEATHER_KEY = 'e064b116f8820c72fdcb38ecdff6e4b1'

  const handleGetLocation = async () => {
    try {
      const coords = await getCurrentLocation()

      const res = await axios.post(`/save-location`, {
        email: user.email,
        latitude: coords.latitude,
        longitude: coords.longitude,
      })

      const locData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        city: res.data.location.city,
        state: res.data.location.state,
        country: res.data.location.country,
      }

      setLocation(locData)

      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${WEATHER_KEY}&units=metric`
      )

      setWeather(weatherRes.data)
    } catch (err) {
      console.log(err)
      alert('Location access denied or backend error')
    }
  }

  return (
    <Mainprofile
      user={user}
      location={location}
      weather={weather}
      googleKey={GOOGLE_MAP_KEY}
      handleGetLocation={handleGetLocation}
    />
  )
}

export default Profile
