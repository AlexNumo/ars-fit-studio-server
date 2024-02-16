require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
// const MongoClient = require('mongodb').MongoClient;
const { PORT, DB_HOST } = process.env;
// const client = new MongoClient(DB_HOST, { useNewUrlParser: true, useUnifiedTopology: true });

// ==================================== Start the server =====================================================================================

mongoose.connect(DB_HOST).then(() => {
  console.log('Database connection successful');
  app.listen(PORT || 3000);
}).then(() => {
  console.log(`Server is on ${PORT || 3000}`);
}).catch((err) => {
  console.log('ERROR', err);
  process.exit(1);
});
