// dependencies
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();

// mongo client
const mongoClient = new MongoClient(process.env.MONGODB_CLIENT);
// redis client
const redisClient = require("redis").createClient(process.env.REDIS_CLIENT);

// connection function

const main = async () => {
  try {
    await mongoClient.connect();
    await redisClient.connect();

    // redis database data collection
    const redisData = mongoClient.db("big-json").collection("data");

    // get all users
    app.get("/user", async (req, res) => {
      const user = await cachedGetData("user", async () => {
        const newUser = await redisData.find({}).toArray();
        return newUser;
      });
      res.json(user);
    });

    // get single user
    app.get("/user/:id", async (req, res) => {
      const id = req.params.id;
      const user = await cachedGetData(`user/:${id}`, async () => {
        const newUser = await redisData.findOne({ _id: ObjectId(id) });
        return newUser;
      });
      res.json(user);
    });
  } catch (error) {
    console.log(error);
  }
};

main();

const cachedGetData = async (key, callback) => {
  const userData = await redisClient.get(key);
  if (userData) {
    return JSON.parse(userData);
  } else {
    const users = await callback();
    redisClient.setEx(key, 3600, JSON.stringify(users));
    return users;
  }
};

// listening app
app.listen(3000, async () => {
  console.log("Example app listening on port 3000");
});
