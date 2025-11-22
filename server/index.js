const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const axios = require("axios");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const useragent = require("useragent");


const app = express();
app.use(cors());
app.use(express.json());
const uri = "mongodb+srv://akshaiv:vijayrr2205@twitter-db.hsoj1ah.mongodb.net/";
const port = 5000;

// MongoDB setup
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("database");
    const postcollection = db.collection("posts");
    const usercollection = db.collection("users");
    const otpCollection = db.collection("otp");
    const loginInfoCollection = db.collection("loginInfos");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // <--- ignore self-signed cert
      },
    });

    // ✅ Root
    app.get("/", (req, res) => res.send("🚀 Twiller Backend Running!"));

    // ✅ Register User
    app.post("/register", async (req, res) => {
      try {
        const user = req.body;
        const result = await usercollection.insertOne(user);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Registration failed" });
      }
    });

    // ✅ Get User by Email
    app.get("/loggedinuser", async (req, res) => {
      const email = req.query.email;
      const user = await usercollection.findOne({ email });
      console.log("Fetched user:", user);
      res.send(user);
    });

    // ✅ Create Post
    app.post("/post", async (req, res) => {
      try {
        const post = req.body;
        const result = await postcollection.insertOne(post);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Post failed" });
      }
    });

    // ✅ Get ALL Posts with user profile images
    app.get("/post", async (req, res) => {
      try {
        const posts = await postcollection.find().toArray();

        // Reverse for latest first
        const reversed = posts.reverse();

        // Attach profile image for each post
        const finalPosts = await Promise.all(
          reversed.map(async (p) => {
            const user = await usercollection.findOne({ email: p.email });

            return {
              ...p,
              profileImage : user?.profileImage || null,
              username: user?.username || "",
              name: user?.name || "",
            };
          })
        );

        res.send(finalPosts);
      } catch (err) {
        console.log(err);
        res.status(500).send({ error: "Server error" });
      }
    });

        // ✅ Get User Posts + Append User Info
    app.get("/userpost", async (req, res) => {
      try {
        const email = req.query.email;

        // 🔹 1. Get user details from users collection
        const user = await usercollection.findOne(
          { email: email },
          { projection: { profileImage: 1, name: 1, username: 1, email: 1 } }
        );

        // 🔹 2. Get posts from posts collection
        let posts = await postcollection.find({ email: email }).toArray();

        // reverse (same as your current logic)
        posts = posts.reverse();

        // 🔹 3. Append user info to every post
        const finalPosts = posts.map((p) => ({
          ...p,
          profileImage: user?.profileImage ?? null,
          username: user?.username ?? email.split("@")[0],
          name: user?.name ?? "",
        }));

        // 🔹 4. Send to frontend
        res.send(finalPosts);

      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Server error" });
      }
    });


    // ✅ Get All Users
    app.get("/user", async (req, res) => {
      const users = await usercollection.find().toArray();
      res.send(users);
    });

    // ✅ Update User Profile
    // app.patch("/userupdate/:email", async (req, res) => {
    //   try {
    //     const email = req.params.email;
    //     const profile = req.body;

    //     const updateFields = {};
    //     if (profile.name) updateFields.name = profile.name;
    //     if (profile.bio) updateFields.bio = profile.bio;
    //     if (profile.location) updateFields.location = profile.location;
    //     if (profile.website) updateFields.website = profile.website;
    //     if (profile.dob) updateFields.dob = profile.dob;

    //     const filter = { email };
    //     const updateDoc = { $set: updateFields };

    //     const result = await usercollection.updateOne(filter, updateDoc);
    //     res.json({ success: true, message: "Profile updated successfully", result });
    //   } catch (error) {
    //     res.status(500).json({ success: false, message: "Internal server error" });
    //   }
    // });






