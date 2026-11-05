# เว็บสื่อการสอน 517 112 การออกแบบวงจรตรรกะเชิงเลข

เว็บแบบ static (HTML/CSS/JS ล้วน ไม่มีขั้นตอน build) ใช้ มคอ.3 เป็นโครง และใช้เนื้อหาจากเอกสารประกอบการสอน (v7)

## โครงสร้าง

```
web/
├── index.html                 หน้ารายวิชา (ข้อมูลจาก มคอ.3: คำอธิบาย, CLO, แผน 16 สัปดาห์, การประเมิน)
├── assets/
│   ├── css/main.css           ธีมกลาง (สว่าง/มืด) ใช้ทุกหน้า
│   ├── css/slides.css         รูปแบบสไลด์ 16:9
│   ├── js/site.js             helper กลาง, ธีม, ระบบ widget, quiz
│   ├── js/logic.js            วาดสัญลักษณ์เกต, ประเมินค่าเกต, ตารางความจริง (ใช้ซ้ำได้ทุกบท)
│   ├── js/slides.js           ตัวเล่นสไลด์ (ไม่พึ่งไลบรารีภายนอก)
│   └── js/course.js           ข้อมูลรายวิชา/บท/สัปดาห์ — ตั้ง ready: true เมื่อบทใหม่พร้อม
├── tools/build_chapter.py      แปลง source/content_chN.html → chapters/NN/index.html (บทที่ 2 เป็นต้นไป)
├── chapters/01/
│   ├── index.html             เนื้อหาบทที่ 1 (อ่าน/ทบทวน) + ใบงานปฏิบัติการ
│   ├── slides.html            สไลด์บรรยาย 35 หน้า พร้อมบันทึกผู้สอน
│   ├── widgets.js             interactive ของบทที่ 1
│   ├── quiz.js                แบบทดสอบท้ายบท (แก้ไขได้ง่าย)
│   └── img/                   รูปจากเอกสารประกอบการสอน
├── Dockerfile, deploy/nginx.conf   สำหรับ Droplet / Docker
└── .do/app.yaml                    สำหรับ DigitalOcean App Platform (Static Site)
```

## เปิดดูในเครื่อง

```bash
python3 -m http.server 8517 --directory web
```

แล้วเปิด http://localhost:8517 (เปิดไฟล์ `index.html` ตรง ๆ ก็ได้)

## การใช้สไลด์

| ปุ่ม | ผล |
|---|---|
| → / Space / PgDn | ถัดไป (แสดงทีละส่วนถ้ามี) |
| ← / PgUp | ก่อนหน้า |
| F | เต็มจอ |
| N | บันทึกผู้สอน (speaker notes) |
| O | ภาพรวมสไลด์ทั้งหมด |
| T | สลับธีมสว่าง/มืด |
| ? | คีย์ลัดทั้งหมด |

ลิงก์ตรงไปสไลด์ที่ต้องการ: `slides.html#15`

## Interactive ของบทที่ 1

| widget | หัวข้อ | อธิบาย |
|---|---|---|
| `timeline` | 1.1 | ไทม์ไลน์ตารางที่ 1.1 พร้อมแถบยุค และช่วงเวลากว่าจะแพร่หลาย |
| `sampling` | 1.3 | สุ่มค่าอุณหภูมิ (รูปที่ 1.1) → ระดับ → รหัสดิจิทัล ปรับช่วงสุ่ม/จำนวนบิต |
| `noise` | 1.4 | ส่งสัญญาณผ่านหลายช่วง: แอนะล็อกสะสม noise vs ดิจิทัลสร้างใหม่ |
| `logiclevel` | 1.5 | แรงดัน → LOW / ตีความไม่ได้ / HIGH (TTL และ CMOS) + โหมดทายผล |
| `pulse` | 1.6 | T, f, ดิวตี้ไซเคิล, พัลส์บวก/ลบ, rise/fall time (10/50/90%) |
| `timing` | 1.6.1 | ไดอะแกรมเวลารูปที่ 1.10 แก้ไขได้ + เอาต์พุต AND/OR/NOT |
| `gates` | 1.7 | สวิตช์อินพุต NOT/AND/OR 1–4 อินพุต พร้อมตารางความจริง |
| `breadboard` | ปฏิบัติการ | รูที่เชื่อมถึงกันบนแผงทดลอง + การวางไอซี 14 ขา |

ใช้ใน HTML ได้ด้วย `<div data-widget="ชื่อ"></div>` (ทั้งหน้าเนื้อหาและสไลด์)

