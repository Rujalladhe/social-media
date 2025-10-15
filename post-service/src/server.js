require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const helmet = require("helmet");

const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const   mongoose = require("mongoose");
const postRoutes = require("./routes/post-routes");
const { connectToRabbitMQ } = require("./utils/rabbitmq");

const app = express();
const PORT = process.env.PORT || 3002;


app.use(helmet());
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URL)
.then(()=> logger.info("connected to monogoDb"))
.catch((e)=> logger.error("mongo connection error",e));
const redisClient = new Redis(process.env.REDIS_URL);

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});
// routes => pass redis client 
app.use("/api/posts" ,(req,res,next)=>{
    req.redisClient = redisClient
    next();

}, postRoutes)
app.use(errorHandler);
async function startServer(){
  try{
    await connectToRabbitMQ();
    app.listen(PORT,()=>{
      logger.info(`coonected post-service server ${PORT}`);
    })}
    catch(err){
      logger.error('falied to connect to post service ',err)
      process.exit(1);
    }
  
}
startServer();
