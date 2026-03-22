const express = require('express');
const cors = require('cors');
const config = require('./config');
const { connectDatabase } = require('./config/database');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

async function start() {
  await connectDatabase();
  app.listen(config.port, () => {
    console.log(`Sahaya backend running on http://localhost:${config.port}`);
    console.log(`API base: http://localhost:${config.port}/api`);
    if (config.devDbToolsEnabled) {
      console.log(`Dev DB insert API: http://localhost:${config.port}/api/dev (see docs/DEV_DB_API.md)`);
    }
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
