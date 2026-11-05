/* แบบทดสอบท้ายบทที่ 4 — แก้ไข/เพิ่มข้อได้ที่ไฟล์นี้ (answer = ดัชนีของตัวเลือกที่ถูก เริ่มที่ 0) */
window.CH_QUIZ = [
  {
    q: "ผู้ใดนำพีชคณิตบูลีนมาประยุกต์ใช้วิเคราะห์และออกแบบวงจรลอจิกเป็นคนแรก (ค.ศ. 1938)",
    options: ["George Boole", "Augustus DeMorgan", "Claude Shannon", "John von Neumann"],
    answer: 2,
    why: "จอร์จ บูล เสนอพีชคณิตเชิงตรรกในปี 1854 ส่วนคล็อด แชนนอน นำมาใช้กับวงจรรีเลย์และสวิตช์ในปี 1938 (หัวข้อ 4.1)",
  },
  {
    q: "ข้อใดเป็น “literal” ทั้งหมด",
    options: ["A, <span class='ov'>B</span>, C", "AB, A + B", "A + <span class='ov'>B</span>", "<span class='ov'>AB</span>"],
    answer: 0,
    why: "literal คือตัวแปรหรือ complement ของตัวแปร (หัวข้อ 4.2)",
  },
  {
    q: "sum term A + <span class='ov'>B</span> + C + <span class='ov'>D</span> มีค่าเป็น 0 เมื่อใด",
    options: ["A=0, B=0, C=0, D=0", "A=0, B=1, C=0, D=1", "A=1, B=0, C=1, D=0", "A=1, B=1, C=1, D=1"],
    answer: 1,
    why: "sum term เป็น 0 เมื่อทุก literal เป็น 0: A=0, <span class='ov'>B</span>=0 (B=1), C=0, <span class='ov'>D</span>=0 (D=1) (ตัวอย่างที่ 4.1)",
  },
  {
    q: "product term A<span class='ov'>B</span>C<span class='ov'>D</span> มีค่าเป็น 1 เมื่อใด",
    options: ["A=1, B=1, C=1, D=1", "A=1, B=0, C=1, D=0", "A=0, B=1, C=0, D=1", "A=0, B=0, C=0, D=0"],
    answer: 1,
    why: "product term เป็น 1 เมื่อทุก literal เป็น 1: A=1, <span class='ov'>B</span>=1 (B=0), C=1, <span class='ov'>D</span>=1 (D=0) (ตัวอย่างที่ 4.2)",
  },
  {
    q: "A(B + C) = AB + AC เป็นกฎใด",
    options: ["กฎการสลับที่", "กฎการเปลี่ยนกลุ่ม", "กฎการกระจาย", "ทฤษฎีบทของ DeMorgan"],
    answer: 2,
    why: "กฎการกระจาย (สมการที่ 4.5) และในทางกลับกันคือการแยกแฟกเตอร์",
  },
  {
    q: "A + 1 มีค่าเท่าใด",
    options: ["A", "<span class='ov'>A</span>", "0", "1"],
    answer: 3,
    why: "หลักเกณฑ์ข้อที่ 2: ตัวแปรใด ๆ OR กับ 1 ได้ 1 เสมอ",
  },
  {
    q: "A · <span class='ov'>A</span> มีค่าเท่าใด",
    options: ["0", "1", "A", "<span class='ov'>A</span>"],
    answer: 0,
    why: "หลักเกณฑ์ข้อที่ 8: A หรือ <span class='ov'>A</span> ต้องมีตัวหนึ่งเป็น 0 เสมอ",
  },
  {
    q: "A + AB ลดรูปได้เป็นข้อใด",
    options: ["AB", "A + B", "A", "B"],
    answer: 2,
    why: "หลักเกณฑ์ข้อที่ 10: A + AB = A(1 + B) = A · 1 = A",
  },
  {
    q: "A + <span class='ov'>A</span>B ลดรูปได้เป็นข้อใด",
    options: ["A", "B", "A + B", "AB"],
    answer: 2,
    why: "หลักเกณฑ์ข้อที่ 11: A + <span class='ov'>A</span>B = A + B (ตารางที่ 4.3)",
  },
  {
    q: "(A + B)(A + C) เท่ากับข้อใด",
    options: ["A + BC", "AB + AC", "A + B + C", "ABC"],
    answer: 0,
    why: "หลักเกณฑ์ข้อที่ 12 (ตารางที่ 4.4)",
  },
  {
    q: "ตามทฤษฎีบทของ DeMorgan complement ของ XYZ เท่ากับข้อใด",
    options: ["<span class='ov'>X</span><span class='ov'>Y</span><span class='ov'>Z</span>", "<span class='ov'>X</span> + <span class='ov'>Y</span> + <span class='ov'>Z</span>", "X + Y + Z", "complement ของ (X + Y + Z)"],
    answer: 1,
    why: "complement ของผลคูณ = ผลบวกของ complement (ตัวอย่างที่ 4.3)",
  },
  {
    q: "complement ของ (W + X + Y + Z) เท่ากับข้อใด",
    options: ["<span class='ov'>W</span> + <span class='ov'>X</span> + <span class='ov'>Y</span> + <span class='ov'>Z</span>", "<span class='ov'>W</span><span class='ov'>X</span><span class='ov'>Y</span><span class='ov'>Z</span>", "WXYZ", "complement ของ WXYZ"],
    answer: 1,
    why: "complement ของผลบวก = ผลคูณของ complement (ตัวอย่างที่ 4.4)",
  },
  {
    q: "นิพจน์ของ XNOR ที่ได้จากการทำ complement นิพจน์ XOR (A<span class='ov'>B</span> + <span class='ov'>A</span>B) ด้วย DeMorgan คือข้อใด",
    options: ["A<span class='ov'>B</span> + <span class='ov'>A</span>B", "<span class='ov'>A</span><span class='ov'>B</span> + AB", "A + B", "<span class='ov'>A</span><span class='ov'>B</span>"],
    answer: 1,
    why: "complement(A<span class='ov'>B</span> + <span class='ov'>A</span>B) = (<span class='ov'>A</span> + B)(A + <span class='ov'>B</span>) = <span class='ov'>A</span><span class='ov'>B</span> + AB (ตัวอย่างที่ 4.7)",
  },
  {
    q: "วงจรในรูปที่ 4.16 มีนิพจน์ A(B + CD) จะให้เอาต์พุตเป็น 1 กี่กรณีจาก 16 กรณี",
    options: ["3", "4", "5", "8"],
    answer: 2,
    why: "A=1,B=1 (4 กรณี) และ A=1,C=1,D=1 (2 กรณี) ซ้ำกันที่ 1111 → 4 + 2 − 1 = 5 (ตารางที่ 4.5)",
  },
  {
    q: "วงจรที่มี 4 ตัวแปรอินพุตต้องมีตารางค่าความจริงกี่แถว",
    options: ["4", "8", "16", "32"],
    answer: 2,
    why: "2⁴ = 16 กรณี (หัวข้อ 4.5.2)",
  },
];
