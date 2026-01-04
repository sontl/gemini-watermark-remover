import express from 'express';
import cors from 'cors';
import { WatermarkEngineNode } from './lib/engine-node.js';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let engine = null;

// Initialize engine
(async () => {
    try {
        engine = await WatermarkEngineNode.create();
        console.log('Watermark Engine initialized');
    } catch (e) {
        console.error('Failed to initialize Watermark Engine:', e);
        process.exit(1);
    }
})();

app.post('/remove-watermark', async (req, res) => {
    try {
        const { imageUrl, outputType = 'binary' } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: 'imageUrl is required' });
        }

        // Fetch the image
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);

        // Process the image
        const result = await engine.process(imageBuffer);

        if (outputType === 'base64') {
            const base64Image = result.buffer.toString('base64');
            return res.json({
                image: `data:image/png;base64,${base64Image}`,
                width: result.width,
                height: result.height
            });
        } else {
            // Binary output
            res.setHeader('Content-Type', 'image/png');
            res.send(result.buffer);
        }

    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Failed to process image' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
