const logger  = require('../utils/logger')
const Post = require('../models/post');
const { publishEvent } = require('../utils/rabbitmq');
const isValidCache = async(req,input) =>{
     const cachedKey = `post:${input}`
     await req.redisClient.del(cachedKey);
     const keys = await req.redisClient.keys("posts:*");
     if(keys.length>0){
      await req.redisClient.del(keys)
     }

}
const createpost = async (req, res) => {
  try {
    const { content, mediaUrls, shop } = req.body;

    // Expecting 'shop' object to contain:
    // shopName, ownerName, category, location, products (with name, price, imageUrl, mediaId)
    const newPost = new Post({
      user: req.user.userId,
      content,
      medialUrls: mediaUrls || [],
      shop: shop || null
    });

    await newPost.save();

    // Clear cache for this post
    if (typeof isValidCache === "function") {
      await isValidCache(req, newPost._id.toString());
    }

    logger.info("Post created successfully");
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newPost
    });

  } catch (e) {
    logger.error("Error creating new post", e);
    res.status(500).json({
      message: "Error in posting",
      success: false
    });
  }
};

const getAllPosts = async(req,res)=>{
    try{
    const limit = req.query.limit||10;
    const page = req.query.page||1;
    const cacheKey = `posts:${page}:${limit}`;
    const cachedPost = await req.redisClient.get(cacheKey);
    const startIndex = (page-1)*limit;
    if(cachedPost){
        return res.json(JSON.parse(cachedPost));

    }
    const posts = await Post.find({}).sort({createdAt:-1}).skip(startIndex).limit(limit);
    const totalNoOfPosts = await Post.countDocuments();
    const result ={
        posts,
        currentpage:page,
        totalPages:Math.ceil(totalNoOfPosts/limit),
        limit
    }
//save post in redis client 
    await req.redisClient.setex(cacheKey,300,JSON.stringify(result));
    res.json(result)
    }
    catch(e){
        logger.error("error fetchg post",e)
        res.status(500).json({

            success:false,
            message:"error feetching posts"
        });
    }

}
const getPost = async(req,res)=>{
    try{
    
    const postId = req.params.id;
    const cacheKey =   `post:${postId}`;
    const chachedPost = await req.redisClient.get(cacheKey)
    if(chachedPost){
        return res.json(JSON.parse(chachedPost))

    }
    const postbyid = await Post.findById(postId);
    if(!postbyid) {
        return res.status(404).json({
            message:false,
            success:false,
        })
    }
    await req.redisClient.setex(
        cacheKey,
        3600,
        JSON.stringify(postbyid)
    )
      return res.json(postbyid)
}
catch(e){
    logger.error("errore fetichh the posts",e);
    res.status(500).json({
        message:"error fethcing the posts",
        success:false
    })
}

    



}
const deletepost = async(req,res)=>{
    try{
    const postId = req.params.id;
    await isVlaidCache(req,postId);
     const delPost = await Post.findByIdAndDelete(postId);
     if(!delPost){
         return res.status(401).json({
            message:"post not found",
            success:false
        })
     }
    // Publish delete event so other services can react (use the deleted document values)
    try {
        const payload = {
            postId: delPost._id.toString(),
            userId: req.user.userId,
            mediaIds: delPost.medialUrls || []
        };
        logger.info('about to publish post.deleted payload -> ' + JSON.stringify(payload));
        await publishEvent('post.deleted', payload);
        logger.info('published post.deleted event for post ' + delPost._id.toString());
    } catch (pubErr) {
        // Log publish errors but continue — the post was already deleted from DB
        logger.error('failed to publish post.deleted event', pubErr);
    }

    return res.status(202).json({
        message:"post deleted sucesfully",
        success:true,

    });
    }
    catch(e){
        logger.error("errir in delting ",e);
        res.status(500).json({
            message:"error delting the post",
            success:false
        })
    }

}
 



module.exports = {createpost,getAllPosts,getPost,deletepost}