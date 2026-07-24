// .env relativo al proyecto (no al cwd) para poder lanzar el server desde cualquier directorio
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const logRoutes = require('./log');
const { router: finnegansRoutes } = require('./finnegans');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/log', logRoutes);
app.use('/finnegans', finnegansRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log(`centraliza-api listening on port ${port}`);
});