## เพิ่มบทใหม่ (ตั้งแต่บทที่ 2 ใช้ตัวแปลงอัตโนมัติ)

หน้าเนื้อหาบทที่ 2 เป็นต้นไปสร้างจาก `source/content_chN.html` โดยตรงด้วย `tools/build_chapter.py`
(ตัวอย่าง คำอธิบาย แบบฝึกหัด ตาราง และรูป SVG ในเล่มถูกนำมาครบ วิธีทำของตัวอย่างพับเก็บไว้ให้กดดู)

1. สร้าง `chapters/NN/chapter.json` (ดูตัวอย่างที่ `chapters/02/chapter.json`): สัปดาห์, CLO, กิจกรรม และตำแหน่งที่จะแทรก widget (`"s2-3-3": ["dec2bin"]` = ท้ายหัวข้อ 2.3.3)
2. เขียน `chapters/NN/widgets.js` และ `chapters/NN/quiz.js` (`window.CH_QUIZ = [...]`)
3. รัน `python3 web/tools/build_chapter.py NN` (ต้องมี `beautifulsoup4` และ `lxml`) → ได้ `chapters/NN/index.html`
4. เขียน `chapters/NN/slides.html` (คัดลอกโครงจากบทก่อนหน้า)
5. ตั้ง `ready: true` ให้บทนั้นใน `assets/js/course.js`

> ถ้าแก้เนื้อหาในเล่ม (`source/content_chN.html`) ให้รันข้อ 3 ใหม่ — อย่าแก้ `chapters/NN/index.html` ด้วยมือ เพราะจะถูกเขียนทับ

Helper ที่ใช้ซ้ำได้: `logic.js` (สัญลักษณ์เกต, ตารางความจริง, รูปคลื่น) · `numbers.js` (`DLD.num` แปลงฐาน/2’s complement/Gray, `DLD.ui` ปุ่ม ช่องกรอก แถวบิต)

## Interactive ของบทที่ 2

`bitweights` ค่าน้ำหนักบิต · `dec2bin` หาร/คูณ 2 ทีละขั้น · `binarith` + − × ÷ แสดงวิธีทำ · `complement` 1’s/2’s complement ·
`signed` ตีความ 3 รูปแบบ + วงล้อ 4 บิต · `float` IEEE 754 · `signedadd` บวก/ลบ 2’s complement + overflow ·
`baseconv` ฐาน 2/8/10/16 · `bcd` การบวก BCD · `gray` รหัสเกรย์ + จานเข้ารหัส · `ascii` ข้อความ ⇄ ASCII

## Interactive ของบทที่ 3

`gatewave` ผังเวลาของเกท (แก้รูปคลื่นได้ + โหมดทายเอาต์พุต; ใช้ `data-gate`, `data-compare`) · `gatelab` เกท 7 ชนิด + สัญลักษณ์ 2 แบบ ·
`equiv` NAND ≡ Negative-OR / NOR ≡ Negative-AND · `gateapps` เตือนคาดเข็มขัด / เตือนบุกรุก / 1’s complement / บวกบิต ·
`pinout` การจัดขา 7400–7486 · `partdecoder` ถอดรหัสเบอร์ไอซี · `noisemargin` NM และการเชื่อมต่อ 3.3 V ⇄ 5 V ·
`fanout` · `propdelay` เวลาหน่วงสะสม + กำลังไฟฟ้า CMOS

ส่วนปฏิบัติการของบท (ถ้ามี) เขียนใน `chapters/NN/lab.html` แล้วระบุ `"lab": "lab.html"` ใน chapter.json

## Interactive ของบทที่ 4

`termeval` sum/product term · `lawcheck` พิสูจน์ความเท่ากันด้วยตารางค่าความจริง · `rules12` หลักเกณฑ์ 12 ข้อ ·
`demorgan` ทลายเส้น bar ทีละขั้น · `circuit416` วงจรรูปที่ 4.16 → นิพจน์ · `truthtable` สร้างตารางค่าความจริงจากนิพจน์ (มีโหมดเติมเอง)

`assets/js/boolean.js` (`DLD.bool`) — แยกวิเคราะห์นิพจน์ (AB, A+B, A', ~A, (A+B)', A^B), ประเมินค่า, แสดงผลแบบขีดบน,
สร้างตารางค่าความจริง, ตรวจความเทียบเท่า และใช้ DeMorgan ทีละขั้น — ใช้ต่อได้ในบทที่ 5–6

## Interactive ของบทที่ 5

