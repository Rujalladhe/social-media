const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  content: {
    type: String,
    required: true
  },
  // Optional images for the post itself
  medialUrls: [
    { type: String }
  ],
  
  // ===== SHOP INFO =====
  shop: {
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    category: { type: String, required: true }, // e.g., grocery, food, etc.
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    products: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        imageUrl: { type: String, required: true }, // URL from Media service
        mediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", required: false } // optional, can store media ID
      }
    ]
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Full text search on content
postSchema.index({ content: 'text' });

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
