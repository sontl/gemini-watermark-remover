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
    const requestId = Math.random().toString(36).substring(7);
    const start = Date.now();

    try {
        const { imageUrl, outputType = 'binary' } = req.body;
        console.log(`[${requestId}] Incoming request: ${imageUrl} (output: ${outputType})`);

        if (!imageUrl) {
            console.warn(`[${requestId}] Validation failed: imageUrl is missing`);
            return res.status(400).json({ error: 'imageUrl is required' });
        }

        // Fetch the image
        console.log(`[${requestId}] Fetching image...`);
        const fetchStart = Date.now();
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);
        console.log(`[${requestId}] Image fetched successfully in ${Date.now() - fetchStart}ms (${imageBuffer.length} bytes)`);

        // Process the image
        console.log(`[${requestId}] Processing image...`);
        const processStart = Date.now();
        const result = await engine.process(imageBuffer);
        const duration = Date.now() - processStart;
        console.log(`[${requestId}] Image processed successfully in ${duration}ms (${result.width}x${result.height})`);

        if (outputType === 'base64') {
            const base64Image = result.buffer.toString('base64');
            const totalDuration = Date.now() - start;
            console.log(`[${requestId}] Returning base64 response. Total time: ${totalDuration}ms`);
            return res.json({
                image: `data:image/png;base64,${base64Image}`,
                width: result.width,
                height: result.height,
                processing_ms: duration,
                total_ms: totalDuration
            });
        } else {
            // Binary output
            const totalDuration = Date.now() - start;
            console.log(`[${requestId}] Returning binary response. Total time: ${totalDuration}ms`);
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('X-Processing-Time', duration);
            res.setHeader('X-Total-Time', totalDuration);
            res.send(result.buffer);
        }

    } catch (error) {
        const totalDuration = Date.now() - start;
        console.error(`[${requestId}] Error processing image after ${totalDuration}ms:`, error.message);
        res.status(500).json({
            error: 'Failed to process image',
            message: error.message,
            request_id: requestId
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
