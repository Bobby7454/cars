const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DATA_DIR = path.join(__dirname, 'data');
const CARS_FILE = path.join(DATA_DIR, 'cars.json');
const INQ_FILE = path.join(DATA_DIR, 'inquiries.json');

const FUELS = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const GEARS = ['Manual', 'Automatic'];

const SEED = [
  { id: 'c1a2b3d4', make: 'Maruti Suzuki', model: 'Swift ZXi', year: 2020, price: 565000, km: 38000, fuel: 'Petrol', transmission: 'Manual', color: 'Pearl White', description: 'Single owner, full service history, new tyres fitted last year.', image: '', sold: false },
  { id: 'e5f6a7b8', make: 'Hyundai', model: 'Creta SX', year: 2019, price: 1085000, km: 52000, fuel: 'Diesel', transmission: 'Automatic', color: 'Titan Grey', description: 'Sunroof, touchscreen infotainment, rear camera. Insurance valid.', image: '', sold: false },
  { id: '9c0d1e2f', make: 'Tata', model: 'Nexon EV', year: 2022, price: 1395000, km: 21000, fuel: 'Electric', transmission: 'Automatic', color: 'Teal Blue', description: 'Battery warranty remaining, home charger included.', image: '', sold: false },
  { id: '3a4b5c6d', make: 'Honda', model: 'City VX', year: 2018, price: 745000, km: 64000, fuel: 'Petrol', transmission: 'Automatic', color: 'Lunar Silver', description: 'Well maintained, no accident history, two keys.', image: '', sold: false },
  { id: '7e8f9a0b', make: 'Toyota', model: 'Innova Crysta', year: 2017, price: 1650000, km: 91000, fuel: 'Diesel', transmission: 'Manual', color: 'Super White', description: 'Seven-seater, dealer serviced, ideal family or travel vehicle.', image: '', sold: true }
];

/* ---------- storage ---------- */
let chain = Promise.resolve();
const locked = (fn) => (chain = chain.then(fn, fn));

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; }
}
async function writeJson(file, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = file + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
}
const update = (file, fallback, fn) =>
  locked(async () => {
    const data = await readJson(file, fallback);
    const result = await fn(data);
    await writeJson(file, data);
    return result;
  });

/* ---------- validation ---------- */
const str = (v, max) => String(v ?? '').trim().slice(0, max);

function cleanCar(b) {
  const car = {
    make: str(b.make, 40),
    model: str(b.model, 60),
    year: parseInt(b.year, 10),
    price: Math.round(Number(b.price)),
    km: Math.round(Number(b.km)),
    fuel: str(b.fuel, 20),
    transmission: str(b.transmission, 20),
    color: str(b.color, 30),
    description: str(b.description, 600),
    image: str(b.image, 500)
  };
  const maxYear = new Date().getFullYear() + 1;
  if (!car.make || !car.model) return null;
  if (!(car.year >= 1980 && car.year <= maxYear)) return null;
  if (!(car.price > 0) || !(car.km >= 0)) return null;
  if (!FUELS.includes(car.fuel) || !GEARS.includes(car.transmission)) return null;
  if (car.image && !/^(https?:\/\/|\/)/.test(car.image)) return null;
  return car;
}

/* ---------- auth ---------- */
const tokens = new Set();
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!tokens.has(token)) return res.status(401).json({ error: 'Login required' });
  next();
}

/* ---------- app ---------- */
const app = express();
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Public
app.get('/api/cars', async (req, res) => {
  const cars = await readJson(CARS_FILE, []);
  res.json(cars);
});

app.get('/api/cars/:id', async (req, res) => {
  const cars = await readJson(CARS_FILE, []);
  const car = cars.find((c) => c.id === req.params.id);
  if (!car) return res.status(404).json({ error: 'Car not found' });
  res.json(car);
});

app.post('/api/inquiries', async (req, res) => {
  const inquiry = {
    id: crypto.randomUUID().slice(0, 8),
    carId: str(req.body.carId, 20),
    name: str(req.body.name, 80),
    phone: str(req.body.phone, 20),
    message: str(req.body.message, 600),
    createdAt: new Date().toISOString()
  };
  if (!inquiry.name || !/^[+\d][\d\s-]{6,17}$/.test(inquiry.phone)) {
    return res.status(400).json({ error: 'Enter your name and a valid phone number.' });
  }
  const cars = await readJson(CARS_FILE, []);
  if (!cars.some((c) => c.id === inquiry.carId)) {
    return res.status(400).json({ error: 'This car is no longer listed.' });
  }
  await update(INQ_FILE, [], (list) => { list.unshift(inquiry); });
  res.status(201).json({ ok: true });
});

// Admin
app.post('/api/admin/login', (req, res) => {
  const ok = crypto.timingSafeEqual(sha(req.body.password), sha(ADMIN_PASSWORD));
  if (!ok) return res.status(401).json({ error: 'Wrong password' });
  const token = crypto.randomBytes(24).toString('hex');
  tokens.add(token);
  res.json({ token });
});

app.get('/api/admin/inquiries', requireAdmin, async (req, res) => {
  res.json(await readJson(INQ_FILE, []));
});

app.post('/api/cars', requireAdmin, async (req, res) => {
  const car = cleanCar(req.body);
  if (!car) return res.status(400).json({ error: 'Check the car details and try again.' });
  car.id = crypto.randomUUID().slice(0, 8);
  car.sold = false;
  await update(CARS_FILE, [], (list) => { list.unshift(car); });
  res.status(201).json(car);
});

app.patch('/api/cars/:id', requireAdmin, async (req, res) => {
  const found = await update(CARS_FILE, [], (list) => {
    const car = list.find((c) => c.id === req.params.id);
    if (car) car.sold = !!req.body.sold;
    return car;
  });
  if (!found) return res.status(404).json({ error: 'Car not found' });
  res.json(found);
});

app.delete('/api/cars/:id', requireAdmin, async (req, res) => {
  await update(CARS_FILE, [], (list) => {
    const i = list.findIndex((c) => c.id === req.params.id);
    if (i !== -1) list.splice(i, 1);
  });
  res.json({ ok: true });
});

(async () => {
  try { await fs.access(CARS_FILE); } catch { await writeJson(CARS_FILE, SEED); }
  app.listen(PORT, () => {
    console.log(`Car site running at http://localhost:${PORT}`);
    if (!process.env.ADMIN_PASSWORD) console.warn('ADMIN_PASSWORD not set, using default "admin123". Change it before going live.');
  });
})();
