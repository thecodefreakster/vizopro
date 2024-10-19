const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());

// Configure Google Cloud Storage
const storage = new Storage({
  keyFilename: path.join(__dirname, '../../veezopro-gcsk.json'),
  projectId: 'veezopro',
});

const bucket = storage.bucket('veezopro_videos');

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // limit file size to 50MB
  },
});

// Store video metadata
let videos = [];

// Root route
app.get('/', (req, res) => {
  res.send('Video Hosting API is running');
});

app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', (err) => {
    console.error(err);
    res.status(500).send('Error uploading file');
  });

  blobStream.on('finish', () => {
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    videos.push({
      id: videos.length + 1,
      filename: req.file.originalname,
      url: publicUrl,
    });
    res.status(200).send('File uploaded successfully');
  });

  blobStream.end(req.file.buffer);
});

app.get('/api/videos', (req, res) => {
  res.json(videos);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});