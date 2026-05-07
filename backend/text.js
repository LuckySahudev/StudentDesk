require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const server = express();
const path = require("path");
const router = require("./route/route");
const mongoose = require("mongoose");

async function main() {
  try {
    const uri =
      `mongodb+srv://luckysahu:${process.env.DB_PASSWORD}` +
      `@cluster0.zhwshrk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (err) {
    console.log("Mongo Error:", err);
  }
}

main();

server.use(express.json());
server.use("/students", router);
server.use(express.static(path.join(__dirname, "../Public")));

server.listen(8080, () => {
  console.log("server is on");
});