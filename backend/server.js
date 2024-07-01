const axios = require('axios');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/predictions', async (req, res) => {
    const { prompt, seed } = req.body;

    try {
        const response = await axios.post("https://api.replicate.com/v1/predictions", {
            version: "c86579ac5193bf45422f1c8b92742135aa859b1850a8e4c531bff222fc75273d",
            input: { prompt, seed },
        }, {
            headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ detail: error.message });
        }
    }
});

app.get('/api/predictions/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const response = await axios.get(`https://api.replicate.com/v1/predictions/${id}`, {
            headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ detail: error.message });
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
