import { createCanvas, loadImage, Image } from 'canvas';
import { calculateAlphaMap } from '../js/alphaMap.js';
import { removeWatermark } from '../js/blendModes.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class WatermarkEngineNode {
    constructor(bg48, bg96) {
        this.bg48 = bg48;
        this.bg96 = bg96;
        this.alphaMaps = {};
    }

    static async create() {
        try {
            // Load assets from the assets directory relative to the project root
            const assetsDir = path.join(__dirname, '..', 'assets');
            const [bg48, bg96] = await Promise.all([
                loadImage(path.join(assetsDir, 'bg_48.png')),
                loadImage(path.join(assetsDir, 'bg_96.png'))
            ]);
            return new WatermarkEngineNode(bg48, bg96);
        } catch (e) {
            console.error("Failed to load assets: ", e);
            throw e;
        }
    }

    getWatermarkInfo(width, height) {
        const isLarge = width > 1024 && height > 1024;
        const size = isLarge ? 96 : 48;
        const margin = isLarge ? 64 : 32;

        return {
            size,
            x: width - margin - size,
            y: height - margin - size,
            width: size,
            height: size
        };
    }

    async getAlphaMap(size) {
        if (this.alphaMaps[size]) {
            console.log(`  - Using cached alpha map for size ${size}`);
            return this.alphaMaps[size];
        }

        console.log(`  - Generating new alpha map for size ${size}...`);
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(size === 48 ? this.bg48 : this.bg96, 0, 0);

        const map = calculateAlphaMap(ctx.getImageData(0, 0, size, size));
        this.alphaMaps[size] = map;
        return map;
    }

    async process(imageInput) {
        let img;
        if (typeof imageInput === 'string') {
            // It's a URL or path, loadImage handles both
            img = await loadImage(imageInput);
        } else if (Buffer.isBuffer(imageInput)) {
            img = await loadImage(imageInput);
        } else {
            throw new Error("Invalid image input");
        }

        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const config = this.getWatermarkInfo(canvas.width, canvas.height);
        console.log(`  - Detected resolution: ${img.width}x${img.height}. Using ${config.size}px watermark map.`);

        const alphaMap = await this.getAlphaMap(config.size);
        console.log(`  - Applying restoration algorithm at (${config.x}, ${config.y})...`);
        removeWatermark(imageData, alphaMap, config);

        ctx.putImageData(imageData, 0, 0);

        console.log(`  - Encoding result to PNG buffer...`);

        return {
            buffer: canvas.toBuffer('image/png'),
            width: img.width,
            height: img.height
        };
    }
}
