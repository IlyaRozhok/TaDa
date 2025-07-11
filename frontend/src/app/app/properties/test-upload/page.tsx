"use client";

import { useAppSelector } from "@/app/store/hooks";
import MediaUpload from "@/app/components/MediaUpload";

export default function TestUploadPage() {
  const { accessToken, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  if (!isAuthenticated || !accessToken) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Test File Upload</h1>
          <p className="text-slate-600">
            Please log in to test file upload functionality.
          </p>
        </div>
      </div>
    );
  }

  const handleMediaUploaded = (media: any) => {
    console.log("Media uploaded:", media);
  };

  const handleMediaDeleted = (mediaId: string) => {
    console.log("Media deleted:", mediaId);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Test S3 File Upload</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Media Files</h2>
          <p className="text-slate-600 mb-4">
            This component demonstrates uploading files to AWS S3 with presigned
            URLs for secure access.
          </p>

          <MediaUpload
            accessToken={accessToken}
            onMediaUploaded={handleMediaUploaded}
            onMediaDeleted={handleMediaDeleted}
            maxFiles={10}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Files are uploaded directly to AWS S3</li>
            <li>• Presigned URLs provide secure access (valid for 1 hour)</li>
            <li>• Supports images and videos up to 10MB each</li>
            <li>• Maximum 10 files per property</li>
            <li>• Files are validated on both frontend and backend</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
