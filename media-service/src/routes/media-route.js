const logger = require('../utils/logger');
const { validateToken } = require('../middleware/authMiddleware');
const express = require('express');
const { uplaodMedia, getAllMedias } = require('../controllers/media-controller');
const multer = require('multer');
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(), // stores in bufffer in ram
  limits: {
    fileSize: 5 * 1024 * 1024, // maz size  5mb,
  },
}).any();

router.post(
  '/upload',
  validateToken,
  (req, res, next) => {
    logger.info('/api/media/upload route hit');
    const ct = req.headers['content-type'] || '';
    logger.info(`Incoming Content-Type: ${ct}`);

    // Case 1: multipart → use multer
    if (ct.startsWith('multipart/form-data')) {
      return upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
          logger.error('multer error while upliading', err);
          return res.status(400).json({
            message: 'file uploading error',
            success: false,
            error: err.message,
          });
        } else if (err) {
          logger.error('unknown error ocurered while uplaidng the file ', err);
          return res.status(500).json({
            success: false,
            message: ' unkown error occurect while uploading the file ',
            error: err.message,
          });
        }
        if (!req.file && Array.isArray(req.files) && req.files.length > 0) {
          req.file = req.files[0];
        }
        if (Array.isArray(req.files)) {
          logger.info(`Received files count: ${req.files.length}`);
        }
        return next();
      });
    }

    // Case 2: raw/binary or missing content-type → parse raw and build req.file
    if (ct.startsWith('application/octet-stream') || ct === '') {
      return express.raw({ type: () => true, limit: '10mb' })(req, res, () => {
        const bodyBuffer = req.body;
        if (!(bodyBuffer && Buffer.isBuffer(bodyBuffer) && bodyBuffer.length > 0)) {
          return res.status(400).json({ success: false, message: 'no file found' });
        }

        // Heuristic: if the raw buffer actually contains multipart content, extract the first part
        const asString = bodyBuffer.toString('latin1');
        if (asString.startsWith('--') && asString.includes('Content-Disposition')) {
          try {
            const firstLineEnd = asString.indexOf('\r\n');
            const boundary = asString.substring(2, firstLineEnd); // without leading '--'
            const headersStart = firstLineEnd + 2; // skip CRLF
            const headerEndMarker = '\r\n\r\n';
            const headersEnd = asString.indexOf(headerEndMarker, headersStart);
            const headersText = asString.substring(headersStart, headersEnd);
            const dispMatch = headersText.match(
              /Content-Disposition:.*name="([^"]+)";\s*filename="([^"]+)"/i
            );
            const typeMatch = headersText.match(/Content-Type:\s*([^\r\n]+)/i);
            const filename = dispMatch ? dispMatch[2] : 'upload';
            const partMime = typeMatch ? typeMatch[1].trim() : 'application/octet-stream';
            const contentStart = headersEnd + headerEndMarker.length;
            const boundaryTerminator = '\r\n--' + boundary;
            const contentEnd = asString.indexOf(boundaryTerminator, contentStart);
            const fileSlice = bodyBuffer.subarray(contentStart, contentEnd);
            req.file = {
              originalname: filename,
              mimetype: partMime,
              buffer: fileSlice,
            };
            logger.info(
              `Extracted file from raw-multipart: name=${filename}, type=${partMime}, size=${fileSlice.length}`
            );
            return next();
          } catch (e) {
            logger.warn('Failed to extract multipart from raw; falling back to octet-stream', e);
          }
        }

        // Fallback: treat entire buffer as the file
        const mime = ct || 'application/octet-stream';
        req.file = {
          originalname: 'upload.bin',
          mimetype: mime,
          buffer: bodyBuffer,
        };
        logger.info(
          `Constructed req.file from raw: type=${req.file.mimetype}, size=${req.file.buffer.length}`
        );
        return next();
      });
    }

    // Case 3: let controller handle JSON fallback if applicable
    return next();
  },
  uplaodMedia
);
//fetch all medais upload by the authenticate user
router.get('/', validateToken, getAllMedias);
module.exports = router;
