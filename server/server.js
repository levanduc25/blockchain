const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const verifyEnv = require('./scripts/verifyEnv');

dotenv.config();
verifyEnv();

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/voter', require('./routes/voterRoutes'));
app.use('/api/candidate', require('./routes/candidateRoutes'));
app.use('/api/vote', require('./routes/voteRoutes'));
app.use('/api/election', require('./routes/electionRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));