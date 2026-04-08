const express = require("express");
const axios = require("axios");
const { exec } = require("child_process");
const fs = require("fs");
const FormData = require("form-data");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

// ✅ Home Route
app.get("/", (req, res) => {
  res.json({
    status: "running",
    message: "🔥 PRO API + TELEGRAM BOT RUNNING"
  });
});

// 🔥 COMMON FUNCTION (download + send)
function downloadAndSend(videoUrl, userId) {
  return new Promise((resolve, reject) => {
    const fileName = "video.mp4";
    const command = `./yt-dlp -f best -o ${fileName} "${videoUrl}"`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.log(stderr);
        return reject("Download failed");
      }

      try {
        const formData = new FormData();
        formData.append("chat_id", userId);
        formData.append("video", fs.createReadStream(fileName));

        await axios.post(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`,
          formData,
          { headers: formData.getHeaders() }
        );

        fs.unlinkSync(fileName);
        resolve("Video sent");

      } catch (err) {
        reject("Telegram send failed");
      }
    });
  });
}

// ✅ MAIN API (same as before)
app.get("/Saini_bots", async (req, res) => {
  const videoUrl = req.query.url;
  const userId = req.query.user_id;

  if (!videoUrl || !userId) {
    return res.json({ status: "error", message: "Missing params" });
  }

  try {
    await downloadAndSend(videoUrl, userId);
    res.json({ status: "success", message: "Video sent" });
  } catch (err) {
    res.json({ status: "error", message: err });
  }
});

// 🤖 TELEGRAM WEBHOOK (FIXED 🔥)
app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.message;
    if (!message) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = message.text;

    // 👉 /start command
    if (text === "/start") {
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: "👋 Send video link (m3u8/mp4)\nI will download & send 🎬"
      });
      return res.sendStatus(200);
    }

    // 👉 Link received
    if (text && text.startsWith("http")) {
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: "⏳ Downloading..."
      });

      try {
        await downloadAndSend(text, chatId);

        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          chat_id: chatId,
          text: "✅ Done"
        });

      } catch (err) {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          chat_id: chatId,
          text: "❌ " + err
        });
      }
    }

    res.sendStatus(200);

  } catch (err) {
    res.sendStatus(500);
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
