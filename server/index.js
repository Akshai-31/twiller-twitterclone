const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const axios = require("axios");
const nodemailer = require("nodemailer");

// Import the new route file
const commonRoutes = require("./routes/commonRoutes");

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
        rejectUnauthorized: false,
      },
    });

    // ✅ Root
    app.get("/", (req, res) => res.send("🚀 Twiller Backend Running!"));

    // ✅ MOUNT COMMON ROUTES (OTP & History)
    // We pass the dependencies (collections + transporter) here
    app.use("/", commonRoutes(otpCollection, loginInfoCollection, transporter));

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
        const reversed = posts.reverse();

        const finalPosts = await Promise.all(
          reversed.map(async (p) => {
            const user = await usercollection.findOne({ email: p.email });
            return {
              ...p,
              profileImage: user?.profileImage || null,
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
        const user = await usercollection.findOne(
          { email: email },
          { projection: { profileImage: 1, name: 1, username: 1, email: 1 } }
        );
        let posts = await postcollection.find({ email: email }).toArray();
        posts = posts.reverse();

        const finalPosts = posts.map((p) => ({
          ...p,
          profileImage: user?.profileImage ?? null,
          username: user?.username ?? email.split("@")[0],
          name: user?.name ?? "",
        }));
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

    // ✅ Save Location
    app.post("/save-location", async (req, res) => {
      try {
        const { email, latitude, longitude } = req.body;

        if (!email || !latitude || !longitude) {
          return res.status(400).json({ error: "Missing data" });
        }

        const nominatimURL = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

        const geoRes = await axios.get(nominatimURL, {
          headers: {
            "User-Agent": "TwillerApp/1.0 (your-email@example.com)",
          },
        });

        const address = geoRes.data.address;
        const city = address.city || address.town || address.village || "";
        const state = address.state || "";
        const country = address.country || "";

        const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.WEATHER_API_KEY}&units=metric`;
        const weatherRes = await axios.get(weatherURL);
        const weather = {
          temperature: weatherRes.data.main.temp,
          humidity: weatherRes.data.main.humidity,
          condition: weatherRes.data.weather[0].description,
        };

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

    // ✅ Get User Location
    app.get("/get-location", async (req, res) => {
      try {
        const email = req.query.email;
        const user = await usercollection.findOne({ email });
        res.json(user?.location || {});
      } catch (err) {
        res.json({ error: "Error fetching location" });
      }
    });

    // ✅ Update User Profile
    app.patch("/userupdate/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const profile = req.body;
        const updateFields = {};

        if (profile.name) updateFields.name = profile.name;
        if (profile.bio) updateFields.bio = profile.bio;
        if (profile.location) updateFields.location = profile.location;
        if (profile.website) updateFields.website = profile.website;
        if (profile.dob) updateFields.dob = profile.dob;
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

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ Error connecting MongoDB:", error);
  }
}

run().catch(console.dir);

app.listen(port, () =>
  console.log(`🚀 Twiller backend running on port ${port}`)
);