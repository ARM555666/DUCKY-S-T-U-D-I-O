const http = require('http');

const PORT = process.env.PORT || 3000;
const API_KEY = 'ducky_studio_secret_2026';

// 🌐 แก้ไขตรงนี้: เอาลิงก์ API และ Token ที่ได้จากเว็บ JSONbin มาใส่แทนค่าเดิม
const JSONBIN_URL = 'https://api.jsonbin.io/v3/b/YOUR_BIN_ID_HERE'; 
const JSONBIN_KEY = '$2a$10$Ny6hQgYvrhelblOqhSx3meAnlmJe7c.LUBF7Bqex/jHdMm4r5Ie5S'; 

// ฟังก์ชันดึงข้อมูลออนไลน์
async function readDataOnline() {
  try {
    const response = await fetch(`${JSONBIN_URL}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY }
    });
    const result = await response.json();
    return result.record;
  } catch (err) {
    console.error("ดึงข้อมูล API ล้มเหลว:", err);
    return {
      announce: 'ยินดีต้อนรับสู่ Ducky Studio',
      heroTitle: 'พัฒนา Roblox แบบมืออาชีพ',
      heroSubtitle: 'รับสร้างเกม สคริปต์ และระบบครบวงจร',
      services: [],
      updatedAt: new Date().toISOString()
    };
  }
}

// ฟังก์ชันบันทึกข้อมูลออนไลน์
async function saveDataOnline(newData) {
  try {
    await fetch(JSONBIN_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY
      },
      body: JSON.stringify(newData)
    });
  } catch (err) {
    console.error("บันทึกข้อมูล API ล้มเหลว:", err);
  }
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
}

const server = http.createServer(async (req, res) => {

  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // 1. GET ข้อมูลทั้งหมด
  if (req.method === 'GET' && req.url === '/api/content') {
    const data = await readDataOnline();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(data));
  }

  // 2. GET ข้อมูลแยกตาม ID
  if (req.method === 'GET' && req.url.startsWith('/api/services/')) {
    const id = decodeURIComponent(req.url.split('/api/services/')[1]);
    const data = await readDataOnline();
    const services = Array.isArray(data.services) ? data.services : [];
    const service = services.find(item => String(item.num) === String(id));

    if (!service) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'service not found' }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(service));
  }

  // 3. POST ข้อมูลจากหลังบ้านขึ้นไปบันทึก
  if (req.method === 'POST' && req.url === '/api/content') {
    if (req.headers['x-api-key'] !== API_KEY) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'API key ไม่ถูกต้อง' }));
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const incoming = JSON.parse(body);
        const current = await readDataOnline();

        const updated = {
          ...current,
          ...incoming,
          updatedAt: new Date().toISOString()
        };

        await saveDataOnline(updated);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, data: updated }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'ข้อมูลไม่ถูกต้อง' }));
      }
    });
    return;
  }

  // 4. ไม่พบเส้นทาง
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'ไม่พบเส้นทาง' }));
});

module.exports = server;