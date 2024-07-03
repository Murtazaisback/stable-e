const mongoose = require('mongoose');

const generatedImageSchema = new mongoose.Schema({
  prompt: String,
  seed: Number,
  width: Number,
  height: Number,
  imageUrl: String,  // Changed from imageUrls to imageUrl
  createdAt: { type: Date, default: Date.now }
});

const GeneratedImage = mongoose.model('GeneratedImage', generatedImageSchema);

module.exports = GeneratedImage;
