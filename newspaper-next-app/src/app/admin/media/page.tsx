'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Image from 'next/image'; // For optimized image display

interface MediaItem {
  _id: string;
  url: string;
  fileName: string;
  fileType: string;
  altText?: string;
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'other';
  createdAt: string;
}

export default function AdminMediaPage() {
  const { data: session } = useSession();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchMediaItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This API is currently a placeholder
      const response = await fetch('/api/media');
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message && errorData.message.includes('Not Implemented')) {
            setError('Media listing is not fully available: API is not implemented.');
        } else {
            throw new Error(errorData.message || 'Failed to fetch media items');
        }
        setMediaItems([]);
      } else {
        const data = await response.json();
        if (Array.isArray(data)) {
            setMediaItems(data);
        } else {
             console.warn("Fetched data for media is not an array:", data);
             setMediaItems([]);
        }
      }
    } catch (err: any) {
      setError(err.message);
      setMediaItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) { // Assuming middleware handles overall access
      fetchMediaItems();
    }
  }, [session]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Auto-fill alt text from filename (user can change it)
      setAltText(e.target.files[0].name.substring(0, e.target.files[0].name.lastIndexOf('.'))
                                   .replace(/[-_]/g, ' ')
                                   .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
      setUploadError(null);
      setUploadProgress(0);
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a file to upload.');
      return;
    }
    if (!session?.user?.id) {
        setUploadError('You must be logged in to upload files.');
        return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // 1. Get presigned URL
      const presignResponse = await fetch('/api/media/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
      });

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json();
        throw new Error(errorData.message || 'Failed to get presigned URL.');
      }
      const { signedUrl, uniqueKey, publicUrl } = await presignResponse.json();

      // 2. Upload file to R2 using presigned URL (with XHR for progress)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl, true);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText} (Status: ${xhr.status})`));
          }
        };
        xhr.onerror = () => {
          reject(new Error('Upload failed due to network error.'));
        };
        xhr.send(file);
      });

      setUploadProgress(100); // Mark as complete

      // 3. Save media metadata to our database
      // This API is currently a placeholder
      const mediaTypeGuess = file.type.startsWith('image/') ? 'image' :
                             file.type.startsWith('video/') ? 'video' :
                             file.type.startsWith('audio/') ? 'audio' : 'other';

      const metadataResponse = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: publicUrl, // The public URL of the file on R2
          r2Key: uniqueKey, // Store the R2 key for potential direct operations like delete
          fileName: file.name,
          fileType: file.type,
          altText: altText,
          mediaType: mediaTypeGuess,
          size: file.size,
          uploadedBy: session.user.id,
          // dimensions could be added here if client-side image parsing is done
        }),
      });

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
         if (errorData.message && errorData.message.includes('Not Implemented')) {
            setUploadError('File uploaded to storage, but failed to save metadata: API is not implemented.');
        } else {
            throw new Error(errorData.message || 'Failed to save media metadata.');
        }
      } else {
        // Success
        setFile(null);
        setAltText('');
        fetchMediaItems(); // Refresh the list
      }

    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaItem: MediaItem) => {
    // Assuming mediaItem.url contains the R2 public URL, and we need the R2 key.
    // The R2 key should ideally be stored in the MediaItem document.
    // For now, let's assume the API /api/media/[id] handles R2 deletion using a stored key.
    if (!confirm(`Are you sure you want to delete "${mediaItem.fileName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      // This API is currently a placeholder
      const response = await fetch(`/api/media/${mediaItem._id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message && errorData.message.includes('Not Implemented')) {
            alert('Cannot delete media: API is not implemented.');
        } else {
            throw new Error(errorData.message || 'Failed to delete media item');
        }
      } else {
        fetchMediaItems(); // Refresh list
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const canManage = session?.user?.role === 'admin' || session?.user?.role === 'editor' || session?.user?.role === 'author';


  return (
    <div className=\"min-h-screen bg-gray-100 py-8\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
        <div className=\"flex justify-between items-center mb-6\">
          <h1 className=\"text-2xl font-semibold text-gray-900\">Media Library</h1>
           <Link href=\"/admin\" className=\"text-sm text-indigo-600 hover:text-indigo-800\">
            &larr; Back to Admin Dashboard
          </Link>
        </div>

        {/* Upload Form */}
        {canManage && (
            <div className=\"bg-white shadow sm:rounded-lg p-6 mb-8\">
            <h2 className=\"text-xl font-semibold text-gray-800 mb-4\">Upload New Media</h2>
            <form onSubmit={handleUpload} className=\"space-y-4\">
                {uploadError && <div className=\"bg-red-100 border-l-4 border-red-500 text-red-700 p-3\"><p>{uploadError}</p></div>}
                <div>
                    <label htmlFor=\"fileUpload\" className=\"block text-sm font-medium text-gray-700\">Select file</label>
                    <input type=\"file\" id=\"fileUpload\" onChange={handleFileChange} accept=\"image/*,video/*,audio/*\"
                            className=\"mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100\"/>
                    {file && <p className=\"text-xs text-gray-500 mt-1\">Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>}
                </div>
                {file && (
                    <div>
                        <label htmlFor=\"altText\" className=\"block text-sm font-medium text-gray-700\">Alt Text (for images)</label>
                        <input type=\"text\" id=\"altText\" value={altText} onChange={(e) => setAltText(e.target.value)}
                                className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
                    </div>
                )}
                {isUploading && (
                    <div className=\"w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700\">
                        <div className=\"bg-indigo-600 h-2.5 rounded-full\" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                )}
                <button type=\"submit\" disabled={isUploading || !file}
                        className=\"px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50\">
                {isUploading ? `Uploading ${uploadProgress}%...` : 'Upload Media'}
                </button>
            </form>
            </div>
        )}

        {/* Media Grid */}
        <div className=\"bg-white shadow overflow-hidden sm:rounded-lg\">
          <h2 className=\"text-xl font-semibold text-gray-800 p-6 border-b border-gray-200\">Uploaded Media</h2>
          {isLoading && <p className=\"p-6 text-gray-600\">Loading media items...</p>}
          {error && <p className=\"p-6 text-red-600\">Error: {error}</p>}
          {!isLoading && !error && mediaItems.length === 0 && (
            <p className=\"p-6 text-gray-600\">No media items found. (Or API not yet implemented)</p>
          )}
          {!isLoading && !error && mediaItems.length > 0 && (
            <ul className=\"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6\">
              {mediaItems.map((item) => (
                <li key={item._id} className=\"relative group border rounded-lg overflow-hidden shadow-sm\">
                  {item.mediaType === 'image' ? (
                    <Image src={item.url} alt={item.altText || item.fileName} width={200} height={200} className=\"object-cover w-full h-40\" />
                  ) : (
                    <div className=\"w-full h-40 bg-gray-200 flex items-center justify-center\">
                      <span className=\"text-sm text-gray-500 p-2 text-center break-all\">{item.fileName} ({item.mediaType})</span>
                    </div>
                  )}
                  <div className=\"absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex flex-col items-center justify-center p-2\">
                    <p className=\"text-white text-xs break-all opacity-0 group-hover:opacity-100 transition-opacity text-center\">{item.fileName}</p>
                    {canManage && (
                        <button onClick={() => handleDeleteMedia(item)}
                                className=\"mt-2 px-2 py-1 bg-red-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity\">
                        Delete
                        </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
