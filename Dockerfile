FROM node:18

# 🔧 System dependencies
RUN apt-get update && apt-get install -y ffmpeg wget && rm -rf /var/lib/apt/lists/*

# 📁 App folder
WORKDIR /app

# 📦 Copy package files first (faster builds)
COPY package*.json ./

# 📦 Install dependencies
RUN npm install

# 📁 Copy rest of code
COPY . .

# 🔽 Install yt-dlp
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O yt-dlp && \
    chmod +x yt-dlp

# 🚀 Start app
CMD ["node", "index.js"]