app.post("/save-location", async (req, res) => {
  try {
    const { email, latitude, longitude } = req.body;

    if (!email || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing data" });
    }

    console.log("Received:", email, latitude, longitude);

    // 🔹 Reverse Geocoding with OpenStreetMap Nominatim
    const nominatimURL = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

    const geoRes = await axios.get(nominatimURL, {
      headers: {
        "User-Agent": "TwillerApp/1.0 (your-email@example.com)" // required by Nominatim
      }
    });

    const address = geoRes.data.address;
    const city = address.city || address.town || address.village || "";
    const state = address.state || "";
    const country = address.country || "";

    console.log("Reverse geocode result:", city, state, country);

    // 🔹 Optional: Weather API (OpenWeatherMap) — keep your API key
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.WEATHER_API_KEY}&units=metric`;
    const weatherRes = await axios.get(weatherURL);
    const weather = {
      temperature: weatherRes.data.main.temp,
      humidity: weatherRes.data.main.humidity,
      condition: weatherRes.data.weather[0].description
    };

    // 🔹 Save to MongoDB
    await usercollection.updateOne(
      { email },
      { $set: { location: { latitude, longitude, city, state, country, weather } } }
    );

    res.json({ success: true, location: { city, state, country, weather } });
  } catch (err) {
    console.error("Save-location error:", err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// =========================
//   GET USER LOCATION
// =========================
app.get("/get-location", async (req, res) => {
  try {
    const email = req.query.email;
    const user = await usercollection.findOne({ email });

    res.json(user?.location || {});
  } catch (err) {
    res.json({ error: "Error fetching location" });
  }
});

// ✅ Update User Profile (with profileImage + coverImage)
app.patch("/userupdate/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const profile = req.body;

    const updateFields = {};

    // Basic details
    if (profile.name) updateFields.name = profile.name;
    if (profile.bio) updateFields.bio = profile.bio;
    if (profile.location) updateFields.location = profile.location;
    if (profile.website) updateFields.website = profile.website;
    if (profile.dob) updateFields.dob = profile.dob;

    // Images (Cloudinary URLs)
    if (profile.profileImage) updateFields.profileImage = profile.profileImage;
    if (profile.coverImage) updateFields.coverImage = profile.coverImage;

    const filter = { email };
    const updateDoc = { $set: updateFields };

    const result = await usercollection.updateOne(filter, updateDoc);

    res.json({
      success: true,
      message: "Profile updated successfully",
      updateFields,
      result,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);

    // 🔹 Update existing OTP or insert new one
    await otpCollection.updateOne(
      { email }, // filter
      {
        $set: {
          otp: hashedOTP,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + (process.env.OTP_TTL_MIN || 5) * 60000),
        },
      },
      { upsert: true } // insert if not exists
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Login OTP",
      text: `Your One-Time Password is: ${otp}`,
    });

    res.json({ success: true, message: "OTP sent successfully!" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ success: false, message: "OTP send failed" });
  }
});


app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await otpCollection.findOne({ email });

    if (!record) return res.status(400).send({ message: "No OTP found!" });
    console.log("Record : ", record
    )
    if (record.expiresAt < new Date())
      return res.status(400).send({ message: "OTP expired!" });

    const valid = await bcrypt.compare(otp, record.otp);
    if (!valid) return res.status(400).send({ message: "Invalid OTP!" });

    // Device tracking info
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const agent = useragent.parse(req.headers["user-agent"]);
    const browser = agent.toAgent();
    const os = agent.os.toString();
    const deviceType = /mobile/i.test(req.headers["user-agent"]) ? "Mobile" : "Desktop";

    await loginInfoCollection.insertOne({
      email,
      ip,
      browser,
      os,
      deviceType,
      loginTime: new Date(),
    });

    res.json({
      success: true,
      message: "OTP verified!",
      browser,
      os,
      deviceType,
    });

    await otpCollection.deleteOne({ email }); // Cleanup

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification error!" });
  }
});
app.get("/login-history", async (req, res) => {
  const email = req.query.email;

  const history = await loginInfoCollection
    .find({ email })
    .sort({ loginTime: -1 })
    .toArray();

  res.json(history);
});

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ Error connecting MongoDB:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => console.log(`🚀 Twiller backend running on port ${port}`));
