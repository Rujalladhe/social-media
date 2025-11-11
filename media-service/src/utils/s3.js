const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const FileType = require('file-type');
const logger = require('./logger');
require('dotenv').config();

// ===========================
// Initialize S3 Client
// ===========================
const s3 = new S3Client({
  region: process.env.AWS_REGION, // e.g., "ap-south-1"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ===========================
// Upload File to S3
// ===========================
const uploadMediaToS3 = async (file) => {
  try {
    logger.info('Uploading to S3 starting...');

    if (!file || !file.buffer) {
      throw new Error('No file provided for upload');
    }

    // Step 1: Detect the actual file type
    const detectedType = await FileType.fromBuffer(file.buffer);

    // Use detected type or fallback
    const mimeType = detectedType ? detectedType.mime : file.mimetype || 'application/octet-stream';

    const extension = detectedType ? detectedType.ext : file.originalname.split('.').pop() || 'bin';

    logger.info('Detected file type for upload', { detectedType, mimeType, extension });

    // Step 2: Build unique file name (ensure proper extension)
    const timestamp = Date.now();
    const safeOriginal = (file.originalname || 'upload').replace(/\s+/g, '_');
    const hasDot = safeOriginal.includes('.');
    const base = hasDot ? safeOriginal.substring(0, safeOriginal.lastIndexOf('.')) : safeOriginal;
    const finalExt =
      extension || (hasDot ? safeOriginal.substring(safeOriginal.lastIndexOf('.') + 1) : 'bin');
    const finalFileName = `${timestamp}_${base}.${finalExt}`;

    // Step 3: S3 upload params
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: finalFileName,
      Body: file.buffer,
      ContentType: mimeType,
      ContentDisposition: 'inline', // open directly in browser
      CacheControl: 'public, max-age=31536000, immutable',
    };

    // Step 4: Upload to S3
    const result = await s3.send(new PutObjectCommand(params));

    logger.info('Media uploaded successfully to S3', {
      key: finalFileName,
      contentType: mimeType,
      s3Response: result.$metadata,
    });

    // Step 5: Construct public URL
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${finalFileName}`;

    return { ...result, url: fileUrl, key: finalFileName };
  } catch (error) {
    logger.error('Error while uploading media to S3', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

// ===========================
// Delete File from S3
// ===========================
const deleteMediaFromS3 = async (key) => {
  try {
    if (!key) {
      throw new Error('File key is required for deletion');
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    };

    const result = await s3.send(new DeleteObjectCommand(params));

    logger.info('File deleted successfully from S3', { key });
    return result;
  } catch (error) {
    logger.error('Error deleting media from S3', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = {
  uploadMediaToS3,
  deleteMediaFromS3,
};
