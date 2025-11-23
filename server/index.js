// backend/index.js
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const axios = require("axios");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Import the new route file
const commonRoutes = require("./routes/commonRoutes");

const app = express();
app.use(cors());
app.use(express.json());
 
const uri = process.env.MONGO_URI
const port = process.env.PORT;

// Weather API (NO .env)
const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;

// MongoDB setup
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("database");
    const postcollection = db.collection("posts");
    const usercollection = db.collection("users");
    const followersCollection = db.collection("followers"); // <-- new
    const otpCollection = db.collection("otp");
    const loginInfoCollection = db.collection("loginInfos");
const notificationsCollection = db.collection("notifications");


    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      pool: true,
      rateLimit: 1, // Allow one email at a time (optional)
      connectionTimeout: 10000, // 10 seconds timeout
      greetingTimeout: 5000, // 5 seconds timeout for greeting
      socketTimeout: 5000 // 5 seconds socket timeout
    });

    // Root
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
        res.status(500).send({ error: "Registration failed" });
      }
    });

    // Get user
    app.get("/loggedinuser", async (req, res) => {
      const email = req.query.email;
      const user = await usercollection.findOne({ email });
      res.send(user);
    });

    // ---------------- FOLLOW / UNFOLLOW / STATUS ----------------

    // FOLLOW
app.post("/follow", async (req, res) => {
  const { currentUser, targetUser } = req.body;

  if (!currentUser || !targetUser)
    return res.status(400).send({ error: "Missing data" });

  try {
    // Add followers
    await followersCollection.updateOne(
      { userId: targetUser },
      { $addToSet: { followers: currentUser } },
      { upsert: true }
    );

    await followersCollection.updateOne(
      { userId: currentUser },
      { $addToSet: { following: targetUser } },
      { upsert: true }
    );

    // ⭐ CHECK TARGET USER NOTIFICATION SETTINGS
    const userB = await usercollection.findOne({ email: targetUser });

    if (userB?.isNotification === true) {
      await notificationsCollection.insertOne({
        user: targetUser,
        message: `${currentUser} started following you`,
        isRead:false,
        createdAt: new Date(),
      });
    }

    res.send({ success: true });
  } catch (err) {
    console.log("follow error:", err);
    res.status(500).send({ error: "Something went wrong" });
  }
});



    // UNFOLLOW
    app.post("/unfollow", async (req, res) => {
      const { currentUser, targetUser } = req.body;
      if (!currentUser || !targetUser) return res.status(400).send({ error: "Missing data" });

      try {
        await followersCollection.updateOne(
          { userId: targetUser },
          { $pull: { followers: currentUser } }
        );

        await followersCollection.updateOne(
          { userId: currentUser },
          { $pull: { following: targetUser } }
        );

        res.send({ success: true, message: "Unfollowed successfully" });
      } catch (err) {
        console.error("unfollow error:", err);
        res.status(500).send({ error: "Something went wrong" });
      }
    });

    // FOLLOW STATUS (is currentUser following targetUser?)
    app.get("/follow/status", async (req, res) => {
      const { currentUser, targetUser } = req.query;
      if (!currentUser || !targetUser) return res.status(400).send({ error: "Missing data" });

      try {
        const doc = await followersCollection.findOne({ userId: currentUser });
        const following = doc?.following?.includes(targetUser) || false;
        res.send({ following });
      } catch (err) {
        console.error("follow/status err:", err);
        res.status(500).send({ error: "Something went wrong" });
      }
    });

    // GET FOLLOWERS / FOLLOWING counts (optional helper)
    app.get("/follow/counts", async (req, res) => {
      const { email } = req.query;
      if (!email) return res.status(400).send({ error: "Missing email" });

      try {
        const doc = await followersCollection.findOne({ userId: email });
        const followers = doc?.followers?.length || 0;
        const following = doc?.following?.length || 0;
        res.send({ followers, following });
      } catch (err) {
        console.error("follow/counts err:", err);
        res.status(500).send({ error: "Something went wrong" });
      }
    });

    // ---------------- FOLLOWING FEED ----------------
    app.get("/feed/following", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ error: "Missing email" });

      try {
        const data = await followersCollection.findOne({ userId: email });
        const followingList = data?.following || [];

        if (!followingList.length) {
          return res.send([]); // empty feed
        }

        const posts = await postcollection
          .find({ email: { $in: followingList } })
          .sort({ createdAt: -1 })
          .toArray();

        // attach profile info
        const final = await Promise.all(
          posts.map(async p => {
            const u = await usercollection.findOne({ email: p.email });
            return {
              ...p,
              profileImage: u?.profileImage || null,
              username: u?.username || (p.email.split("@")[0]),
              name: u?.name || ""
            };
          })
        );

        res.send(final);

      } catch (err) {
        console.error("feed/following err:", err);
        res.status(500).send({ error: "Something went wrong" });
      }
    });

    // ---------------- CREATE POST (with posting rules) ----------------
    

    // ---------------- CREATE POST (UPDATED RULES) ----------------
