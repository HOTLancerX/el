import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generatePresignedUploadUrl } from '@/lib/r2-client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  // Ensure user is authenticated and has appropriate role (e.g., admin, editor, author)
  if (!session || !['admin', 'editor', 'author'].includes(session.user?.role || '')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fileName, fileType, fileSize } = await req.json();

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json({ message: 'Missing fileName, fileType, or fileSize' }, { status: 400 });
    }

    if (typeof fileSize !== 'number' || fileSize <= 0) {
        return NextResponse.json({ message: 'Invalid fileSize' }, { status: 400 });
    }


    const { signedUrl, uniqueKey, publicUrl } = await generatePresignedUploadUrl(fileName, fileType, fileSize);

    return NextResponse.json({ signedUrl, uniqueKey, publicUrl });

  } catch (error: any) {
    console.error('Error in presign route:', error);
    // Check for specific error messages from generatePresignedUploadUrl (like file size/type)
    if (error.message.includes('File size exceeds') || error.message.includes('File type') || error.message.includes('not allowed')) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error generating presigned URL', error: error.message }, { status: 500 });
  }
}
