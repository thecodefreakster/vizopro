"use server";

import { Storage } from "@google-cloud/storage";

const BUCKET_NAME = 'veezopro_videos';
const storage = new Storage({ keyFilename: 'videoSubmitKey.json' });

// In-memory store for video links (use a database in production)
const videoLinks: { [key: string]: { fileName: string; url: string } } = {};

// Generate a signed URL for uploading a video
export const GetSignedUrl = async (fileName: string): Promise<string> => {
  const [url] = await storage.bucket(BUCKET_NAME)
    .file(fileName)
    .getSignedUrl({
      action: 'write',
      version: 'v4',
      expires: Date.now() + 15 * 60 * 1000,  // 15 minutes
    });
  return url;
};

// Make the video publicly accessible
export const setPublicAccess = async (fileName: string): Promise<void> => {
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(fileName);
  await file.makePublic();
};

// Get the public URL of a video
export const getPublicUrl = (fileName: string): string => {
  return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
};

// Store the video link with its corresponding ID and filename
// export const storeVideoLink = (id: string, fileName: string): void => {
//   const publicUrl = getPublicUrl(fileName);
//   videoLinks[id] = { fileName, url: publicUrl };
// };

export const storeVideoLink = (id: string, fileName: string): void => {
  const publicUrl = getPublicUrl(fileName);
  videoLinks[id] = { fileName, url: publicUrl };
  console.log('Stored video link:', id, videoLinks[id]); // Debugging output
};

export const getVideoUrlById = (id: string): string | null => {
  const videoData = videoLinks[id];
  if (videoData) {
    return videoData.url;
  }
  console.log('Video not found for ID:', id); // Debugging output
  return null;
};

// // API handler for video redirection
// export const handleRedirect = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
//   const videoId = req.query['id'] as string;  // Corrected to 'id'
//   const videoData = videoLinks[videoId];

//   if (videoData) {
//     res.redirect(videoData.url);
//   } else {
//     res.status(404).send('Video not found');
//   }
// };

// Set CORS configuration for the bucket
export const SetCors = async () => {
  await storage.bucket(BUCKET_NAME).setCorsConfiguration([
    {
      maxAgeSeconds: 3600,
      method: ['GET', 'PUT'],
      origin: ['*'],
      responseHeader: ['Content-Type'],
    },
  ]);
};

export async function getVideoByGeneratedId(id: string) {
  try {
    // This should be a call to your backend API or database
    // to retrieve the video information based on the generated ID
    const response = await fetch(`/api/videos/${id}`);
    if (!response.ok) {
      throw new Error('Video not found');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching video:', error);
    return null;
  }
}
