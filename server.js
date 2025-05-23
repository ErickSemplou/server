const express = require('express');
const path = require('path');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Дані лічильників у пам'яті (можна замінити на базу)
let visitorCount = 0;
let totalClicks = 0;
const petitions = [
  { id: "kinash", name: "Роман Кінаш 🔥🔥🔥", url: "https://petition.president.gov.ua/petition/245246", clicks: 0 },
  { id: "lystopad", name: "Антон Листопад", url: "https://petition.president.gov.ua/petition/245654", clicks: 0 },
  { id: "klekach", name: "Василь Клекач", url: "https://petition.president.gov.ua/petition/244660", clicks: 0 },
  { id: "hned", name: "Олег Гнед", url: "https://petition.president.gov.ua/petition/244852", clicks: 0 },
  { id: "buzykov", name: "Юрій Бузіков 🔥🔥🔥", url: "https://petition.president.gov.ua/petition/244036", clicks: 0 },
  { id: "tanasyuk", name: "Богдан Танасюк 🔥🔥🔥", url: "https://petition.president.gov.ua/petition/243292", clicks: 0 },
  { id: "valko", name: "Руслан Валько 🔥🔥🔥", url: "https://petition.president.gov.ua/petition/244108", clicks: 0 },
  { id: "chmut", name: "Юрій Чмут 🔥🔥🔥", url: "https://petition.president.gov.ua/petition/243630", clicks: 0 },
];

// Щоденне скидання лічильників о 00:00
cron.schedule('0 0 * * *', () => {
  visitorCount = 0;
  totalClicks = 0;
  petitions.forEach(p => p.clicks = 0);
  console.log("Лічильники скинуті опівночі");
});

// Middleware для обробки JSON
app.use(express.json());

// Віддаємо статичний HTML + JS
app.use(express.static(path.join(__dirname, 'public')));

// API — отримати дані лічильників (для фронтенда)
app.get('/api/data', (req, res) => {
  res.json({
    visitorCount,
    totalClicks,
    petitions: petitions.map(({id, clicks}) => ({id, clicks}))
  });
});

// API — зафіксувати візит
app.post('/api/visit', (req, res) => {
  visitorCount++;
  res.json({ message: "Візит зафіксовано" });
});

// API — зафіксувати клік по петиції
app.post('/api/click', (req, res) => {
  const { id } = req.body;
  const petition = petitions.find(p => p.id === id);
  if (!petition) {
    return res.status(400).json({ error: "Невідома петиція" });
  }
  petition.clicks++;
  totalClicks++;
  res.json({ message: "Клік зафіксовано" });
});

// Головна сторінка — віддаємо готовий HTML з рендером даних (простіше через шаблон)
app.get('/', (req, res) => {
  const petitionsHtml = petitions.map(p => `
    <div class="petition">
      <div><strong>${p.name}</strong></div>
      <a href="${p.url}" target="_blank" onclick="trackClick('${p.id}')">${p.url}</a>
      <div class="clicks">Переходів сьогодні: <span id="click-${p.id}">${p.clicks}</span></div>
    </div>
  `).join('');

  const html = `
  <!DOCTYPE html>
  <html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Вшанування Героїв України</title>
    <style>
      body {
        font-family: 'Segoe UI', sans-serif;
        background: #f4f6f9;
        margin: 0;
        padding: 0;
      }
      header {
        background: #1a73e8;
        color: white;
        padding: 20px 10px;
        text-align: center;
      }
      header h1 {
        margin: 0;
        font-size: 24px;
      }
      .counter {
        background: #fff;
        margin: 10px auto;
        padding: 10px;
        max-width: 800px;
        border-radius: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        text-align: center;
        font-size: 18px;
      }
      .petition-list {
        max-width: 800px;
        margin: 20px auto;
        padding: 10px;
      }
      .petition {
        background: white;
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 10px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      }
      .petition a {
        color: #1a73e8;
        text-decoration: none;
        font-weight: bold;
        display: block;
        margin-top: 5px;
      }
      .petition a:hover {
        text-decoration: underline;
      }
      .petition .clicks {
        font-size: 14px;
        color: #555;
        margin-top: 5px;
      }
      @media (max-width: 600px) {
        header h1 {
          font-size: 18px;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>💔 Вічна памʼять Героям України 💔</h1>
    </header>
    <div class="counter">
      👁 Загальна кількість відвідувачів сьогодні: <span id="visitor-count">${visitorCount}</span><br>
      ✅ Загальні переходи за петиціями: <span id="total-clicks">${totalClicks}</span>
    </div>
    <div class="petition-list" id="petition-list">
      ${petitionsHtml}
    </div>
    <script>
      function trackClick(id) {
        fetch('/api/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        })
        .then(res => res.json())
        .then(() => {
          const el = document.getElementById('click-' + id);
          if(el) el.textContent = parseInt(el.textContent) + 1;
          const total = document.getElementById('total-clicks');
          total.textContent = parseInt(total.textContent) + 1;
        });
      }
      // Відвідувач зафіксований
      fetch('/api/visit', { method: 'POST' });
    </script>
  </body>
  </html>
  `;

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
