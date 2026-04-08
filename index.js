const express = require("express");
const axios = require("axios");
const { exec } = require("child_process");
const fs = require("fs");
const FormData = require("form-data");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Telegram Bot Token (Render ENV vich set karo)
const BOT_TOKEN = process.env.BOT_TOKEN;

// ✅ Home Route
app.get("/", (req, res) => {
  res.json({
    status: "running",
    message: "🔥 PRO API + TELEGRAM BOT RUNNING"
  });
});

// ✅ MAIN API
app.get("/Saini_bots", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    const userId = req.query.user_id;

    if (!videoUrl || !userId) {
      return res.json({
        status: "error",
        message: "Missing url or user_id"
      });
    }

    const fileName = "video.mp4";

    // 🔥 yt-dlp command (improved)
    const command = `./yt-dlp -f best -o ${fileName} "${videoUrl}"`;

    console.log("Downloading:", videoUrl);

    exec(command, async (error, stdout, stderr) => {

      if (error) {
        console.log("Download error:", stderr);

        return res.json({
          status: "error",
          message: "Download failed",
          detail: stderr
        });
      }

      try {
        // 📤 Send to Telegram
        const formData = new FormData();
        formData.append("chat_id", userId);
        formData.append("video", fs.createReadStream(fileName));

        await axios.post(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`,
          formData,
          { headers: formData.getHeaders() }
        );

        // 🧹 Delete file
        fs.unlinkSync(fileName);

        res.json({
          status: "success",
          message: "Video sent to Telegram"
        });

      } catch (tgError) {
        console.log("Telegram error:", tgError.message);

        res.json({
          status: "error",
          message: "Telegram send failed",
          detail: tgError.message
        });
      }
    });

  } catch (err) {
    console.log("Server error:", err.message);

    res.json({
      status: "error",
      message: "Server error",
      detail: err.message
    });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});