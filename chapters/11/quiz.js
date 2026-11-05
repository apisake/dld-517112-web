/* แบบทดสอบท้ายบทที่ 11 — แก้ไข/เพิ่มข้อได้ที่ไฟล์นี้ (answer = ดัชนีของตัวเลือกที่ถูก เริ่มที่ 0)
   ขีดบนให้ใช้ <span class='ov'>X</span> (ไม่ใช้อักขระผสม) */
window.CH_QUIZ = [
  {
    q: "VHDL คืออะไร",
    options: ["logic device ประเภทหนึ่ง", "ภาษาอธิบายฮาร์ดแวร์ที่ใช้โปรแกรมอุปกรณ์ PLD/FPGA", "ภาษาโปรแกรมสำหรับซอฟต์แวร์ทั่วไป", "ย่อมาจาก Very High Density Logic"],
    answer: 1,
    why: "VHDL และ Verilog เป็น HDL ใช้ในขั้น design entry (หัวข้อ 11.3.1)",
  },
  {
    q: "CPLD ย่อมาจากอะไร",
    options: ["Controlled Program Logic Device", "Complex Programmable Logic Driver", "Complex Programmable Logic Device", "Central Processing Logic Device"],
    answer: 2,
    why: "แบบฝึกหัดท้ายบทข้อ 2",
  },
  {
    q: "FPGA ย่อมาจากอะไร",
    options: ["Field Programmable Gate Array", "Field Programmable Generic Array", "Fast Programmable Gate Array", "Flash Process Gate Application"],
    answer: 0,
    why: "แบบฝึกหัดท้ายบทข้อ 3",
  },
  {
    q: "ข้อดีของวงจรตรรกะแบบโปรแกรมได้เมื่อเทียบกับไอซีฟังก์ชันตายตัว คือข้อใด",
    options: ["ใช้พื้นที่บนบอร์ดมากกว่า", "แก้ไขวงจรได้โดยไม่ต้องรื้อสาย และใช้พื้นที่น้อยกว่า", "ไม่ต้องใช้ไฟเลี้ยง", "ทำงานได้เฉพาะวงจรคอมไบเนชัน"],
    answer: 1,
    why: "สรุปท้ายบท: พื้นที่น้อยกว่า แก้ไขง่าย ต้นทุนต่ำกว่า",
  },
  {
    q: "PAL มีโครงสร้างอย่างไร",
    options: ["AND array ตายตัว + OR array โปรแกรมได้", "AND array โปรแกรมได้ + OR array ตายตัว", "ทั้งสอง array โปรแกรมได้", "ไม่มี array"],
    answer: 1,
    why: "PAL = programmable AND + fixed OR (โปรแกรมได้ครั้งเดียว) · PLA โปรแกรมได้ทั้งสอง array",
  },
  {
    q: "GAL ต่างจาก PAL อย่างไร",
    options: ["GAL โปรแกรมซ้ำได้ (reprogrammable) และมี output logic ที่โปรแกรมได้", "GAL ไม่มี AND array", "GAL โปรแกรมได้ครั้งเดียว", "GAL ใหญ่กว่า FPGA"],
    answer: 0,
    why: "หัวข้อ 11.2.1 · รูปที่ 11.2 (ข)",
  },
  {
    q: "ใน PLA เหตุใดจึงใช้พจน์ผลคูณร่วมกันระหว่างหลายเอาต์พุตได้",
    options: ["เพราะ OR array โปรแกรมได้", "เพราะ AND array ตายตัว", "เพราะมีฟลิปฟลอป", "เพราะใช้ LUT"],
    answer: 0,
    why: "ใน PLA พจน์หนึ่งต่อเข้า OR ของหลายเอาต์พุตได้ ส่วน PAL แต่ละเอาต์พุตมีพจน์ของตัวเอง",
  },
  {
    q: "CPLD ประกอบด้วยอะไร",
    options: ["LUT จำนวนมาก", "LAB หลายบล็อก (SPLD หลายตัว) เชื่อมกันผ่าน PIA", "ไมโครโปรเซสเซอร์", "ROM ขนาดใหญ่"],
    answer: 1,
    why: "CPLD = SPLD หลายตัวในชิพเดียว มี LAB 2–64 บล็อก (รูปที่ 11.4)",
  },
  {
    q: "เหตุใดจึงเรียกสถาปัตยกรรม FPGA ว่า fine-grained",
    options: ["บล็อกลอจิกเรียบง่ายแต่มีจำนวนมาก", "บล็อกลอจิกซับซ้อนแต่มีน้อย", "ใช้สายเส้นเล็ก", "ทำงานความถี่ต่ำ"],
    answer: 0,
    why: "ตรงข้ามกับ CPLD ที่เป็น coarse-grained (LAB ซับซ้อน จำนวนน้อย)",
  },
  {
    q: "LUT 3 อินพุตใน FPGA สร้างฟังก์ชัน 3 ตัวแปรได้กี่แบบ",
    options: ["8", "3", "256", "16"],
    answer: 2,
    why: "LUT เก็บตารางค่าความจริง 2³ = 8 บิต → 2<sup>8</sup> = 256 ฟังก์ชัน",
  },
  {
    q: "ขั้นตอนใดของโฟลว์การออกแบบที่ไม่ขึ้นกับชนิดของอุปกรณ์",
    options: ["Design entry และ synthesis (netlist มาตรฐาน)", "Implementation", "Download", "Timing simulation"],
    answer: 0,
    why: "netlist เป็นรูปแบบมาตรฐาน ไม่ขึ้นกับอุปกรณ์ ส่วน implementation จัดวางลงอุปกรณ์จริง",
  },
  {
    q: "ขั้นตอน place and route อยู่ในขั้นใดของโฟลว์การออกแบบ",
    options: ["Functional simulation", "Synthesis", "Implementation", "Design entry"],
    answer: 2,
    why: "Implementation (fitting / place and route) จัดวาง netlist ลงโครงสร้างจริงของอุปกรณ์",
  },
  {
    q: "Functional simulation กับ timing simulation ต่างกันอย่างไร",
    options: ["Functional ตรวจเฉพาะลอจิก ไม่คิดเวลาหน่วง · timing ใช้เวลาหน่วงจริงหลังจัดวาง", "เหมือนกันทุกประการ", "Timing ทำก่อนสังเคราะห์", "Functional ต้องใช้บอร์ดจริง"],
    answer: 0,
    why: "timing simulation เกิดหลัง implementation จึงรู้ propagation delay จริง (หัวข้อ 11.3.5)",
  },
  {
    q: "FPGA แบบ SRAM ที่เป็น volatile ต้องทำอย่างไรเมื่อปิด–เปิดไฟใหม่",
    options: ["ไม่ต้องทำอะไร", "โหลด bitstream ใหม่จากหน่วยความจำ non-volatile", "เปลี่ยนชิพใหม่", "สังเคราะห์วงจรใหม่"],
    answer: 1,
    why: "หัวข้อ 11.3.6: bitstream ต้องเก็บไว้ในหน่วยความจำที่คงข้อมูลได้ แล้วโหลดกลับเมื่อจ่ายไฟ",
  },
  {
    q: "ผลลัพธ์ของขั้นตอน download คือการส่งอะไรลงอุปกรณ์",
    options: ["ซอร์สโค้ด Verilog", "netlist", "bitstream", "testbench"],
    answer: 2,
    why: "bitstream คือข้อมูลการตั้งค่าอุปกรณ์ที่ได้จาก implementation",
  },
];
