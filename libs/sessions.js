const express = require("express");
const Session = require("../models/session-model");
const passport = require("passport");

const app = express();

// Куки для сессий
module.exports =
  (passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { sid } = req.signedCookies;

    if (!sid) {
      const { user } = req;
      const ans = await Session.setNewSession(
        req.clientIp,
        user,
        req.useragent.platform,
        req.useragent.browser,
        req.headers.referrer
      );
      res.cookie("sid", ans._id, { signed: true });
    }
    next();
  });
