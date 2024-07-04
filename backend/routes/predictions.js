const express = require('express');
const router = express.Router();
const axios = require('axios');
const GeneratedImage = require('../models/GeneratedImage');

// POST /api/predictions
router.post('/', async (req, res) => {
  const { prompt, seed, width, height, num_outputs } = req.body;

  try {
    const response = await axios.post("https://api.replicate.com/v1/predictions", {
      version: "2c8e954decbf70b7607a4414e5785ef9e4de4b8c51d50fb8b8b349160e0ef6bb",
      input: { prompt, seed, width, height, num_outputs },
    }, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("Replicate API Response:", response.data); // Log response for debugging

    // Ensure output is always an array
    const output = Array.isArray(response.data.output) ? response.data.output : [response.data.output];
    
    res.status(200).json({ ...response.data, output });
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message); // Log error for debugging

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ detail: error.message });
    }
  }
});

// GET /api/predictions/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("Prediction Status Response:", response.data); // Log status response for debugging

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message); // Log error for debugging

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ detail: error.message });
    }
  }
});

// POST /api/predictions/save-images
router.post('/save-images', async (req, res) => {
  const { prompt, seed, width, height, imageUrls } = req.body;

  try {
    for (const url of imageUrls) {
      await GeneratedImage.create({
        prompt,
        seed,
        width,
        height,
        imageUrl: url // Change this to `imageUrl`
      });
    }
    res.status(200).json({ message: 'Images saved successfully.' });
  } catch (error) {
    console.error("Error saving generated images:", error.message);
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/predictions/images
router.get('/images', async (req, res) => {
  console.log("GET /images route hit");
  try {
    const images = await GeneratedImage.find();
    res.status(200).json(images);
  } catch (error) {
    console.error("Error fetching images:", error.message);
    res.status(500).json({ detail: "Internal Server Error" });
  }
});

module.exports = router;