const { S3Client,PutObjectCommand,DeleteObjectCommand} = require("@aws-sdk/client-s3");
const logger = require("./logger");
require("dotenv").config();
//initailze s3 client 
const s3 = new S3Client({
  region: process.env.AWS_REGION, // e.g., "ap-south-1"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const uploadMediaToS3 =(file)=>{
    return new Promise(async(resolve,reject) =>{
        try{
            const params ={
                Bucket: process.env.S3_BUCKET_NAME, // your S3 bucket
        Key: `${Date.now()}_${file.originalname}`, // unique file name
        Body: file.buffer,
        ContentType: file.mimetype,
            };
            const result = await s3.send(new PutObjectCommand(params));
            logger.info("media uplaoded sucessfukly to s3",result);
            //return the file url 
              const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
      resolve({ ...result, url: fileUrl });
        }
        catch(error){
            logger.error("error while uploadinh medai to s3", error);
            reject(error)
        }
    })
};
const deleteMediaFromS3 = async(key)=>{
    try{
        const params ={
               Bucket: process.env.S3_BUCKET_NAME,
      Key: key, // filename used during upload
        };
        const result = await s3.send(new DeleteObjectCommand(params));
        logger.info("post delted sucessfullu",key);

    }
    catch(error){
        logger.error("error deleting media form s3",error);
        throw error ;

    }
};
module.exports = {
    uploadMediaToS3 , deleteMediaFromS3
}