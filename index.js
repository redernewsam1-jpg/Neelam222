const express = require("express");
const axios = require("axios");
const { exec } = require("child_process");
const fs = require("fs");
const FormData = require("form-data");

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

// ✅ Home
app.get("/", (req, res) => {
  res.json({
    status: "running",
    message: "🔥 BOT + API WORKING"
  });
});

// 🔥 DOWNLOAD + SEND FUNCTION (UPDATED)
function downloadAndSend(videoUrl, userId) {
  return new Promise((resolve, reject) => {
    const fileName = "video.mp4";

    // 🔥 FIXED yt-dlp COMMAND (m3u8 support)
    const command = `./yt-dlp -o ${fileName} --no-check-certificate --add-header "Referer: https://classplusapp.com/" --add-header "User-Agent: Mozilla/5.0" "${videoUrl}"`;

    console.log("Downloading:", videoUrl);

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.log("Download error:", stderr);
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
        console.log("Telegram error:", err.message);
        reject("Telegram send failed");
      }
    });
  });
}

// ✅ API
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

// 🤖 WEBHOOK
app.post("/webhook", async (req, res) => {

  console.log("🔥 Webhook hit:", JSON.stringify(req.body));

  res.sendStatus(200); // ⚡ instant reply

  try {
    const message = req.body.message;
    if (!message) return;

    const chatId = message.chat.id;
    const text = message.text;

    if (text === "/start") {
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: "👋 Send video link (m3u8/mp4)\nI will download & send 🎬"
      });
      return;
    }

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

  } catch (err) {
    console.log("Webhook error:", err.message);
  }
});

// 🚀 Start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
