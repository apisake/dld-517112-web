/* แบบทดสอบท้ายบทที่ 8 — แก้ไข/เพิ่มข้อได้ที่ไฟล์นี้ (answer = ดัชนีของตัวเลือกที่ถูก เริ่มที่ 0) */
window.CH_QUIZ = [
  {
    q: "แลทช์เป็นอุปกรณ์ประเภทใด",
    options: ["monostable", "bistable — มี 2 สถานะเสถียรและเก็บข้อมูลชั่วคราวได้", "astable", "วงจรคอมไบเนชัน"],
    answer: 1,
    why: "แลทช์เป็น bistable multivibrator ใช้การป้อนกลับคงสถานะไว้ (หัวข้อ 8.1)",
  },
  {
    q: "S-R latch แบบอินพุต active-HIGH สร้างจากเกทใด",
    options: ["NAND 2 ตัวต่อไขว้", "NOR 2 ตัวต่อไขว้", "AND กับ OR", "XOR 2 ตัว"],
    answer: 1,
    why: "รูปที่ 8.1 (ก) ใช้ NOR ส่วนแบบ active-LOW (ข) ใช้ NAND",
  },
  {
    q: "S-R latch แบบ active-HIGH เมื่อ S = 0, R = 0 เอาต์พุตเป็นอย่างไร",
    options: ["Q = 1", "Q = 0", "คงสภาวะเดิม", "invalid"],
    answer: 2,
    why: "ไม่มีอินพุตใด active จึงคงสภาวะปัจจุบัน (ตารางที่ 8.1)",
  },
  {
    q: "<span class='ov'>S</span>-<span class='ov'>R</span> latch แบบ active-LOW (NAND) สภาวะใดเป็น invalid",
    options: ["<span class='ov'>S</span> = 1, <span class='ov'>R</span> = 1", "<span class='ov'>S</span> = 0, <span class='ov'>R</span> = 0", "<span class='ov'>S</span> = 0, <span class='ov'>R</span> = 1", "<span class='ov'>S</span> = 1, <span class='ov'>R</span> = 0"],
    answer: 1,
    why: "เมื่อ <span class='ov'>S</span> และ <span class='ov'>R</span> active (เป็น 0) พร้อมกัน Q = <span class='ov'>Q</span> = 1 ซึ่งผิดนิยาม (ตารางที่ 8.2)",
  },
  {
    q: "ข้อดีของ gated D latch เมื่อเทียบกับ gated S-R latch คือข้อใด",
    options: ["เร็วกว่า", "ไม่มีสภาวะ invalid เพราะ inverter ทำให้ S และ R ไม่เคยเท่ากัน", "ไม่ต้องมีขา EN", "เก็บข้อมูลได้ 2 บิต"],
    answer: 1,
    why: "D latch ป้อน D ไปที่ S และ <span class='ov'>D</span> ไปที่ R (หัวข้อ 8.1.3)",
  },
  {
    q: "gated D latch เมื่อ EN = 1 เอาต์พุต Q เป็นอย่างไร",
    options: ["คงค่าเดิม", "เปลี่ยนตาม D ตลอดช่วงที่ EN = 1", "เปลี่ยนเฉพาะที่ขอบขาขึ้น", "เป็น 0 เสมอ"],
    answer: 1,
    why: "แลทช์ทำงานตามระดับ (level-sensitive) — EN = 1 เอาต์พุตตามอินพุต",
  },
  {
    q: "ความแตกต่างสำคัญระหว่างแลทช์กับฟลิปฟลอปคือข้อใด",
    options: ["ฟลิปฟลอปเปลี่ยนสถานะเฉพาะที่ขอบของสัญญาณนาฬิกา แลทช์ทำงานตามระดับของ EN", "แลทช์ใช้นาฬิกา ฟลิปฟลอปไม่ใช้", "ฟลิปฟลอปไม่มีหน่วยความจำ", "ไม่ต่างกัน"],
    answer: 0,
    why: "ฟลิปฟลอปเป็น synchronous bistable ที่เปลี่ยนที่ positive/negative edge (หัวข้อ 8.2)",
  },
  {
    q: "สามเหลี่ยมเล็กที่ขา C ในสัญลักษณ์ฟลิปฟลอปเรียกว่าอะไร",
    options: ["inverter", "dynamic input indicator (บอกว่าเป็นแบบ edge-triggered)", "bubble", "buffer"],
    answer: 1,
    why: "ถ้ามี bubble หน้าสามเหลี่ยมด้วยเป็นแบบ negative edge-triggered (รูปที่ 8.5)",
  },
  {
    q: "positive edge-triggered D flip-flop ที่ D = 1 เมื่อเกิดขอบขาขึ้นของนาฬิกา Q เป็นเท่าใด",
    options: ["0", "1", "คงเดิม", "toggle"],
    answer: 1,
    why: "D flip-flop เก็บค่า D ณ ขอบขาขึ้น (ตารางที่ 8.4)",
  },
  {
    q: "D flip-flop สร้างจาก S-R flip-flop ได้อย่างไร",
    options: ["เพิ่ม inverter 1 ตัวระหว่าง S และ R", "เพิ่ม AND gate", "ต่อ Q กลับไปที่ S", "ใช้ S-R flip-flop 2 ตัว"],
    answer: 0,
    why: "D ต่อที่ S และผ่าน inverter ไป R (รูปที่ 8.8)",
  },
  {
    q: "J-K flip-flop เมื่อ J = 1, K = 1 และเกิดขอบนาฬิกาที่ทำงาน จะเกิดอะไรขึ้น",
    options: ["invalid", "SET", "toggle (กลับค่า)", "RESET"],
    answer: 2,
    why: "J-K flip-flop ไม่มีสภาวะ invalid กรณี J = K = 1 จะ toggle (ตารางที่ 8.5)",
  },
  {
    q: "ขา <span class='ov'>PRE</span> และ <span class='ov'>CLR</span> เป็นอินพุตประเภทใด",
    options: ["synchronous — ทำงานที่ขอบนาฬิกา", "asynchronous — ทำงานทันทีโดยไม่ขึ้นกับนาฬิกา", "ขานาฬิกาสำรอง", "ขาจ่ายไฟ"],
    answer: 1,
    why: "<span class='ov'>PRE</span> = 0 → Q = 1 และ <span class='ov'>CLR</span> = 0 → Q = 0 ทันที ไม่สนใจ J, K, CLK (หัวข้อ 8.2.5)",
  },
  {
    q: "ในตัวอย่างที่ 8.2 ช่วงที่ <span class='ov'>CLR</span> = 0 (นาฬิกาลูกที่ 8–9) Q เป็นเท่าใด",
    options: ["1", "0", "toggle", "ตาม J"],
    answer: 1,
    why: "<span class='ov'>CLR</span> เป็น LOW บังคับให้ RESET (Q = 0) โดยไม่สนใจ J = K = 1",
  },
  {
    q: "ต่อ J-K flip-flop แบบ toggle 3 ตัว ป้อนนาฬิกา 8 kHz เอาต์พุตตัวสุดท้ายมีความถี่เท่าใด",
    options: ["4 kHz", "2 kHz", "1 kHz", "24 kHz"],
    answer: 2,
    why: "หารด้วย 2³ = 8 → 8 kHz / 8 = 1 kHz (ตัวอย่างที่ 8.3)",
  },
  {
    q: "วงจรนับไบนารี 2 บิตในรูปที่ 8.17 (Q_B Q_A) ให้ลำดับใด",
    options: ["00 → 01 → 10 → 11 → 00 …", "00 → 11 → 10 → 01 …", "00 → 01 → 11 → 10 …", "00 → 10 → 00 …"],
    answer: 0,
    why: "Q_A toggle ทุกขอบขาลงของนาฬิกา และ Q_B toggle เมื่อ Q_A เปลี่ยนจาก 1 เป็น 0 → นับ 0–3",
  },
  {
    q: "วงจรเก็บข้อมูลแบบขนาน 4 บิต (รูปที่ 8.14) ใช้อุปกรณ์ใด",
    options: ["D flip-flop 4 ตัวที่ใช้สัญญาณนาฬิการ่วมกัน", "J-K flip-flop ต่อแบบ toggle", "S-R latch 2 ตัว", "decoder 4 บิต"],
    answer: 0,
    why: "ข้อมูลแต่ละบิตเข้าขา D ของฟลิปฟลอปแต่ละตัว และถูกเก็บพร้อมกันที่ขอบนาฬิกา",
  },
];
