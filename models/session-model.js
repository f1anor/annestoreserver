const mongoose = require("../libs/mongoose");

const SessionSchema = new mongoose.Schema({
  date: {
    type: Number,
    default: Date.now(),
  },
  ip: {
    type: String,
    require: false,
  },
});

const Session = (module.exports = mongoose.model("Session", SessionSchema));

module.exports.setNewSession = async (ip) => {
  const newSession = new Session({
    ip,
  });
  return await newSession.save();
};

module.exports.getSessions = async (range) => {
  return await Session.find(range).sort({ date: -1 });
};

module.exports = Session;
