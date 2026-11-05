# คู่มือ Deploy เว็บรายวิชา 517 112 ขึ้น DigitalOcean

เว็บนี้เป็นไฟล์ static ล้วน (HTML/CSS/JS + รูป) ไม่มีฐานข้อมูลและไม่มีขั้นตอน build ตอนรันจริง
ขนาดรวมประมาณ 27 MB (รูปประมาณ 23 MB · ทุกหน้าโหลดรูปแบบ lazy)

---

## 0. ตรวจก่อน deploy ทุกครั้ง

```bash
cd web
python3 tools/check_links.py          # ต้องได้ ✓ ไม่พบลิงก์เสีย
```

ถ้าแก้เนื้อหาจาก `source/content_chN.html` ให้สร้างหน้าใหม่ก่อน

```bash
python3 tools/build_chapter.py N      # สร้าง chapters/NN/index.html ใหม่
python3 tools/embed_figs.py N         # เฉพาะบทที่ 9–12: เติมรูป SVG ในสไลด์ใหม่
```

ทดสอบแบบเดียวกับเซิร์ฟเวอร์จริงด้วย Docker (ถ้ามี)

```bash
docker build -t dld-web .
docker run --rm -p 8080:8080 dld-web  # เปิด http://localhost:8080
```

---

## ทางเลือก A — App Platform แบบ Static Site (แนะนำ)

DigitalOcean จัดการ HTTPS, CDN และ deploy อัตโนมัติเมื่อ push ไม่ต้องดูแลเซิร์ฟเวอร์
(ตรวจราคาและโควตาแบนด์วิดท์ปัจจุบันของ Static Site ที่หน้า Pricing ของ DigitalOcean)

1. **สร้าง Git repo จากโฟลเดอร์ `web/`** (โฟลเดอร์นี้เป็น root ของ repo)
   ```bash
   cd web
   git init -b main
   git add .
   git commit -m "517 112 course site: chapters 1–12"
   ```
2. **สร้าง repo บน GitHub** (แนะนำ private) แล้ว push
   ```bash
   git remote add origin git@github.com:<บัญชี>/dld-517112-web.git
   git push -u origin main
   ```
3. **แก้ `.do/app.yaml`** บรรทัด `repo: YOUR_GITHUB_USER/dld-517112-web` ให้เป็น repo จริง แล้ว commit/push
4. **สร้างแอป** เลือกอย่างใดอย่างหนึ่ง
   - หน้าเว็บ DigitalOcean → Apps → Create App → เชื่อม GitHub → เลือก repo → ระบบจะอ่าน `.do/app.yaml` (หรือเลือกชนิด *Static Site*, Output directory `/`)
   - หรือใช้ `doctl`: `doctl apps create --spec .do/app.yaml`
5. **โดเมน** (ถ้ามี): Settings → Domains → Add Domain แล้วตั้ง CNAME ตามที่ระบบบอก HTTPS ออกให้อัตโนมัติ
6. หลังจากนี้ทุกครั้งที่ `git push` ไป `main` ระบบจะ deploy ใหม่อัตโนมัติ

หมายเหตุ
- หน้า 404 ใช้ `404.html` (ตั้งไว้ใน `error_document`)
- Static Site ของ App Platform เผยแพร่ทุกไฟล์ใน repo รวมถึง `README.md` และ `tools/` (ไม่มีข้อมูลลับ แต่ถ้าไม่ต้องการให้เห็น ให้ใช้ทางเลือก B)
- ส่วนหัวความปลอดภัยใน `deploy/nginx.conf` ใช้เฉพาะทางเลือก B — App Platform ตั้ง HTTPS ให้เอง

---

## ทางเลือก B — Droplet + Docker

เหมาะเมื่อต้องการควบคุมเซิร์ฟเวอร์เอง หรือรวมกับบริการอื่นของภาควิชา

```bash
# บน Droplet (Ubuntu) ที่ติดตั้ง Docker แล้ว
git clone git@github.com:<บัญชี>/dld-517112-web.git && cd dld-517112-web
docker build -t dld-web .
docker run -d --name dld-web --restart unless-stopped -p 127.0.0.1:8080:8080 dld-web
curl -s http://127.0.0.1:8080/healthz      # ต้องได้ ok
```

จากนั้นตั้ง reverse proxy ที่มี HTTPS (เช่น Caddy หรือ nginx + certbot) ชี้ไปที่ `127.0.0.1:8080`
อัปเดตเนื้อหา: `git pull && docker build -t dld-web . && docker rm -f dld-web && docker run …` (คำสั่งเดิม)

สิ่งที่คอนเทนเนอร์ตั้งไว้แล้ว (ทดสอบแล้ว)
- gzip สำหรับ HTML/CSS/JS/SVG · HTML `no-cache` · CSS/JS แคช 5 นาที · รูปแคช 7 วัน
- `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` ทุกไฟล์
- `/healthz` สำหรับตรวจสุขภาพ · `404.html` · ไม่เผยแพร่ `.md`, `.py`, ไฟล์ที่ขึ้นต้นด้วยจุด (`.dockerignore` ตัด `tools/` และ README ออกจาก image)

---

## ข้อควรรู้

- **ฟอนต์** โหลดจาก Google Fonts เป็นทรัพยากรภายนอกเพียงอย่างเดียว ถ้าไม่มีอินเทอร์เน็ตจะใช้ฟอนต์ของระบบแทน
- **CSS/JS ไม่มี hash ในชื่อไฟล์** — หลัง deploy ผู้เรียนอาจเห็นของเก่าได้ไม่เกิน 5 นาที (ทางเลือก B) หรือตามแคช CDN (ทางเลือก A)
- **สไลด์** ย่อเนื้อหาอัตโนมัติ (`autoFit` ใน `assets/js/slides.js`) ถ้าเนื้อหาสูงเกินกรอบ 1280×720
- **รูปขนาดใหญ่** บางไฟล์เกิน 1 MB (บทที่ 7–8, 11) ถ้าต้องการลดขนาดภายหลัง ทำได้โดยแปลงเป็น WebP และแก้ตัวแปลง `tools/build_chapter.py` ให้อ้างชื่อไฟล์ใหม่
