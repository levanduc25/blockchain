const mongoose = require('mongoose');

const connectDB = async () => {
	const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/voting_system';
	try {
		await mongoose.connect(uri, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
		console.log('MongoDB connected');
	} catch (err) {
		console.error('MongoDB connection error:', err.message || err);
		process.exit(1);
	}
};

module.exports = connectDB;