function isTimeInRange(startHour, startMin, endHour, endMin) {
  const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const current = new Date(now);

  const start = new Date(current);
  start.setHours(startHour, startMin, 0, 0);

  const end = new Date(current);
  end.setHours(endHour, endMin, 0, 0);

  return current >= start && current <= end;
}

app.post("/post", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send({ error: "Missing email" });

    // get followers
    const followData = await followersCollection.findOne({ userId: email });
    const following = followData?.following?.length || 0;

    const today = new Date().toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    const todaysPosts = await postcollection.countDocuments({
      email,
      postedDate: today,
      isText: true,
    });

    // ----------- RULE 1: 0 followers ------------
    if (following === 0) {
      if (!isTimeInRange(10, 0, 10, 30)) {
        return res.status(400).send({
          errorType: "time",
          error: "Posting allowed only 10:00 AM - 10:30 AM IST",
        });
      }

      if (todaysPosts >= 1) {
        return res.status(400).send({
          errorType: "limit",
          error: "Only 1 post allowed today",
        });
      }
    }

    // ----------- RULE 2: exactly 2 followers ------------
    if (following <= 2 && todaysPosts >= 2) {
      return res.status(400).send({
        errorType: "limit",
        error: "Max 2 posts allowed per day",
      });
    }

    // ----------- RULE 3: 10+ followers → unlimited posts ------------
    if (following > 10) {
      // unlimited posting
    }

    // ----------- RULE 4: 3–9 followers (default 1 post/day) ------------
    if (following >= 3 && following < 10) {
      if (todaysPosts >= 2) {
        return res.status(400).send({
          errorType: "limit",
          error: "Only 1 post allowed per day",
        });
      }
    }

    // SAVE POST
    const newPost = {
      ...req.body,
      postedDate: today,
      isText: true,
      createdAt: new Date(),
    };

    const result = await postcollection.insertOne(newPost);

    // ========================================================
    // ⭐ NEW CODE FOR NOTIFICATIONS
    // Notify only followers who enabled notifications
    // ========================================================

    const followerList = followData?.followers || [];

    for (let followerEmail of followerList) {
      const followerData = await usercollection.findOne({ email: followerEmail });

      if (followerData?.isNotification === true) {
        await notificationsCollection.insertOne({
          user: followerEmail,
          message: `${email} posted a new tweet`,
          postId: result.insertedId,
          isRead: false,
          createdAt: new Date(),
        });
      }
    }

    // ========================================================

    res.status(201).send(result);

  } catch (err) {
    console.log(err);
    res.status(500).send({ errorType: "server", error: "Server error" });
  }
});


    // ---------------- GET ALL POSTS ----------------
    // Get all posts with updated user info
