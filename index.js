const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/authRoutes');
const workerRoutes= require('./routes/workerRoutes');
const missionRoutes= require('./routes/missionRoutes');
const conversationRoutes = require('./routes/conversationRoutes')
const { testConnection } = require('./db');

const app = express();
testConnection()
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/mission', missionRoutes);
app.use('/api/conversation', conversationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});