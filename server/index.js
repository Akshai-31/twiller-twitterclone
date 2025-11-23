// backend/index.js
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://akshaiv:vijayrr2205@twitter-db.hsoj1ah.mongodb.net/";
const port = 5000;

// Weather API (NO .env)
const OPENWEATHER_KEY = "e064b116f8820c72fdcb38ecdff6e4b1";

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

    // Root
    app.get("/", (req, res) => res.send("🚀 Twiller Backend Running!"));

    // Register
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
      if (!currentUser || !targetUser) return res.status(400).send({ error: "Missing data" });

      try {
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

        res.send({ success: true, message: "Followed successfully" });
      } catch (err) {
        console.error("follow error:", err);
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

        const user = await usercollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ error: "User not found" });
        }

        // get followers count from followersCollection
        const followData = await followersCollection.findOne({ userId: email });
        const followers = followData?.followers?.length || 0;

        const today = new Date().toLocaleDateString("en-US", {
          timeZone: "Asia/Kolkata",
        });

        const todaysPosts = await postcollection.countDocuments({
          email,
          postedDate: today,
          isText: true,
        });

        // --------- NO FOLLOWERS RULE (ONLY 10:00 AM - 10:30 AM) ----------
        if (followers === 0) {
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

        // ------------ EXACTLY 2 FOLLOWERS (MAX 2 POSTS PER DAY) ------------
        if (followers === 2 && todaysPosts >= 2) {
          return res.status(400).send({
            errorType: "limit",
            error: "Max 2 posts allowed per day",
          });
        }

        // 10+ followers → unlimited posts → no checks

        // -------- SAVE POST ---------
        const newPost = {
          ...req.body,
          postedDate: today,
          isText: true,
          createdAt: new Date(),
        };

        const result = await postcollection.insertOne(newPost);

        res.status(201).send(result);
      } catch (err) {
        console.log(err);
        res.status(500).send({ errorType: "server", error: "Server error" });
      }
    });

    // ---------------- GET ALL POSTS ----------------
    app.get("/post", async (req, res) => {
      try {
        const posts = await postcollection.find().toArray();
        const reversed = posts.reverse();

        const finalPosts = await Promise.all(
          reversed.map(async p => {
            const user = await usercollection.findOne({ email: p.email });
            return {
              ...p,
              profileImage: user?.profileImage || null,
              username: user?.username || "",
              name: user?.name || ""
            };
          })
        );

        res.send(finalPosts);
      } catch (err) {
        res.status(500).send({ error: "Server error" });
      }
    });

    // Get user posts
    app.get("/userpost", async (req, res) => {
      try {
        const email = req.query.email;

        const user = await usercollection.findOne(
          { email },
          { projection: { profileImage: 1, name: 1, username: 1 } }
        );

        let posts = await postcollection.find({ email }).toArray();
        posts = posts.reverse();

        const finalPosts = posts.map(p => ({
          ...p,
          profileImage: user?.profileImage ?? null,
          username: user?.username ?? email.split("@")[0],
          name: user?.name ?? ""
        }));

        res.send(finalPosts);

      } catch (err) {
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

    console.log("✅ MongoDB connected successfully");

  } catch (error) {
    console.error("❌ Error connecting MongoDB:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => console.log(`🚀 Twiller backend running on port ${port}`));