`algsimp` ลดรูปด้วยพีชคณิตทีละขั้น (ตย. 5.1–5.4) + นับเกท · `stdform` SOP/POS มาตรฐาน · `tt2expr` ตารางค่าความจริง → นิพจน์ ·
`adjacency` cell ที่ติดกัน · `kmap` แผนผังคาร์โนห์ 3/4 ตัวแปร จัดกลุ่มอัตโนมัติทีละกลุ่ม (SOP/POS, don’t care; ใช้ `data-mode`, `data-preset`)

`DLD.bool.minimize(n, ones, dcs)` — หากลุ่ม (prime implicant) ชุดที่เล็กที่สุดแบบ Quine–McCluskey + exact cover ·
`DLD.bool.termOf(pattern, vars, "sop"|"pos", html)` — แปลงกลุ่มเป็นพจน์ (ผลตรงกับตัวอย่างที่ 5.19–5.25 ในเล่ม)

## Interactive ของบทที่ 6

`aoi` AND-OR ⇄ AND-OR-Invert พร้อมตารางที่ 6.1 (`data-layout="side"` วางตารางข้างวงจร ใช้ในสไลด์) ·
`tankalarm` ตย. 6.1 เตือนระดับสารเคมี 3 ถัง · `sopcircuit` วาดวงจร inverter → AND → OR อัตโนมัติจากนิพจน์ SOP
หรือจากตารางค่าความจริง + ปุ่มลดรูปและนับเกท (`data-expr`, `data-tab`) · `waveckt` ผังเวลาพร้อมสัญญาณระหว่างทาง (ตย. 6.6, 6.7)

## Interactive ของบทที่ 7

`adder` half/full-adder (`data-mode="half"|"full"`) · `paradder` parallel adder ทีละขั้น (`data-bits="4"|"8"`) ·
`comparator` 2 บิต (วงจร) / 4 บิต (A > B, A = B, A < B) · `decoder` 1-of-16 หรือ BCD (`data-mode="bcd"`), active-HIGH/LOW ·
`seg7` BCD-to-7-segment · `encoder` แป้นกด + decimal-to-BCD (OR / priority) · `graycode` binary ⇄ Gray ·
`mux` 1-of-4 MUX หรือ DEMUX (`data-mode="demux"`) — `paradder` และ `mux` รองรับ `data-layout="side"` สำหรับสไลด์

## Interactive ของบทที่ 8

`srlatch` S-R latch แบบ NOR/NAND ต่อไขว้ พร้อมผังเวลาจากการกด · `ffwave` ผังเวลาแลทช์/ฟลิปฟลอป คลิกแก้รูปคลื่นอินพุตได้
(`data-type="gsr"|"dlatch"|"cmp"|"srff"|"dff"|"jkff"|"jkpc"` — cmp เทียบ D latch กับ D FF, jkpc = ตัวอย่างที่ 8.2) ·
`pregister` รีจิสเตอร์ D FF 4 บิต · `freqdiv` วงจรหารความถี่ / วงจรนับ (`data-mode="count"`, `data-n`)

## ตัวเลือกเพิ่มเติมใน chapter.json

| คีย์ | ความหมาย |
|---|---|
| `import_css` | `true` = นำ `<style>` เฉพาะบทในเล่มมาแปลงเป็น `chapters/NN/chapter.css` (scope ใต้ `.book`, แปลง mm/pt เป็น px, ตัดกฎสำหรับพิมพ์) |
| `css_skip` | รายการ selector ที่ไม่ต้องนำมา |
| `scroll_wrap` | selector ของบล็อกกว้างที่ให้เลื่อนแนวนอนได้บนมือถือ เช่น `[".t45"]` |

สคริปต์ในเล่ม (เช่น ตารางที่ 4.5 ที่สร้างด้วย JS) ถูกนำมาด้วยอัตโนมัติ

## Deploy ขึ้น DigitalOcean

> ขั้นตอนละเอียดและรายการตรวจก่อน deploy อยู่ใน **[DEPLOY.md](DEPLOY.md)** · ตรวจลิงก์ทั้งเว็บ: `python3 tools/check_links.py`

**ทางเลือก A — App Platform (Static Site, แนะนำ):**
1. สร้าง GitHub repo ใหม่ แล้ว push เนื้อหาในโฟลเดอร์ `web/` เป็น root ของ repo
2. แก้ `github.repo` ใน `.do/app.yaml`
3. `doctl apps create --spec .do/app.yaml` หรือสร้างผ่านหน้าเว็บ DO → Create App → เลือก repo → ชนิด Static Site
4. ทุกครั้งที่ push ไป `main` จะ deploy อัตโนมัติ

