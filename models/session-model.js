const mongoose = require("../libs/mongoose");

const SessionSchema = new mongoose.Schema({
  date: {
    type: Number,
    default: Date.now(),
  },
  type: {
    type: Number,
    default: 0,
  },
  ip: {
    type: String,
    require: false,
  },
  platform: {
    type: String,
    default: "",
  },
  referrer: {
    type: String,
    default: "",
  },
});

const Session = (module.exports = mongoose.model("Session", SessionSchema));

module.exports.setNewSession = async (
  ip,
  user,
  platform,
  browser,
  referrer
) => {
  let type = 0;
  if (!!user && user.hasOwnProperty("status")) {
    type = 1;
  } else if (!!user) {
    type = 2;
  }

  const newSession = new Session({
    date: Date.now(),
    ip,
    type,
    platform: `${browser} на ${platform}`,
    referrer: referrer,
  });

  return await newSession.save();
};

module.exports.getSessions = async (range) => {
  return await Session.find(range).sort({ date: -1 });
};

module.exports = Session;
