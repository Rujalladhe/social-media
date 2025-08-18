const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const generateToken = require("../utils/genrateToken");
const logger = require("../utils/logger");
const { validateRegistration, validatelogin } = require("../utils/validation");
//user registration 
 const registerUser = async ( req , res ) =>{
    logger.info("registration point hit ");
    //validate schema 
    try {
           const {error} = validateRegistration(req.body);
           if(error) {
            logger.warn("vallidation error",error.details[0].message )
            return res.status(400).json({
                success:false ,
                message : error.details[0].message ,

            }


            )

           }
           const {email,username,password} = req.body;
           let user = await User.findOne({$or: [{email},{username}]});
           if(user){
             logger.warn("user laready exsist");
             return res.status(400).json({
                success:false,
                message:"user already exixst",
             })
           }
           user = new User({username,password,email});
           await user.save();
           logger.warn("user saved sucessfully",user._id);
           const {accessToken,refreshToken} = await generateToken(user);
           res.status(201).json({
            success:true,
            message:"user registerd succesfully",
            accessToken,
            refreshToken,

           })
           

    }
    catch(e){
        logger.error("registrain error ocurred ",e);
        res.status(500).json({
            sucess:false,
            message:"internal server error",

        });



    }
 };
 //user login 
 const loginUser = async(req,res)=>{
    logger.info("login end point hit ");
    try {
        const {error} = validatelogin(req.body);
        if(error){
            logger.warn("validatipn error", error.details[0].message);
            return res.status(404).json({
            success:false,
            message:error.details[0].message})

        }
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            logger.warn("invalid user");
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials"
            });
        }
        // Check if password is valid
        const isValid = await user.comparePassword(password);
        if(!isValid){
            logger.warn("invalid password");
            return res.status(400).json({
                success:false,
                message:"invalid password",
            })
        }
        //lets genrate newwww accesstoken and refreshtoken 
        const {accessToken , refreshToken} = await generateToken(user);
        res.json({
            accessToken,
            refreshToken,
            userId : user._id,

        });
        
    }

    catch(e){
        logger.error("login erro occured" , e);
        res.status(500).json({
            success:true,
            message:"internal server occured",
        })

    }
}
    //refresh token 
    const handleRefreshToken = async (req, res) => {
        logger.info("refresh token endpoint hit");
        try {
            const { token } = req.body;
            if (!token) {
                logger.warn("refresh token missing");
                return res.status(400).json({
                    success: false,
                    message: "Refresh token is required"
                });
            }

            const storedToken = await RefreshToken.findOne({ token });
            if (!storedToken || storedToken.expiresAt < new Date()) {
                logger.warn("invalid or expired refresh token");
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired refresh token"
                });
            }

            const user = await User.findById(storedToken.user);
            if (!user) {
                logger.warn("user not found");
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateToken(user);
            // Delete the old refresh token
            await RefreshToken.deleteOne({ _id: storedToken._id });
            res.json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            });
        }
        catch(error){
            logger.error("refresh token error occured ", error);
            res.status(500).json({
                success:false,
                message:"internal server error",

            })

        }

    }

 
const logoutUser = async (req, res) => {
  logger.info("Logout endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

   const storedToken = await RefreshToken.findOneAndDelete({
      token: refreshToken,
    });
    if (!storedToken) {
      logger.warn("Invalid refresh token provided");
      return res.status(400).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
    logger.info("Refresh token deleted for logout");

    res.json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (e) {
    logger.error("Error while logging out", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
module.exports = { 
    registerUser, 
    loginUser, 
    refreshToken: handleRefreshToken,
    logoutUser 
};