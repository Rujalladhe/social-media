const Media = require("../models/media");
const { deleteMediaFromS3, uploadMediaToS3 } = require("../utils/s3");
const logger = require("../utils/logger");

// ============================
// Upload Media
// ============================
const uplaodMedia = async (req, res) => {
  logger.info("starting media upload");
  try {
    logger.info(`Upload request Content-Type: ${req.headers["content-type"]}`);

    if (Array.isArray(req.files)) {
      logger.info(`req.files length: ${req.files.length}`);
    }

    if (req.file) {
      logger.info(
        `req.file present: name=${req.file.originalname}, type=${
          req.file.mimetype
        }, size=${req.file.buffer ? req.file.buffer.length : "n/a"}`
      );
    } else {
      logger.info("req.file is undefined");
    }

    // Handle Base64 upload fallback (for JSON body uploads)
    if (!req.file) {
      const isJsonBody = req.is && req.is("application/json");
      if (
        isJsonBody &&
        req.body &&
        req.body.fileBase64 &&
        req.body.fileName &&
        req.body.mimeType
      ) {
        const base64String = req.body.fileBase64.includes(",")
          ? req.body.fileBase64.split(",")[1]
          : req.body.fileBase64;
        const buffer = Buffer.from(base64String, "base64");
        req.file = {
          originalname: req.body.fileName,
          mimetype: req.body.mimeType,
          buffer,
        };
        logger.info(
          `Constructed req.file from JSON: name=${req.file.originalname}, type=${req.file.mimetype}, size=${req.file.buffer.length}`
        );
      } else {
        logger.error("No file found in request");
        return res.status(400).json({
          message: "No file found",
          success: false,
        });
      }
    }

    const { originalname, mimetype } = req.file;
    const userId = req.user.userId;

    logger.info(`File details: name=${originalname}, type=${mimetype}`);
    logger.info("Uploading to S3 starting...");

    // Upload to S3
    const s3uploadResult = await uploadMediaToS3(req.file);
    logger.info(`S3 upload successful. File URL: ${s3uploadResult.url}`);

    // Save media in MongoDB
    const newlyCreatedMedia = new Media({
      publicId: s3uploadResult.Key, // store S3 key for deletion
      originalName: originalname,
      mimeType: mimetype,
      url: s3uploadResult.url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      url: newlyCreatedMedia.url,
      mediaId: newlyCreatedMedia._id,
    });
  } catch (error) {
    logger.error("Error creating media", error);
    res.status(500).json({
      success: false,
      message: "Error creating media",
    });
  }
};

// ============================
// Get All Medias
// ============================
const getAllMedias = async (req, res) => {
  try {
    const result = await Media.find({ userId: req.user.userId });
    if (result.length === 0) {
      return res.status(404).json({
        message: "No media found for this user",
        success: false,
      });
    }

    res.status(200).json({
      success: true,
      media: result,
    });
  } catch (error) {
    logger.error("Error fetching media", error);
    res.status(500).json({
      success: false,
      message: "Error fetching media",
    });
  }
};

// ============================
// Delete Media
// ============================
const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params; // The media ID from the URL
    const userId = req.user.userId;

    logger.info(`Deleting media with id=${id} for user=${userId}`);

    // 1️⃣ Find the media document
    const media = await Media.findOne({ _id: id, userId });
    if (!media) {
      logger.error("Media not found or unauthorized access");
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

   

    res.status(200).json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting media", error);
    res.status(500).json({
      success: false,
      message: "Error deleting media",
    });
  }
};

module.exports = { uplaodMedia, getAllMedias, deleteMedia };
