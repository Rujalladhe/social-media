const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
// this create a genrate token

const genrateToken = async (user) => {
  //acesstoken in this username should be  for the sort term in case if it in bad hands it will be less for the less alsomt 60 min

  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
      role: user.role,
      lat: user.lat,
      lng: user.lng,
    },
    process.env.JWT_SECRET,
    { expiresIn: '100m' }
  );
  //refreshtoken is sotred in db for large time
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // expires after 7 days
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });
  return { accessToken, refreshToken };
};
module.exports = genrateToken;
