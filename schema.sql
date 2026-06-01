-- Schema for Cloudflare D1 Serverless SQLite Database
-- Project: IT Service Care
-- Created: 2026-06-01

DROP TABLE IF EXISTS tasks;

CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    fullname TEXT NOT NULL,
    department TEXT NOT NULL,
    phone TEXT NOT NULL,
    repair_type TEXT NOT NULL,
    description TEXT NOT NULL,
    reported_date TEXT NOT NULL,
    day_str TEXT NOT NULL,
    image_file TEXT,          -- Stores JSON string {name, size, type, data}
    attached_file TEXT,       -- Stores JSON string {name, size, type, data}
    status TEXT NOT NULL DEFAULT 'Pending',
    admin_name TEXT DEFAULT '',
    admin_remark TEXT DEFAULT '',
    admin_upload_file TEXT    -- Stores JSON string {name, size, type, data}
);

-- Insert Initial Mock Data
INSERT INTO tasks (
    id, username, fullname, department, phone, repair_type, description, reported_date, day_str, status, admin_name, admin_remark
) VALUES (
    'REQ-1001',
    'somchai',
    'สมชาย ใจดี',
    'ฝ่ายขาย (Sales)',
    '081-234-5678',
    'คอมพิวเตอร์ / ฮาร์ดแวร์',
    'หน้าจอคอมพิวเตอร์เปิดไม่ติด ไฟสีส้มกระพริบ แต่เครื่องเสียงดังมีพัดลมหมุน ลองสลับสายหน้าจอกับเพื่อนแล้วไม่หาย รบกวนช่วยเหลือด่วนครับ ต้องเตรียมเสนอราคาให้ลูกค้าบ่ายนี้',
    '2026-06-01',
    'จันทร์',
    'Pending',
    '',
    ''
);

INSERT INTO tasks (
    id, username, fullname, department, phone, repair_type, description, reported_date, day_str, status, admin_name, admin_remark
) VALUES (
    'REQ-1002',
    'wipa',
    'วิภา หอมขจร',
    'บัญชี (Account)',
    '082-345-6789',
    'ระบบเน็ตเวิร์ก / อินเทอร์เน็ต',
    'เครื่องพิมพ์ห้องบัญชีพิมพ์งานช้ามาก และบางครั้งอินเทอร์เน็ตหลุดบ่อย ขึ้นเครื่องหมายตกใจสีเหลืองที่มุมขวา ทำให้ไม่สามารถดึงข้อมูลภาษีออนไลน์ได้ค่ะ',
    '2026-05-31',
    'อาทิตย์',
    'In_Progress',
    'แอดมินบอย',
    'ตรวจสอบสัญญาณ LAN ที่พอร์ตผนังพบว่าหัวต่อสาย LAN หลวม ได้เข้าทำการย้ำหัว LAN ใหม่แล้ว ขณะนี้สัญญาณอินเทอร์เน็ตปกติ กำลังตรวจสอบไดรเวอร์เครื่องพิมพ์ห้องบัญชีต่อครับ'
);

INSERT INTO tasks (
    id, username, fullname, department, phone, repair_type, description, reported_date, day_str, status, admin_name, admin_remark, admin_upload_file
) VALUES (
    'REQ-1003',
    'kitti',
    'กิตติ รักเรียน',
    'ฝ่ายบุคคล (HR)',
    '083-456-7890',
    'โปรแกรมคอมพิวเตอร์ / ซอฟต์แวร์',
    'ไม่สามารถเปิดโปรแกรมคำนวณเงินเดือนพนักงาน (Payroll Pro) ได้ ขึ้นแจ้งเตือน Error Code: 0x80070002 ข้อมูลฐานข้อมูลไม่ตรงกัน รบกวนรีเซ็ตหรือช่วยแก้ไขให้ด้วยครับ',
    '2026-05-29',
    'ศุกร์',
    'Completed',
    'แอดมินบอย',
    'แก้ไขปัญหา Error Code ในโปรแกรม Payroll สำเร็จ โดยทำการเชื่อมต่อเส้นทางของ IP Database Server ใหม่ในเมนู Config และอัปเดตเวอร์ชันโปรแกรมล่าสุดให้เรียบร้อยแล้ว ทดสอบเปิดใช้งานร่วมกับเจ้าหน้าที่ HR ทำงานได้ปกติ 100%',
    '{"name":"payroll_patch_note.pdf","size":43,"type":"text/plain","data":"data:text/plain;base64,UGF0Y2ggTm90ZXM6IERhdGFiYXNlIGNvbm5lY3Rpb24gcGF0aCBmaXhlZC4="}'
);
