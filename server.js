const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const HF_API_KEY = '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';
const USERNAME = 'BACKUPSERVER';

const API_URL = 'https://huggingface.co/api/repos/create';

// Middleware for file uploads
const upload = multer({ dest: 'uploads/' });

// Helper function to upload file
async function uploadFile(repoName, filePath, fileName) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    await axios.put(
        `https://huggingface.co/${USERNAME}/${repoName}/resolve/main/${fileName}`,
        fileContent,
        {
            headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/octet-stream',
            },
        }
    );
}

// Endpoint to create a space and upload files
app.post('/api/createSpace', async (req, res) => {
    const { spaceName, spaceType } = req.body;

    try {
        // Step 1: Create the space
        const createResponse = await axios.post(
            API_URL,
            {
                name: spaceName,
                type: spaceType,
                private: false,
                sdk: 'docker',
            },
            {
                headers: {
                    Authorization: `Bearer ${HF_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Step 2: Upload files if the space creation is successful
        if (createResponse.status === 201) {
            await uploadFile(spaceName, path.join(__dirname, 'Dockerfile'), 'Dockerfile');
            await uploadFile(spaceName, path.join(__dirname, 'server.js'), 'server.js');
            await uploadFile(spaceName, path.join(__dirname, 'start.sh'), 'start.sh');
            res.status(201).json({ message: `Space "${spaceName}" created and files uploaded successfully!` });
        } else {
            res.status(400).json({ error: 'Failed to create the space' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating space or uploading files' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
