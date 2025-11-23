import React, { useEffect, useRef } from "react";

const GoogleMap = ({ latitude, longitude }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom: 15,
    });

    new window.google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: map,
    });
  }, [latitude, longitude]);

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Your Live Location</h3>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "300px",
          borderRadius: "10px",
        }}
      ></div>
    </div>
  );
};

export default GoogleMap;
