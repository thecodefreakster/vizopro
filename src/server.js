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
  origin: '*',
  method: ["POST", "GET", "OPTIONS"],
  responseHeader: ["Content-Type"],
  maxAgeSeconds: 3600
}));

// Configure Google Cloud Storage with environment variabless
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    path.join(__dirname, '../../veezopro-gcsk.json'),
  projectId: process.env.GC_PROJECT_ID || 'veezopro',
});

const bucket = storage.bucket(process.env.GC_BUCKET_NAME || 'veezopro_videos');

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
app.post('/upload', (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'File parsing error' });
      return;
    }

    const file = files.file[0]; // Accessing the file from the parsed data
    const blob = bucket.file(file.originalFilename); // Use the original file name
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype, // Set the correct content type
    });

    // Handle any errors during the upload
    blobStream.on('error', (err) => {
      res.status(500).json({ error: err.message });
    });

    // After the file is fully uploaded
    blobStream.on('finish', async () => {
      try {
        // Make the file public
        await blob.makePublic();

        // Generate the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

        // Store the video link with the generated ID (you need to generate an ID for this)
        const id = generateId(); // You may use a custom function to generate an ID
        storeVideoLink(id, file.originalFilename); // Store the video link with the generated ID

        // Return the public URL in the response
        res.status(200).json({ url: publicUrl });
      } catch (error) {
        console.error('Error making the file public:', error);
        res.status(500).json({ error: 'Failed to make file public' });
      }
    });

    // Start uploading the file
    fs.createReadStream(file.filepath).pipe(blobStream);
  });
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
