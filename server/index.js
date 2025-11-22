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

    // Create Post
    app.post("/post", async (req, res) => {
      try {
        const post = req.body;
        const result = await postcollection.insertOne(post);
        res.status(201).send(result);
      } catch (err) {
        res.status(500).send({ error: "Post failed" });
      }
    });

    // Get all posts
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
          temperature: weatherRes.data.main.temp,
          humidity: weatherRes.data.main.humidity,
          condition: weatherRes.data.weather[0].description
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
