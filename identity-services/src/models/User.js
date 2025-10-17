const mongoose = require("mongoose");
const argon2 = require("argon2");
const userSchema = new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            trim:true,


        },
        email:{
            type:String,
            required:true,
            unique:true,
            trim:true,
            lowercase:true,


        },
        password:{
            type:String,
            required:true,

        },
        createdAt:{
            type:Date,
            default:Date.now,
        },
        role:{
            enum:["user","vendor","rider"],
            type:String,
            default:"user",
        },
        lat:{
            type:Number,
            default:0,
            required:false,
        },
        lng:{
            type:Number,
            default:0,
            required:false,
        }
      
    }
);

//save karbe ke pahile ye hash karta hai 
userSchema.pre("save",async function (next) {
    if(this.isModified("password")){
        try{
            this.password = await argon2.hash(this.password);

        }
        catch(error){
            return next(error);
        }
    }
    
})
userSchema.methods.comparePassword = async function(candidatePassword){
    try {
        return await argon2.verify(this.password , candidatePassword);

    }catch(error){
        throw error;

    }
}
//means usercan search using username 

userSchema.index({username:"text"});
const User = mongoose.model("user",userSchema)
module.exports = User;