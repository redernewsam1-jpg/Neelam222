FROM node:18

RUN apt-get update && apt-get install -y ffmpeg wget

WORKDIR /app
COPY . .

RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O yt-dlp && \
    chmod +x yt-dlp && \
    npm install

CMD ["node", "index.js"]
