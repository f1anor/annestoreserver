"use strict";

const db = require("../config/db");
const secret = require("../config/secret");
const Admin = require("../models/admin-model");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

module.exports = (passport) => {
  const opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = secret;

  const strategy = new JwtStrategy(opts, async function (jwt_payload, next) {
    // console.log("payload received", jwt_payload);
    // usually this would be a database call:
    const user = await Admin.findById(jwt_payload._id);
    if (user) {
      next(null, user);
    } else {
      next(null, false);
    }
  });

  passport.use("jwt", strategy);
};
