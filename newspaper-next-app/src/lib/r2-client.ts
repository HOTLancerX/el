import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto'; // For generating unique enough file names

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
export const R2_PUBLIC_URL_PREFIX = process.env.R2_PUBLIC_URL_PREFIX?.replace(/\/$/, ''); // Remove trailing slash

if (!R2_BUCKET_NAME || !R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL_PREFIX) {
  console.error("Cloudflare R2 environment variables are not fully configured. Some R2 operations may fail.");
  // Consider throwing an error if these are absolutely critical for module initialization
  // throw new Error("Cloudflare R2 environment variables are not fully configured.");
}

const S3 = new S3Client({
  region: 'auto', // R2 specific setting
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!, // Non-null assertion: we expect these to be set
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

export const generatePresignedUploadUrl = async (fileName: string, fileType: string, fileSize: number) => {
  if (!R2_BUCKET_NAME || !R2_ACCESS_KEY_ID) { // Check essential vars for this function
    throw new Error('R2 configuration for generating presigned URL is incomplete.');
  }

  // Basic validation for file size (e.g., max 10MB)
  const MAX_FILE_SIZE_MB = 10;
  if (fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
  }

  // Basic validation for file type (example: allow only common image types)
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    throw new Error(`File type '${fileType}' is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}.`);
  }


  const randomSuffix = crypto.randomBytes(8).toString('hex');
  // Sanitize baseName: remove special characters except hyphen and underscore
  const baseName = fileName.substring(0, fileName.lastIndexOf('.'))
                           .toLowerCase()
                           .replace(/\s+/g, '-')
                           .replace(/[^a-z0-9\-_]/g, '');
  const fileExtension = fileType.split('/')[1] || 'bin'; // Get extension from MIME type

  const uniqueKey = `uploads/${baseName || 'file'}-${randomSuffix}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: uniqueKey,
    ContentType: fileType,
    // ContentLength: fileSize, // Recommended to include if known
  });

  try {
    const signedUrl = await getSignedUrl(S3, command, { expiresIn: 60 * 5 }); // URL expires in 5 minutes
    return { signedUrl, uniqueKey, publicUrl: `${R2_PUBLIC_URL_PREFIX}/${uniqueKey}` };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Could not generate presigned URL for upload.');
  }
};

export const deleteR2Object = async (objectKey: string) => {
    if (!R2_BUCKET_NAME || !R2_ACCESS_KEY_ID) {
        throw new Error('R2 configuration for deleting object is incomplete.');
    }
    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
    });
    try {
        await S3.send(command);
        console.log(`Successfully deleted ${objectKey} from R2 bucket ${R2_BUCKET_NAME}.`);
        return true;
    } catch (error) {
        console.error(`Failed to delete object ${objectKey} from R2:`, error);
        // Don't re-throw here if you want to allow the DB record to be deleted even if R2 deletion fails
        // Or, handle this in the calling function. For now, just logging and returning false.
        return false;
    }
};
