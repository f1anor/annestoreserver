const mongoose = require("mongoose");
const config = require("../config/db");
const autoIncrement = require("mongoose-auto-increment");

//connect to db

mongoose.connect(config.db, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

autoIncrement.initialize(mongoose.connections[0]);

mongoose.connection.on("connected", () => {
  console.info(`Connected to ${config.db}`);
});

mongoose.connection.on("error", (err) => {
  console.info(`DB connection error: ${err}`);
});

module.exports = mongoose;
