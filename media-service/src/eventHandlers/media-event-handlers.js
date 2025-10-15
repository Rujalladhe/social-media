const logger = require('../utils/logger');

const handlePostDel = async (event) => {
    console.log("handlePostDel event:", event);
    try {
        // Use logger so logs include service/timestamp and are consistent with other logs
        logger.info('media-service: handlePostDel received event -> ' + JSON.stringify(event, null, 2));
        // TODO: implement media cleanup logic here (e.g. delete from S3, DB updates)
    } catch (err) {
        // Fallback if event cannot be stringified
        logger.error('media-service: handlePostDel error while logging event', err);
        logger.info('media-service: handlePostDel received event (raw) -> ' + event);
    }
}
module.exports = { handlePostDel };