**ทางเลือก B — Droplet / Docker:**
```bash
docker build -t dld-web .
docker run -d --restart unless-stopped -p 80:8080 dld-web
```
(ตรวจสุขภาพที่ `/healthz`)

> หมายเหตุ: ฟอนต์โหลดจาก Google Fonts หากห้องเรียนไม่มีอินเทอร์เน็ต หน้าเว็บยังใช้งานได้ด้วยฟอนต์สำรองของระบบ

## Interactive ของบทที่ 9

`ripple` วงจรนับแบบ asynchronous 2–4 บิต ปรับ propagation delay ได้ และ MOD10/MOD12 แบบ partial decoding (`data-n`, `data-mod`, `data-delay`) ·
`synccount` วงจรนับแบบ synchronous (`data-mode="bin"|"bcd"|"updown"`) · `cdesign` ออกแบบวงจรนับด้วย J-K FF 6 ขั้นตอน
จากลำดับที่พิมพ์ (`data-seq`) — หา SOP ที่เล็กที่สุดเอง (เสมอกันเลือกแบบไม่ complement ให้ตรงกับเล่ม) · `shiftreg` SISO/SIPO/PISO/PIPO

## Interactive ของบทที่ 10

`ffchar` ตารางคุณลักษณะ ⇄ excitation ของ D/T/J-K · `fsmsim` จำลองเครื่องสถานะ วาดผังสถานะ ตารางสถานะ และผังเวลา
(`data-machine="ex1"|"ex2"|"moore101"|"mealy101"|"traffic"|"johnson"`, `data-layout="side"` สำหรับสไลด์ · เลือกสถานะเริ่มต้นเป็นสถานะที่ไม่ใช้ได้) ·
`statered` ลดสถานะด้วยการจับคู่แถว (ตัวอย่างที่ 10.3, แบบฝึกหัดข้อ 4) · `fmax` เส้นทางวิกฤตและ f<sub>max</sub> (ตัวอย่างที่ 10.7)

## Interactive ของบทที่ 11

`pla` AND/OR array ที่โปรแกรมได้ (PAL ⇄ PLA, preset full adder) · `lut` บล็อกลอจิก FPGA: LUT 3 อินพุต + D FF (พิมพ์นิพจน์เพื่อเติม LUT) ·
`flow` โฟลว์การออกแบบ 6 ขั้นตอนของวงจร majority (มีปุ่มใส่บั๊กให้ functional simulation จับ)

## Interactive ของบทที่ 12

`vlive` เขียน Verilog แล้วเห็นผลทันที — ตัวจำลองขนาดเล็ก (`DLD.verilog`) รองรับ `assign`, gate primitive, เวกเตอร์, ตัวดำเนินการ
~ & | ^ + - << >> == ?: {} และ bit/part-select (`data-preset="ops"|"fa_dataflow"|"fa_struct"…`, `data-tb="1"` เพิ่มปุ่มรัน testbench แบบโปรแกรมที่ 12.17) ·
`latchdemo` latch ที่เกิดโดยไม่ตั้งใจ · `nbsim` non-blocking กับ blocking · `vseq` จำลองโค้ดวงจรเชิงลำดับทีละขอบนาฬิกาพร้อมไฮไลต์บรรทัด
(`data-preset="counter4"|"shift4"|"det101"`) · โค้ดในหน้าบทเรียนขยายเป็น 13.5px ใน `book.css` (ต้นฉบับเป็นขนาดพิมพ์)

## รูป SVG ในสไลด์ (บทที่ 9 เป็นต้นไป)

บทที่รูปในเล่มเป็น SVG ฝังในหน้า (ไม่มีไฟล์ภาพ) ให้เขียนในสไลด์ว่า
`<div class="figbox" data-fig="9.6" data-i="0" style="height:220px"></div>` แล้วรัน
`python3 web/tools/embed_figs.py 9` (หลัง build หน้าบทเรียน) — สคริปต์ใส่ SVG ของรูปนั้นลงใน div (รันซ้ำได้)

## ขีดบน (overline)

อย่าใช้อักขระผสม (เช่น `B̄`, `PRE̅`) — ฟอนต์วางขีดเยื้อง ให้ใช้ `<span class="ov">B</span>` ใน HTML/แบบทดสอบ
และใน SVG ของ widget บทที่ 9 ใช้ `{B}` ในฟังก์ชัน `txt()`

