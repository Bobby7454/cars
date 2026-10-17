const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const cars = [
  { id: 1, make: 'Bugatti', model: 'Chiron Super Sport', year: 2021, engine: '8.0L quad-turbo W16', hp: 1578, accel: 2.4, top: 440, color: '#1f3a8a' },
  { id: 2, make: 'Rimac', model: 'Nevera', year: 2022, engine: 'Four electric motors', hp: 1914, accel: 1.74, top: 412, color: '#0f9d8a' },
  { id: 3, make: 'Koenigsegg', model: 'Jesko', year: 2022, engine: '5.0L twin-turbo V8', hp: 1280, accel: 2.5, top: 480, color: '#e07b00' },
  { id: 4, make: 'Lamborghini', model: 'Revuelto', year: 2024, engine: '6.5L V12 plug-in hybrid', hp: 1015, accel: 2.5, top: 350, color: '#d4a600' },
  { id: 5, make: 'Ferrari', model: 'SF90 Stradale', year: 2020, engine: '4.0L twin-turbo V8 hybrid', hp: 986, accel: 2.5, top: 340, color: '#c8102e' },
  { id: 6, make: 'Aston Martin', model: 'Valkyrie', year: 2022, engine: '6.5L V12 hybrid', hp: 1160, accel: 2.5, top: 350, color: '#2e5b3c' },
  { id: 7, make: 'Mercedes-AMG', model: 'One', year: 2022, engine: '1.6L turbo V6 hybrid', hp: 1063, accel: 2.9, top: 352, color: '#8a9099' },
  { id: 8, make: 'Pagani', model: 'Utopia', year: 2023, engine: '6.0L twin-turbo V12', hp: 852, accel: 2.8, top: 350, color: '#7a4a2b' },
  { id: 9, make: 'McLaren', model: '765LT', year: 2021, engine: '4.0L twin-turbo V8', hp: 755, accel: 2.8, top: 330, color: '#ff6a13' },
  { id: 10, make: 'Porsche', model: '911 GT3 RS', year: 2023, engine: '4.0L flat-six', hp: 518, accel: 3.2, top: 296, color: '#5c6f82' }
];

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/cars', (req, res) => res.json(cars));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Supercars running on port ${PORT}`));
