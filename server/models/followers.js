const mongoose = require("mongoose");

const followerSchema = new mongoose.Schema({
   userId: { type: String, required: true },       // whose profile
   followers: { type: [String], default: [] },     // people following him
   following: { type: [String], default: [] }      // whom he follows
});

module.exports = mongoose.model("Followers", followerSchema);
