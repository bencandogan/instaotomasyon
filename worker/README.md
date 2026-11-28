# Pinterest Benzer Video Worker

Pinterest pin sayfasının **altında** gösterilen benzer videoları (`v3RelatedPinsForPinSeoQuery`) gerçek Chrome/Chromium ile toplayan küçük HTTP servisi.

> Pinterest, datacenter IP'lerine "giriş duvarı" gösterip bu akışı **boş** döndürüyor. Bu yüzden worker, Pinterest'in kısıtlamadığı bir lokasyondaki (ör. Türkiye) küçük bir VPS'te çalıştırılır ve ana site oradan çeker.

## Gereksinimler

- Node.js 20+
- Chromium / Google Chrome (`apt-get install -y chromium`)
- ~1 GB RAM (eşzamanlılık 1-2 için yeterli)

## Kurulum

```bash
mkdir -p /opt/pinterest-worker
cd /opt/pinterest-worker
# bu klasördeki 3 dosyayı kopyalayın: pinterest-related-worker.cjs, package.json, pinterest-worker.service

npm install --omit=dev
sudo apt-get update && sudo apt-get install -y chromium

# .env
cat > /opt/pinterest-worker/.env <<'EOF'
PORT=3006
WORKER_SECRET=uzun-rastgele-bir-anahtar
PINTEREST_BROWSER_CONCURRENCY=2
# Chrome farklı yoldaysa:
# PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
EOF

# Test (gerçek bir pin ile)
node pinterest-related-worker.cjs --self-test 1083256516653451643
```

`--self-test` çıktısında `self-test sonuc: N video` görürsen **bu sunucunun IP'si Pinterest tarafından kısıtlanmıyor** demektir.

## systemd servisi

```bash
cp /opt/pinterest-worker/pinterest-worker.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now pinterest-worker
systemctl status pinterest-worker --no-pager
```

## API

### `GET /health`

```json
{ "ok": true, "service": "pinterest-related-worker", "chrome": true, "chromePath": "/usr/bin/chromium", "concurrency": 2 }
```

### `POST /fetch-related`

```bash
curl -X POST http://127.0.0.1:3006/fetch-related \
  -H "content-type: application/json" \
  -H "x-worker-secret: uzun-rastgele-bir-anahtar" \
  -d '{"pinId":"1083256516653451643","count":250,"maxVideos":60,"seedTitle":"Deniz manzarası"}'
```

```json
{ "ok": true, "pins": [ { "id": "pin-vid-...", "video_url": "https://v1.pinimg.com/...mp4", ... } ], "elapsedMs": 5123 }
```

Hata durumunda `500` + `{ "ok": false, "error": "..." }` döner (ör. Pinterest bu IP'ye akış vermiyorsa).

## Ana sitede kullanım

Ana sunucudaki `.env.local` dosyasına:

```
PINTEREST_WORKER_URL=http://<worker-ip>:3006
PINTEREST_WORKER_SECRET=uzun-rastgele-bir-anahtar
```

Bu tanımlıysa ana site benzer videoları **önce worker'dan** ister; worker yoksa/başarısızsa yerel Chrome'a düşer.

## Güvenlik

- `WORKER_SECRET` mutlaka tanımlanmalı (tanımlı değilse endpoint kimlik doğrulaması yapmaz).
- Portu herkese açmak yerine yalnızca ana sitenin IP'sine izin verin:
  ```bash
  ufw allow from <ana-site-ip> to any port 3006 proto tcp
  ufw deny 3006/tcp
  ```
- Trafik HTTPS değildir; hassas veri göndermeyin (yalnızca pin ID ve video URL'leri taşınır).
