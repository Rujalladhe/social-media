const logger = require('../utils/logger');
const Media = require('../models/media');
const { deleteMediaFromS3 } = require('../utils/s3');

// Helper: extract S3 key from a public S3 URL
const extractKeyFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    const parts = url.split('/');
    return parts.slice(3).join('/');
  } catch (e) {
    return null;
  }
};

const handlePostDel = async (event) => {
  logger.info('media-service: handlePostDel received event -> ' + JSON.stringify(event, null, 2));

  const { postId, userId, mediaIds } = event;
  if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
    logger.info('media-service: no mediaIds to delete for post ' + postId);
    return;
  }

  // Clean IDs to remove extra brackets and quotes
  const cleanIds = mediaIds.map((id) => String(id).replace(/[\[\]"]+/g, ''));

  // Fetch media docs from DB
  const todeleteMedias = await Media.find({ _id: { $in: cleanIds } });
  logger.info('Media documents found:', JSON.stringify(todeleteMedias, null, 2));

  for (const media of todeleteMedias) {
    const fileKey = extractKeyFromUrl(media.url);
    if (!fileKey) {
      logger.error('❌ Missing file key for media: ' + media._id);
      continue;
    }

    logger.info('Deleting file key: ' + fileKey);

    try {
      await deleteMediaFromS3(fileKey);
      logger.info(`✅ Deleted media from S3: ${fileKey}`);
    } catch (e) {
      logger.error('❌ Error deleting media from S3', e);
    }
  }

  // Delete media docs from DB
  await Media.deleteMany({ _id: { $in: cleanIds } });
  logger.info(`✅ Deleted ${cleanIds.length} media documents from DB`);
};

module.exports = { handlePostDel };
