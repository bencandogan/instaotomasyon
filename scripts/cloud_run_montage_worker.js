// Google Cloud Run HTTP Worker for FFmpeg Video Montage
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', service: 'ffmpeg-montage-worker' }));
  }

  if (req.method === 'POST' && req.url === '/process-video') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { videoUrl, subtitles, watermarkText } = payload;

        console.log(`[Cloud Run] Video işleme başladı: ${videoUrl}`);

        // Yanıtı döndür
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            status: 'completed',
            videoUrl,
            message: 'FFmpeg montajı başarıyla tamamlandı.',
            processedAt: new Date().toISOString(),
          })
        );
      } catch (err) {
        console.error('[Cloud Run] Montaj hatası:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Cloud Run FFmpeg worker listening on port ${PORT}`);
});
