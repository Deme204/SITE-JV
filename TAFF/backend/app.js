const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/esport', { useNewUrlParser: true, useUnifiedTopology: true });

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/competitions', require('./routes/competitions'));
app.use('/api/results', require('./routes/results'));
app.use('/api/newsletter', require('./routes/newsletter'));

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
