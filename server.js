const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_KEY = 'ducky_studio_secret_2026';
const DATA_FILE = path.join(__dirname, 'content.json');

const defaultData = {
  announce: 'ยินดีต้อนรับสู่ Ducky Studio',
  heroTitle: 'พัฒนา Roblox แบบมืออาชีพ',
  heroSubtitle: 'รับสร้างเกม สคริปต์ และระบบครบวงจร',
  services: [],
  updatedAt: new Date().toISOString()
};

function createFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(defaultData, null, 2),
      'utf8'
    );
  }
}

function readData() {
  createFile();

  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return defaultData;
  }
}

function saveData(data) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

function setCors(res) {
  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, x-api-key'
  );
}

const server = http.createServer((req, res) => {

  setCors(res);


  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }


  if (
    req.method === 'GET' &&
    req.url === '/api/content'
  ) {

    const data = readData();

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8'
    });

    return res.end(
      JSON.stringify(data)
    );
  }



  if (
    req.method === 'GET' &&
    req.url.startsWith('/api/services/')
  ) {

    const id = decodeURIComponent(
      req.url.split('/api/services/')[1]
    );


    const data = readData();

    const services = Array.isArray(data.services)
      ? data.services
      : [];


    const service = services.find(
      item => String(item.num) === String(id)
    );


    if (!service) {

      res.writeHead(404, {
        'Content-Type':'application/json'
      });

      return res.end(
        JSON.stringify({
          error:'service not found'
        })
      );
    }


    res.writeHead(200, {
      'Content-Type':'application/json'
    });


    return res.end(
      JSON.stringify(service)
    );
  }



  if (
    req.method === 'POST' &&
    req.url === '/api/content'
  ) {


    if (
      req.headers['x-api-key'] !== API_KEY
    ) {

      res.writeHead(401, {
        'Content-Type':'application/json'
      });


      return res.end(
        JSON.stringify({
          error:'API key ไม่ถูกต้อง'
        })
      );
    }



    let body = '';


    req.on(
      'data',
      chunk => {
        body += chunk;
      }
    );


    req.on(
      'end',
      () => {

        try {

          const incoming = JSON.parse(body);

          const current = readData();


          const updated = {
            ...current,
            ...incoming,
            updatedAt:new Date().toISOString()
          };


          saveData(updated);


          res.writeHead(200, {
            'Content-Type':'application/json'
          });


          res.end(
            JSON.stringify({
              ok:true,
              data:updated
            })
          );


        } catch {

          res.writeHead(400, {
            'Content-Type':'application/json'
          });


          res.end(
            JSON.stringify({
              error:'ข้อมูลไม่ถูกต้อง'
            })
          );

        }

      }
    );


    return;
  }



  res.writeHead(404, {
    'Content-Type':'application/json'
  });


  res.end(
    JSON.stringify({
      error:'ไม่พบเส้นทาง'
    })
  );

});


module.exports = server;