require("dotenv").config();
const express = require('express');
const server = express();
const path = require('path');
const mongoose = require('mongoose');
const router = require(
    path.resolve(__dirname,'./src/route/route.js')
);


main().catch(err => console.log(err));
async function main() {
  const uri = `mongodb://luckysahu:${process.env.DB_PASSWORD}@ac-8wsvz0i-shard-00-00.zhwshrk.mongodb.net:27017,ac-8wsvz0i-shard-00-01.zhwshrk.mongodb.net:27017,ac-8wsvz0i-shard-00-02.zhwshrk.mongodb.net:27017/UniversityData?ssl=true&replicaSet=atlas-rz973o-shard-0&authSource=admin&appName=Cluster0`;
  await mongoose.connect(uri);
  console.log("DB is connected");
}  
 
 
// middle were 
const cors = require('cors');
server.use(cors());
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(express.static(path.join(__dirname,'./public')));
server.use('/',router);



 




server.listen(8080,()=>{
    console.log("server is on.");
})  