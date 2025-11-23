import React, { useState, useRef, useEffect } from "react";
import "./Tweetbox.css";
import axios from "axios";
import {
  Avatar,
  Button,
  Dialog,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
} from "@mui/material";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import { useUserAuth } from "./../../../context/UserAuthContext";
import useLoggedinuser from "./../../../hooks/useLoggedinuser";
import { uploadMediaToCloudinary } from "../../../utils/cloudinaryUpload";

const Tweetbox = ({ reloadPosts }) => {
  const [post, setPost] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [openAudioPopup, setOpenAudioPopup] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioPreview, setAudioPreview] = useState(null);

  const [openOtp, setOpenOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const otpSent = useRef(false);

  const MAX_DURATION = 5 * 60 * 1000; // 5 minutes
  let recordTimer;

  const { user } = useUserAuth();
  const [loggedinuser] = useLoggedinuser();

  const [recordTime, setRecordTime] = useState(0);
  const audioVisualizerRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);


  // ----------- AUDIO RECORDING LOGIC ----------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      let chunks = [];
      setAudioPreview(null);
      setPreview(null);
      setMediaFile(null);

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      // Waveform animation
      const canvas = audioVisualizerRef.current;
      const ctx = canvas.getContext("2d");

      const drawWaveform = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "#1DA1F2"; // Twitter Blue
        ctx.lineWidth = 2;
        ctx.beginPath();

        dataArray.forEach((value, i) => {
          const x = (i / dataArray.length) * canvas.width;
          const y = (value / 255) * canvas.height;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });

        ctx.stroke();
        animationRef.current = requestAnimationFrame(drawWaveform);
      };

      drawWaveform();

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = () => {
        cancelAnimationFrame(animationRef.current);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        analyser.disconnect();
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        setAudioPreview(url);
        setPreview(url);
        setMediaFile(new File([blob], "recording.webm", { type: "audio/webm" }));
        otpSent.current = false;
        setOpenOtp(true);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setRecordTime(0);

      const timerInterval = setInterval(() => {
        setRecordTime((prev) => {
          if (prev >= MAX_DURATION / 1000) {
            clearInterval(timerInterval);
            stopRecording();
          }
          return prev + 1;
        });
      }, 1000);
    } catch(err) {
      console.error("Audio Permission Error: ", err);

      alert("Microphone access denied!");
    }
  };


  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    }
    clearTimeout(recordTimer);
    setRecording(false);
  };

  // ----------- OTP POPUP - AUTO SEND OTP ----------------
  useEffect(() => {
    const sendOtp = async () => {
      try {
        const res = await fetch("http://localhost:5000/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: loggedinuser?.email,
          }),
        });
        const data = await res.json();
        setOtpMessage(data.message || "OTP sent to your email");
      } catch (err) {
        console.error(err);
        setOtpMessage("Failed to send OTP");
      }
    };

    if (openOtp && !otpSent.current && loggedinuser?.email) {
      otpSent.current = true;
      sendOtp();
    }
  }, [openOtp, loggedinuser]);

  // ----------- VERIFY OTP THEN ALLOW UPLOAD ----------------
  const verifyOtp = async () => {
    try {
      const res = await fetch("http://localhost:5000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loggedinuser?.email,
          otp,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setOtpMessage("OTP verified!");
        setTimeout(() => setOpenOtp(false), 1000);
        return;
      } else {
        setOtpMessage("Incorrect OTP");
      }
    } catch (err) {
      console.error(err);
      setOtpMessage("Verification failed");
    }
  };

  // ----------- FILE UPLOAD ----------------
  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMediaFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // ----------- TWEET SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!post.trim() && !mediaFile) {
      alert("Post cannot be empty!");
      return;
    }

    // If audio: Require OTP verification
    if (mediaFile?.type.includes("audio") && otpMessage !== "OTP verified!") {
      alert("You must verify OTP before posting audio!");
      setOpenOtp(true);
      return;
    }

    setUploading(true);

    let uploadedMedia = null;

    if (mediaFile) {
      uploadedMedia = await uploadMediaToCloudinary(mediaFile);
    }

    const newPost = {
      email: loggedinuser?.email,
      post: post,
      mediaUrl: uploadedMedia?.secure_url || "",
      mediaType: uploadedMedia?.resource_type || "",
      name: loggedinuser?.name,
      username: loggedinuser?.username,
      profilephoto: loggedinuser?.profilephoto,
      createdAt: new Date(),
    };

    try {
      await axios.post("http://localhost:5000/post", newPost);

      setPost("");
      setMediaFile(null);
      setPreview(null);
      setUploading(false);
      reloadPosts();

      setOtp("");
      setOtpMessage("");
    } catch (err) {
      console.error("Tweet error:", err);

      const backend = err.response?.data;
      if (backend?.errorType === "time") {
        alert("Posting allowed only between 10 AM - 10:30 AM (IST) because you have 0 followers.");
      }
      else if (backend?.errorType === "limit") {
        alert("Posting limit reached for today.");
      }
      else {
        alert(backend?.error || "Tweet failed");
      }
    }
  };

  return (
    <>
      {/* ------------------ AUDIO RECORD POPUP ------------------ */}
      <Dialog open={openAudioPopup} onClose={() => setOpenAudioPopup(false)}>
        <Card sx={{ width: 350, padding: 2 }}>
          <CardContent>
            <Typography variant="h6">Record Audio</Typography>

            {audioPreview ? (
              <audio controls src={audioPreview} style={{ width: "100%", marginTop: 10 }} />
            ) : (
              <Typography sx={{ mt: 2 }}>
                <canvas
                  ref={audioVisualizerRef}
                  width={300}
                  height={80}
                  style={{
                    display: recording ? "block" : "none",
                    background: "#000",
                    width: "100%",
                    borderRadius: "8px",
                  }}
                />

                {recording && (
                  <Typography sx={{ mt: 1, textAlign: "center" }}>
                    {new Date(recordTime * 1000).toISOString().substr(14, 5)}
                  </Typography>
                )}


              </Typography>
            )}
          </CardContent>

          <CardActions>
            {!recording ? (
              <Button variant="contained" onClick={startRecording}>
                🎙 Start
              </Button>
            ) : (
              <Button variant="outlined" color="error" onClick={stopRecording}>
                ⏹ Stop
              </Button>
            )}

            <Button onClick={() => setOpenAudioPopup(false)}>Close</Button>
          </CardActions>
        </Card>
      </Dialog>

      {/* ------------------ OTP POPUP ------------------ */}
      <Dialog open={openOtp} onClose={() => setOpenOtp(false)}>
        <Card sx={{ width: 350, padding: 2 }}>
          <CardContent>
            <Typography variant="h6">Verify OTP</Typography>
            <Typography sx={{ mt: 1 }} color="green">
              {otpMessage}
            </Typography>

            <TextField
              fullWidth
              label="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              sx={{ mt: 2 }}
            />
          </CardContent>

          <CardActions>
            <Button variant="contained" onClick={verifyOtp}>
              Verify
            </Button>
            <Button onClick={() => setOpenOtp(false)}>Cancel</Button>
          </CardActions>
        </Card>
      </Dialog>

      {/* ------------------ MAIN TWEET BOX ------------------ */}
      <div className="tweetBox">
        <form onSubmit={handleSubmit}>
          <div className="tweetBox__input">
            <Avatar src={loggedinuser?.profilephoto} />

            <textarea
              className="tweetBox__textarea"
              placeholder="What's happening?"
              value={post}
              onChange={(e) => setPost(e.target.value)}
              rows={1}
            />
          </div>

          {/* Media Preview */}
          {preview && (
            <div className="mediaPreview">
              {mediaFile?.type?.includes("image") && (
                <img src={preview} alt="preview" style={{ width: "100%", borderRadius: "10px" }} />
              )}

              {mediaFile?.type?.includes("video") && (
                <video controls style={{ width: "100%", borderRadius: "10px" }}>
                  <source src={preview} />
                </video>
              )}

              {mediaFile?.type?.includes("audio") && (
                <audio controls>
                  <source src={preview} />
                </audio>
              )}
            </div>
          )}

          <div className="tweetBox__footer">
            <div className="footer-icons">
              <label className="uploadMediaBtn">
                <AddPhotoAlternateOutlinedIcon />
                <input type="file" accept="image/*,video/*,audio/*" onChange={handleMediaSelect} />
              </label>

              <div className="audioRecordBtn" onClick={() => setOpenAudioPopup(true)}>
                🎤
              </div>
            </div>

            <Button
              type="submit"
              disabled={uploading}
              variant="contained"
              className="tweetBox__tweetButton"
            >
              {uploading ? "Uploading..." : "Tweet"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Tweetbox;
