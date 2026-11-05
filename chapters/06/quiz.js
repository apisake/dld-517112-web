/* แบบทดสอบท้ายบทที่ 6 — แก้ไข/เพิ่มข้อได้ที่ไฟล์นี้ (answer = ดัชนีของตัวเลือกที่ถูก เริ่มที่ 0) */
window.CH_QUIZ = [
  {
    q: "วงจร AND-OR ในรูปที่ 6.1 (X = AB + CD) ให้เอาต์พุต HIGH เมื่อใด",
    options: ["A และ C เป็น HIGH", "A และ B เป็น HIGH หรือ C และ D เป็น HIGH", "ทุกอินพุตเป็น HIGH เท่านั้น", "อินพุตใดอินพุตหนึ่งเป็น HIGH"],
    answer: 1,
    why: "เอาต์พุต AND-OR เป็น 1 เมื่อพจน์การคูณพจน์ใดพจน์หนึ่งเป็น 1 (ข้อสรุปหัวข้อ 6.1.1)",
  },
  {
    q: "วงจร AND-OR-Invert ของ AB + CD มีนิพจน์ POS ที่เทียบเท่าคือข้อใด",
    options: ["(A + B)(C + D)", "(<span class='ov'>A</span> + <span class='ov'>B</span>)(<span class='ov'>C</span> + <span class='ov'>D</span>)", "<span class='ov'>A</span><span class='ov'>B</span> + <span class='ov'>C</span><span class='ov'>D</span>", "(AB)(CD)"],
    answer: 1,
    why: "complement(AB + CD) = (complement AB)(complement CD) = (<span class='ov'>A</span> + <span class='ov'>B</span>)(<span class='ov'>C</span> + <span class='ov'>D</span>) ด้วย DeMorgan (หัวข้อ 6.1.2)",
  },
  {
    q: "วงจร AND-OR-Invert (AB + CD) ให้เอาต์พุต LOW เมื่อใด",
    options: ["A และ B เป็น HIGH หรือ C และ D เป็น HIGH", "ทุกอินพุตเป็น LOW", "A หรือ C เป็น LOW", "ไม่มีกรณีใด"],
    answer: 0,
    why: "ตารางค่าความจริงเหมือนตารางที่ 6.1 แต่กลับค่าเอาต์พุตทุกแถว",
  },
  {
    q: "ตัวอย่างที่ 6.1 (เตือนเมื่อสารเคมีต่ำ 2 ถังขึ้นไป) ใช้นิพจน์ใด",
    options: ["A + B + C", "ABC", "AB + AC + BC", "A ⊕ B ⊕ C"],
    answer: 2,
    why: "จับคู่ถังให้ครบ 3 คู่ (G1, G2, G3) แล้ว OR กัน — ต่ำ 3 ถังก็เตือนด้วย",
  },
  {
    q: "การสร้าง XOR จากเกทพื้นฐาน (รูปที่ 6.3) ต้องใช้เกทอะไรบ้าง",
    options: ["NOT 2, AND 2, OR 1", "NOT 1, AND 1, OR 2", "NAND 4", "NOT 2, OR 2, AND 1"],
    answer: 0,
    why: "X = A<span class='ov'>B</span> + <span class='ov'>A</span>B ต้องใช้ inverter 2 ตัว AND 2 ตัว และ OR 1 ตัว",
  },
  {
    q: "นิพจน์ XNOR ที่ได้จากการวิเคราะห์ complement ของ XOR คือข้อใด",
    options: ["A<span class='ov'>B</span> + <span class='ov'>A</span>B", "<span class='ov'>A</span><span class='ov'>B</span> + AB", "A + B", "<span class='ov'>A</span>B"],
    answer: 1,
    why: "complement(A<span class='ov'>B</span> + <span class='ov'>A</span>B) = (<span class='ov'>A</span> + B)(A + <span class='ov'>B</span>) = <span class='ov'>A</span><span class='ov'>B</span> + AB (หัวข้อ 6.1.4)",
  },
  {
    q: "วงจรของ X = AB + CDE ต้องใช้เกทใด",
    options: ["AND 2 อินพุต 2 ตัว + OR", "AND 2 อินพุต 1 ตัว, AND 3 อินพุต 1 ตัว, OR 2 อินพุต 1 ตัว", "AND 5 อินพุต 1 ตัว", "OR 3 อินพุต 2 ตัว"],
    answer: 1,
    why: "พจน์ AB ใช้ AND 2 อินพุต พจน์ CDE ใช้ AND 3 อินพุต แล้ว OR 2 อินพุต (รูปที่ 6.5)",
  },
  {
    q: "เหตุใดการแปลง AB(C<span class='ov'>D</span> + EF) เป็น ABC<span class='ov'>D</span> + ABEF จึงดีกว่า",
    options: ["ใช้เกทน้อยกว่าทุกกรณี", "จำนวนชั้นของเกทจากอินพุตถึงเอาต์พุตลดลง ทำให้ propagation delay ลดลง", "ไม่ต้องใช้ inverter", "ได้ผลลัพธ์ต่างกัน"],
    answer: 1,
    why: "รูป SOP มีเกทระหว่างอินพุตถึงเอาต์พุตน้อยชั้นกว่า delay สะสมจึงน้อยลง (รูปที่ 6.6)",
  },
  {
    q: "จากตารางค่าความจริงที่ X = 1 เมื่อ ABC = 011 และ 100 นิพจน์ SOP คือข้อใด",
    options: ["<span class='ov'>A</span>BC + A<span class='ov'>B</span><span class='ov'>C</span>", "A + BC", "<span class='ov'>A</span><span class='ov'>B</span>C + AB<span class='ov'>C</span>", "(A + <span class='ov'>B</span> + <span class='ov'>C</span>)(<span class='ov'>A</span> + B + C)"],
    answer: 0,
    why: "แถวที่ได้ 1 → พจน์การคูณ: 011 → <span class='ov'>A</span>BC, 100 → A<span class='ov'>B</span><span class='ov'>C</span> (ตารางที่ 6.3)",
  },
  {
    q: "วงจรที่ให้ 1 เมื่ออินพุต 4 ตัวเป็น 1 พร้อมกัน 3 ตัว (ตัวอย่างที่ 6.3) มีพจน์การคูณกี่พจน์",
    options: ["3", "4", "6", "16"],
    answer: 1,
    why: "0111, 1011, 1101, 1110 → 4 พจน์ ใช้ AND 4 อินพุต 4 ตัวและ OR 4 อินพุต 1 ตัว",
  },
  {
    q: "ตัวอย่างที่ 6.4 ลดรูปแล้วเหลือวงจรใด",
    options: ["AND 4 อินพุต", "OR 4 อินพุต (A + B + C + D)", "NAND 4 อินพุต", "XOR 4 อินพุต"],
    answer: 1,
    why: "ใช้ DeMorgan แล้วได้ AC + BC + C + A + B + C + D = A + B + C + D",
  },
  {
    q: "ตัวอย่างที่ 6.5 ลดรูปด้วยแผนผังคาร์โนห์ได้ข้อใด",
    options: ["<span class='ov'>B</span><span class='ov'>C</span> + A<span class='ov'>C</span><span class='ov'>D</span>", "A<span class='ov'>B</span> + <span class='ov'>C</span><span class='ov'>D</span>", "<span class='ov'>A</span><span class='ov'>B</span><span class='ov'>C</span>", "A + <span class='ov'>C</span>"],
    answer: 0,
    why: "X = <span class='ov'>B</span><span class='ov'>C</span> + A<span class='ov'>C</span><span class='ov'>D</span> (หัวข้อ 6.1.5)",
  },
  {
    q: "ตัวอย่างที่ 6.6 X = complement ของ A(B + C) เป็น LOW เมื่อใด",
    options: ["A และ B เป็น HIGH หรือ A และ C เป็น HIGH", "B และ C เป็น LOW", "A เป็น LOW", "ทุกอินพุตเป็น LOW"],
    answer: 0,
    why: "X = complement(AB + AC) เป็น LOW เมื่อ AB = 1 หรือ AC = 1",
  },
  {
    q: "เมื่ออินพุตของวงจรคอมไบเนชันเป็นสัญญาณพัลส์ ข้อใดถูกต้อง",
    options: ["ตารางค่าความจริงของวงจรเปลี่ยนไป", "ตารางค่าความจริงคงเดิม หาเอาต์พุตได้ทีละช่วงเวลา", "ต้องใช้แผนผังคาร์โนห์ใหม่", "วงจรต้องมีสัญญาณนาฬิกา"],
    answer: 1,
    why: "ตารางค่าความจริงไม่ขึ้นกับว่าอินพุตเปลี่ยนตามเวลาหรือไม่ — พิจารณาสัญญาณระหว่างทางทีละช่วงเวลา (หัวข้อ 6.2)",
  },
  {
    q: "ในการทำโครงงานกลุ่ม ขั้นแรกที่ มคอ.3 กำหนด (CLO10) คืออะไร",
    options: ["นำเสนอผลงาน", "แบ่งงานเป็นงานย่อยและมอบหมายให้สมาชิก", "เขียน Verilog", "สอบกลางภาค"],
    answer: 1,
    why: "CLO10: แบ่งงานเป็นงานย่อยและมอบหมายงานให้สมาชิกรับผิดชอบเต็มกำลังความสามารถ (สัปดาห์ที่ 7)",
  },
];
