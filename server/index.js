const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
const userRoutes = require("./routes/userRoutes");
// Use Routes
app.use("/api/user", userRoutes);

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

    // ✅ Get All Posts
    app.get("/post", async (req, res) => {
      const post = (await postcollection.find().toArray()).reverse();
      res.send(post);
    });

    // ✅ Get User Posts
    app.get("/userpost", async (req, res) => {
      const email = req.query.email;
      const post = (await postcollection.find({ email }).toArray()).reverse();
      res.send(post);
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





    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ Error connecting MongoDB:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => console.log(`🚀 Twiller backend running on port ${port}`));
