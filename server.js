require("dotenv").config();
const express = require('express');
const server = express();
const path = require('path');
const router = require('./route/route');
const mongoose = require('mongoose');


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
server.use('/students/',router);
server.use(express.static(path.join(__dirname,'../Public')));








server.listen(8080,()=>{
    console.log("server is on.");
})  