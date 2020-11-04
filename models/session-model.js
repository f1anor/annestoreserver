const mongoose = require("../libs/mongoose");

const SessionSchema = new mongoose.Schema({
  date: {
    type: Number,
    default: Date.now(),
  },
});

const Session = (module.exports = mongoose.model("Session", SessionSchema));

module.exports.setNewSession = async () => {
  const newSession = new Session();
  return await newSession.save();
};

module.exports.getSessions = async (range) => {
  return await Session.find(range).sort({ date: -1 });
};

module.exports = Session;
