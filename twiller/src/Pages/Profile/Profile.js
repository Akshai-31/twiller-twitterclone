import React, { useState } from "react";
import "../pages.css";
import Mainprofile from "./Mainprofile/Mainprofile";
import { useUserAuth } from "../../context/UserAuthContext";
import { getCurrentLocation } from "../../utils/location";
import axios from "axios";
import GoogleMap from "./GoogleMap";

const Profile = () => {
  const { user } = useUserAuth();
  const [location, setLocation] = useState(null);

  const handleGetLocation = async () => {
    try {
      const coords = await getCurrentLocation();

      const res = await axios.post("http://localhost:5000/save-location", {
        email: user.email,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        city: res.data.location.city,
        state: res.data.location.state,
        country: res.data.location.country,
      });
    } catch (err) {
      console.log(err);
      alert("Location access denied or backend error");
    }
  };

  return (
    <div className="profilePage">
      <Mainprofile user={user} location={location} handleGetLocation={handleGetLocation} />

      {/* 👇 Location Button */}
      <button onClick={handleGetLocation} className="getLocationBtn">
        Gett My Location
      </button>

      {/* 👇 Show Google Map if location exists */}
      {location && (
        <GoogleMap
          latitude={location.latitude}
          longitude={location.longitude}
        />
      )}
    </div>
  );
};

export default Profile;