app.get("/post", async (req, res) => {
  try {
    // Fetch all posts
    const posts = await postcollection.find().toArray();

    // Reverse posts so latest comes first
    const reversedPosts = posts.reverse();

    // Add user info from usercollection
    const finalPosts = await Promise.all(
      reversedPosts.map(async (post) => {
        const user = await usercollection.findOne(
          { email: post.email },
          { projection: { profileImage: 1, username: 1, name: 1 } }
        );

        return {
          ...post,
          profileImage: user?.profileImage || null,
          username: user?.username || "",
          name: user?.name || "",
        };
      })
    );

    res.send(finalPosts);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server error" });
  }
});

// Get posts for a specific user
app.get("/userpost", async (req, res) => {
  try {
    const email = req.query.email;

    // Fetch user info once
    const user = await usercollection.findOne(
      { email },
      { projection: { profileImage: 1, username: 1, name: 1 } }
    );

    // Fetch user's posts
    let posts = await postcollection.find({ email }).toArray();
    posts = posts.reverse(); // latest first

    const finalPosts = posts.map((post) => ({
      ...post,
      profileImage: user?.profileImage || null,
      username: user?.username || email.split("@")[0],
      name: user?.name || "",
    }));

    res.send(finalPosts);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server error" });
  }
});

    // Get location
    app.get("/get-location", async (req, res) => {
      try {
        const email = req.query.email;
        const user = await usercollection.findOne({ email });
        res.json(user?.location || {});
      } catch (err) {
        res.json({ error: "Error fetching location" });
      }
    });

    // Save location with weather
    app.post("/save-location", async (req, res) => {
      try {
        const { email, latitude, longitude } = req.body;

        if (!email || !latitude || !longitude) {
          return res.status(400).json({ error: "Missing data" });
        }

        const nominatimURL = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

        const geoRes = await axios.get(nominatimURL, {
          headers: { "User-Agent": "TwillerApp/1.0" }
        });

        const address = geoRes.data.address;
        const city = address.city || address.town || address.village || "";
        const state = address.state || "";
        const country = address.country || "";

        // Weather API (no env)
        const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_KEY}&units=metric`;

        const weatherRes = await axios.get(weatherURL);
        const weather = {
          main: weatherRes.data.main,
          weather: weatherRes.data.weather,
          wind: weatherRes.data.wind
        };

        await usercollection.updateOne(
          { email },
          { $set: { location: { latitude, longitude, city, state, country, weather } } }
        );

        res.json({ success: true, location: { city, state, country, weather } });

      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
      }
    });

    // Update user
    app.patch("/userupdate/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const updateFields = req.body;

        const result = await usercollection.updateOne(
          { email },
          { $set: updateFields }
        );

        res.json({
          success: true,
          message: "Profile updated",
          result
        });

      } catch (err) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
// enable/disable notification for a specific user
app.post("/follow/notification-toggle", async (req, res) => {
  const { currentUser, targetUser, enable } = req.body;

  await followersCollection.updateOne(
    { currentUser, targetUser },
    { $set: { notifications: enable } }
  );

  res.send({ success: true });
});
// GET NOTIFICATIONS
app.get("/notifications", async (req, res) => {
  const { email } = req.query;

  const data = await notificationsCollection
    .find({ user: email })
    .sort({ createdAt: -1 })
    .toArray();

  res.send(data);
});
// GET UNREAD NOTIFICATION COUNT
app.get("/notifications/count", async (req, res) => {
  const { email } = req.query;

  const count = await notificationsCollection.countDocuments({
    user: email,
    isRead: false,
  });

  res.send({ count });
});
// CLEAR ALL NOTIFICATIONS
app.delete("/notifications/clear", async (req, res) => {
  const { email } = req.body;

  await notificationsCollection.deleteMany({ user: email });

  res.send({ success: true });
});
// UPDATE USER NOTIFICATION TOGGLE
app.patch("/user/toggle-notification/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const { isNotification } = req.body;

    await usercollection.updateOne(
      { email },
      { $set: { isNotification } }
    );

    res.send({ success: true, isNotification });
  } catch (err) {
    res.status(500).send({ error: "Failed to update" });
  }
});

    console.log("✅ MongoDB connected successfully");

  } catch (error) {
    console.error("❌ Error connecting MongoDB:", error);
  }
}

run().catch(console.dir);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});