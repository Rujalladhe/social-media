const logger = require("../utils/logger");
const {authenticateToken} = require("../middleware/authMiddleware");
const express = require("express");
const { uplaodMedia, getAllMedias } = require("../controllers/media-controller");
const multer = require("multer");
const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(), // stores in bufffer in ram 
    limits:{
        fileSize:5*1024*1024 // maz size  5mb,

    },

}).single("file");

router.post(
    "/upload",
    authenticateToken,
    (req,res,next)=>{
        upload(req,res, function(err){
            if(err instanceof multer.MulterError){
                //multer ko erorr mila 
                logger.error("multer error while upliading", err);
                return res.status(400).json({
                    message:"file uploading error" ,
                     success: false,
                     error : err.message,
                });
                
            }
              else if(err) {
                logger .error("unknown error ocurered while uplaidng the file ",err);
                return res.status(500).json({
                    success:false ,
                    message:" unkown error occurect while uploading the file ",
                    error: err.message,
                });
              }
              //if no file is provided 
              if(!res.file){
                return res.status(400).json({
                    message:"no file found",
                    success:"false"
                })
              }
              next();

            

        })
    },
    uplaodMedia
);
//fetch all medais upload by the authenticate user 
router.get("/get",authenticateToken,getAllMedias);
module.exports = router ;