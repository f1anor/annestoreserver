const mongoose = require("../libs/mongoose");

const SessionSchema = new mongoose.Schema({
  session: {
    type: Object,
    require: true,
  },
});

const Session = (module.exports = mongoose.model("Session", SessionSchema));

module.exports.getSessions = async (range) => {
  return await Session.find(range).sort({ date: -1 });
};

module.exports = Session;
