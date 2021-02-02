const express = require("express");
const router = express.Router();
const passport = require("passport");

const Admin = require("../models/admin-model");

router.get("/admins", async (req, res) => {
  const { page = 1, status } = req.query;
  const message = [];

  const ans = await Admin.getAdmins(
    status !== undefined ? { status: !!+status } : {}
  ).catch((err) => {
    console.log(err);
    message.push(err.message);
    return;
  });

  if (message.lenght > 0) {
    res.json({
      status: 1,
      message: message[0],
    });
    return;
  }

  res.json({ status: 0, admins: ans });
});

router.put(
  "/setstatus",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { user } = req;
    const { status, id } = req.body;
    const message = [];

    const admin = await Admin.getAdmin(id).catch((err) => {
      message.push(err.message);
      return;
    });

    if (!admin) {
      message.push("Ошибка: Администратор не найден в базе данных");
    }

    if (!user.root) {
      message.push("Ошибка: Администратор не обладает ROOT правами");
    }

    let ans;
    if (message.length === 0) {
      ans = await Admin.setStatus(admin, status).catch((err) => {
        message.push(err.message);
        return;
      });
    }

    if (!ans) {
      message.push(
        "Ошибка: Не удалось сохранить изменения. Обратитесь к администратору"
      );
    }

    if (message.length > 0) {
      res.json({
        status: 1,
        message: message[0],
      });
      return;
    }

    res.json({
      status: 0,
    });
  }
);

module.exports = router;
