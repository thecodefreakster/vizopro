import React, { useState, useEffect, useRef } from 'react'
import { Button } from './components/ui/button.tsx'
import { Input } from './components/ui/input.tsx'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './components/ui/card.tsx'
import { Progress } from './components/ui/progress.tsx'
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar.tsx'
import { Upload, Play, Heart, Share2, MessageCircle, Search } from 'lucide-react'
import axios from 'axios'
import { GetSignedUrl, storeVideoLink, setPublicAccess, getPublicUrl, getVideoByGeneratedId } from "./lib/action.ts";

const API_URL = 'https://veezo.pro';

export default function App() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videos, setVideos] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API_URL}`)
      setVideos(response.data)
    } catch (error) {
      console.error('Error fetching videos:', error)
    }
  }

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0])
  }

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    const url = await GetSignedUrl(file.name);

        const response = await fetch(url, {
          method: 'PUT',
          body: file,
        });
      
    // if (!selectedFile) {
    //   alert('Please select a file first')
    //   return
    // }

    // const formData = new FormData()
    // formData.append('video', selectedFile)

    // try {
    //   await axios.post(`${API_URL}`, formData, {
    //     onUploadProgress: (progressEvent) => {
    //       const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    //       setUploadProgress(percentCompleted)
    //     }
    //   })
    //   setUploadProgress(0)
    //   setSelectedFile(null)
    //   if (fileInputRef.current) {
    //     fileInputRef.current.value = ''
    //   }
    //   fetchVideos()
    // } catch (error) {
    //   console.error('Error uploading video:', error)
    //   setUploadProgress(0)
    // }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">VideoUploader</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8 w-64" placeholder="Search videos..." />
          </div>
          <Avatar>
            <AvatarImage src="/placeholder-user.jpg" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </header>
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload a New Video</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input 
                  type="file" 
                  accept="video/*" 
                  onChange={handleFileSelect} 
                  ref={fileInputRef}
                />
                <Button onClick={handleUpload} disabled={!selectedFile}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </Button>
                {uploadProgress > 0 && (
                  <Progress value={uploadProgress} className="mt-4" />
                )}
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video) => (
              <Card key={video.id}>
                <CardHeader className="p-0">
                  <div className="aspect-video bg-muted relative">
                    <video src={video.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-12 w-12 text-white opacity-75" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg">{video.filename}</CardTitle>
                  <p className="text-sm text-muted-foreground">{video.views || 0} views</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4 mr-1" />
                    {video.likes || 0}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Comment
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        © 2024 VideoUploader. All rights reserved.
      </footer>
    </div>
  )
}