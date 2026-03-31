const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Connect to DB and create tables if not exists
require('./config/db');

// Swagger setup
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint Not Found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => { 
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📄 Swagger Docs available at http://localhost:${PORT}/api-docs`);
});