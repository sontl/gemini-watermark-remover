import axios from 'axios';
import fs from 'fs';

const API_URL = 'http://localhost:3000/remove-watermark';
// Use a sample image URL (replace with a real Gemini image if available)
// For testing purposes, we can use a placeholder, but it won't show watermark removal.
// Ideally usage:
const IMAGE_URL = 'https://picsum.photos/200/300';

async function testApi() {
    try {
        console.log('Testing Binary Output...');
        const responseBinary = await axios.post(API_URL, {
            imageUrl: IMAGE_URL,
            outputType: 'binary'
        }, {
            responseType: 'arraybuffer'
        });

        fs.writeFileSync('output_binary.png', responseBinary.data);
        console.log('Saved output_binary.png');

        console.log('Testing Base64 Output...');
        const responseBase64 = await axios.post(API_URL, {
            imageUrl: IMAGE_URL,
            outputType: 'base64'
        });

        if (responseBase64.data.image && responseBase64.data.image.startsWith('data:image/png;base64,')) {
            console.log('Base64 output received correctly');
            // Save to file to verify
            const base64Data = responseBase64.data.image.replace(/^data:image\/png;base64,/, "");
            fs.writeFileSync('output_base64.png', base64Data, 'base64');
            console.log('Saved output_base64.png');
        } else {
            console.error('Invalid Base64 response format');
        }

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data.toString());
        }
    }
}

testApi();
