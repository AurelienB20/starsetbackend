const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/authRoutes');
const workerRoutes= require('./routes/workerRoutes');
const missionRoutes= require('./routes/missionRoutes');
const conversationRoutes = require('./routes/conversationRoutes')
const uploadRoutes = require('./routes/uploadRoutes')
const { testConnection } = require('./db');

const app = express();
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));


testConnection()
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/mission', missionRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/uploads', uploadRoutes); // Ajout de la route d'upload

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});