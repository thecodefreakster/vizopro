// const express = require('express');
// const multer = require('multer');
// const { Storage } = require('@google-cloud/storage');
// const cors = require('cors');
// const path = require('path');

// const app = express();
// const port = 3001;

// app.use(cors());

// // Configure Google Cloud Storage
// const storage = new Storage({
//   keyFilename: path.join(__dirname, '../../veezopro-gcsk.json'),
//   projectId: 'your-project-id',
// });

// const bucket = storage.bucket('your-bucket-name');

// // Configure multer for handling file uploads
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 50 * 1024 * 1024, // limit file size to 50MB
//   },
// });

// // Store video metadata
// let videos = [];

// // Root route
// app.get('/', (req, res) => {
//   res.send('Video Hosting API is running');
// });

// app.post('/api/upload', upload.single('video'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).send('No file uploaded.');
//   }

//   const blob = bucket.file(req.file.originalname);
//   const blobStream = blob.createWriteStream();

//   blobStream.on('error', (err) => {
//     console.error(err);
//     res.status(500).send('Error uploading file');
//   });

//   blobStream.on('finish', () => {
//     const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
//     videos.push({
//       id: videos.length + 1,
//       filename: req.file.originalname,
//       url: publicUrl,
//     });
//     res.status(200).send('File uploaded successfully');
//   });

//   blobStream.end(req.file.buffer);
// });

// app.get('/api/videos', (req, res) => {
//   res.json(videos);
// });

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });



require('dotenv').config(); // Load environment variables
const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || '*', // Limit CORS for production
}));

// Configure Google Cloud Storage with environment variabless
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    path.join(__dirname, '../../veezopro-gcsk.json'),
  projectId: process.env.GC_PROJECT_ID || 'your-project-id',
});

const bucket = storage.bucket(process.env.GC_BUCKET_NAME || 'your-bucket-name');

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Store video metadata
let videos = [];

// Root route
app.get('/', (req, res) => {
  res.send('Video Hosting API is running');
});

// Upload video route
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream({
      resumable: false, // Consider resumable uploads for large files
    });

    blobStream.on('error', (err) => {
      console.error('Upload errori:', err);
      return res.status(500).send('Error uploading file');
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      videos.push({
        id: videos.length + 1,
        filename: req.file.originalname,
        url: publicUrl,
      });
      res.status(200).json({ message: 'File uploaded successfully', url: publicUrl });
    });

    blobStream.end(req.file.buffer);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).send('Internal server error');
  }
});

// Get list of uploaded videos
app.get('/api/videos', (req, res) => {
  res.json(videos);
});

// Handle 404 for unknown routes
app.use((req, res) => {
  res.status(404).send('Route not found');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
