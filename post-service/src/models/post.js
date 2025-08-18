const mongoose = require("mongoose");
const postSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
         required:true 
      },
      content :{
        type: String ,
        required:true
      },
      medialUrls:[
        {
            type:String
        }
      ],
      createdAt:{
        type:Date,
        default:Date.now

      },},
      
 {Timestamp: true})
 postSchema.index({
    content : 'text'
 })

 const Post = mongoose.model("Post",postSchema)
 module .exports = Post