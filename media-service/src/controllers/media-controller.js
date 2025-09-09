const Media = require("../models/media");
const {deleteMediaFromS3,uploadMediaToS3} = require("../utils/s3")
const logger = require("../utils/logger");
const { useRef } = require("react");
const { get } = require("mongoose");
const uplaodMedia = async(req,res)=>{
    logger.info("starting medai uplaod");
    try{
        console.log(req.file,"req.file");
        if(!req.file){
            logger.error("there is no file file please try agaian")
            return res.status(400).json({
                message:"no file found",
                success:false,
            })
        }
            const { originalname, mimetype, buffer } = req.file;
            const userId = req.user.userId;
               logger.info(`File details: name=${originalname}, type=${mimetype}`);
    logger.info("Uploading to S3 starting...");
    //upload to s3 
    const s3uploadResult = await uploadMediaToS3(req.file);
    logger.info(`s3 uplod scucesfill file url ${s3uploadResult.url}`)
    const newlyCreatedMedia = new Media({
     publicId: s3uploadResult.Key, // store S3 key for deletion
      originalName: originalname,
      mimeType: mimetype,
      url: s3uploadResult.url, // S3 file URL
      userId,
    });
    await newlyCreatedMedia.save();
    res.status(201).json({
        success:true,
        message:"media uploaded sucessfully",
        url:newlyCreatedMedia.url,
        medaiId:newlyCreatedMedia._id,
    });
      } catch (error) {
    logger.error("Error creating media", error);
    res.status(500).json({
      success: false, 
      message: "Error creating media",
    });
  }
};
    const getAllMedias = async(req,res)=>{
        try{
            const result = await Media.find({userId:req.user.userId});
            if(result.length === 0){
                return res.status(404).json({
                    message:"cant fine the miea for this user",
                    success:false,
                })
            }
            res.status(200).json({
                success:true,
                Media: result,

            });
            
        }

        catch(error){
            logger.info("error fetching ,",error);
            res.status(500).json({
                success:false,
                message:"error fetching media",
            })

        }
        
    }


    
module.exports={uplaodMedia,getAllMedias}
