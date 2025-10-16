const logger = require('../utils/logger')
const  authenticateRequest = (req,res,next)=>{
    const userId = req.headers["x-user-id"];
    if(!userId) {
        logger.warn(  ` access attempted wothout userid`);
        return res.status(401).json({
         success:false ,
          message: " authentication required plase login to continue"
        })

    }
    
    req.user = {userId};
    next();

}
module.exports ={ authenticateRequest}