/**
 * Cloudinary Configuration
 * Cloud storage for medical result file uploads
 */

import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiOptions } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djxbkf1q7',
  api_key:    process.env.CLOUDINARY_API_KEY    || '513285557498239',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Cfqx4HLGAu0nDATkHXut__8Q6j8',
  secure: true,
});

/**
 * Upload a file buffer to Cloudinary via upload stream
 */
export function uploadToCloudinary(
  buffer: Buffer,
  options: UploadApiOptions
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) return reject(error ?? new Error('No result from Cloudinary'));
      resolve({ secure_url: result.secure_url, public_id: result.public_id });
    });
    Readable.from(buffer).pipe(stream);
  });
}

/**
 * Delete a file from Cloudinary by public_id.
 * resource_type must match how the file was uploaded ('image' or 'raw' for PDFs).
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'raw' = 'image',
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export default cloudinary;
