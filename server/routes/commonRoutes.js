const express = require("express");
const bcrypt = require("bcrypt");
const useragent = require("useragent");
const router = express.Router();

// We export a function that takes the dependencies (collections & transporter)
module.exports = (otpCollection, loginInfoCollection, transporter) => {

  // ✅ Send OTP
  router.post("/send-otp", async (req, res) => {
    try {
      const { email } = req.body;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOTP = await bcrypt.hash(otp, 10);

      // Update existing OTP or insert new one
      await otpCollection.updateOne(
        { email },
        {
          $set: {
            otp: hashedOTP,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + (process.env.OTP_TTL_MIN || 5) * 60000),
          },
        },
        { upsert: true }
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

  // ✅ Verify OTP
  router.post("/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      const record = await otpCollection.findOne({ email });

      if (!record) return res.status(400).send({ message: "No OTP found!" });

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

  // ✅ Login History
  router.get("/login-history", async (req, res) => {
    try {
      const email = req.query.email;
      const history = await loginInfoCollection
        .find({ email })
        .sort({ loginTime: -1 })
        .toArray();

      res.json(history);
    } catch (err) {
      res.status(500).json({ message: "Error fetching history" });
    }
  });

  return router;
};