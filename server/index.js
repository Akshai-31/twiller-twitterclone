const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");

const uri = "mongodb+srv://akshaiv:vijayrr2205@twitter-db.hsoj1ah.mongodb.net/";
const port = 5000;

const app = express();
app.use(cors());
app.use(express.json());

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

    // ✅ Register new user
    app.post("/register", async (req, res) => {
      try {
        const user = req.body;
        const result = await usercollection.insertOne(user);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error in /register:", error);
        res.status(500).send({ error: "Registration failed" });
      }
    });

    // ✅ Get logged-in user by email
    app.get("/loggedinuser", async (req, res) => {
      try {
        const email = req.query.email;
        const user = await usercollection.findOne({ email });
        res.send(user);
      } catch (error) {
        console.error("Error in /loggedinuser:", error);
        res.status(500).send({ error: "Failed to fetch user" });
      }
    });

    // ✅ Create a new post
    app.post("/post", async (req, res) => {
      try {
        const post = req.body;
        const result = await postcollection.insertOne(post);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error in /post:", error);
        res.status(500).send({ error: "Failed to create post" });
      }
    });

    // ✅ Get all posts (reversed)
    app.get("/post", async (req, res) => {
      try {
        const post = (await postcollection.find().toArray()).reverse();
        res.send(post);
      } catch (error) {
        console.error("Error in /post:", error);
        res.status(500).send({ error: "Failed to fetch posts" });
      }
    });

    // ✅ Get posts by user email
    app.get("/userpost", async (req, res) => {
      try {
        const email = req.query.email;
        const post = (
          await postcollection.find({ email }).toArray()
        ).reverse();
        res.send(post);
      } catch (error) {
        console.error("Error in /userpost:", error);
        res.status(500).send({ error: "Failed to fetch user posts" });
      }
    });

    // ✅ Get all users
    app.get("/user", async (req, res) => {
      try {
        const users = await usercollection.find().toArray();
        res.send(users);
      } catch (error) {
        console.error("Error in /user:", error);
        res.status(500).send({ error: "Failed to fetch users" });
      }
    });

   app.patch("/userupdate/:email", async (req, res) => {
  try {
    const email = req.params.email; // ✅ Correctly extract email from params
    const profile = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // ✅ Build update object dynamically (only fields that exist)
    const updateFields = {};
    if (profile.name) updateFields.name = profile.name;
    if (profile.bio) updateFields.bio = profile.bio;
    if (profile.location) updateFields.location = profile.location;
    if (profile.website) updateFields.website = profile.website;
    if (profile.dob) updateFields.dob = profile.dob;

    const filter = { email: email };
    const options = { upsert: true };
    const updateDoc = { $set: updateFields };

    const result = await usercollection.updateOne(filter, updateDoc, options);

    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      res.json({ success: true, message: "Profile updated successfully" });
    } else {
      res.json({ success: false, message: "No changes made" });
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


    // ✅ Root route
    app.get("/", (req, res) => {
      res.send("Twiller is working 🚀");
    });

    console.log("✅ Connected to MongoDB and server endpoints are ready!");
  } catch (error) {
    console.error("❌ Connection Error:", error);
  }
  // ✅ GET User Profile (View)
app.get("/api/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
});

// ✅ PUT User Profile (Update)
app.put("/api/profile/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
});


}

run().catch(console.dir);




app.listen(port, () => {
  console.log(`🚀 Twiller clone running on port ${port}`);
});
