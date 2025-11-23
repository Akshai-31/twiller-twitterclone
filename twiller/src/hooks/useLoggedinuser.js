import React, { useEffect, useState } from "react";
import { useUserAuth } from "../context/UserAuthContext";

const useLoggedinuser = () => {
  const { user } = useUserAuth();
  const email = user?.email;
  const [loggedinuser, setloggedinuser] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return; // ✅ Skip API call if no email yet

    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/loggedinuser?email=${email}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.text();
      })
      .then((text) => {
        if (!text) {
          setloggedinuser({});
          localStorage.removeItem("loggedinuser");
          return;
        }

        const data = JSON.parse(text);
        setloggedinuser(data || {});

        // ✅ Store in localStorage
        localStorage.setItem("loggedinuser", JSON.stringify(data));
      })
      .catch((err) => {
        console.error("Error fetching logged in user:", err);
        localStorage.removeItem("loggedinuser");
      })
      .finally(() => setLoading(false));
  }, [email]);

  return [loggedinuser, setloggedinuser, loading];
};

export default useLoggedinuser;
