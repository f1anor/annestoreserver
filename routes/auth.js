const express = require("express");
const passport = require("passport");
const router = express.Router();
const jwt = require("jsonwebtoken");
const secret = require("../config/secret");
const Admin = require("../models/admin-model");
const comparePass = require("../libs/bcrypt").comparePasswords;
const multer = require("multer");
const upload = multer();
const multerConfig = require("../config/multer");

const { getPass, getNullImg } = require("../utlis/utils");

const {
  removeFilesFromFolder,
  saveConvertedImg,
  mkDir,
  saveFile,
} = require("../libs/fileporvider");

router.post("/preloadimg/:name", upload.single("myImage"), async (req, res) => {
  const message = [];
  const { name } = req.params;

  const fileParams = {
    filename: `tmp_${name}`,
    path: `${multerConfig.tmpImgs}/${name}`,
  };

  console.log(name, fileParams);

  const remove = await removeFilesFromFolder(fileParams.path).catch((err) => {
    message.push(err.message);
  });
  if (!remove) {
    message.push("Ошибка: Не удалось завершить операцию");
  }

  let file;
  if (message.length === 0) {
    file = await saveFile(req, fileParams).catch((err) => {
      message.push(err.message);
      return;
    });

    if (!file) {
      message.push("Ошибка: Не удалось сохранить файл");
    }
  }

  if (message.length > 0) {
    res.json({ status: 1, message: message[0] });
    return;
  }

  res.json({ status: 0, file });
});

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    message = [];
    const user = req.user;
    await Admin.setVisit(user, Date.now()).catch((err) => {
      message.push(err.message);
      return;
    });

    if (message.length > 0) {
      res.json({
        status: 1,
        message: message[0],
      });
      return;
    }

    res.json({ status: 0, user });
  }
);

// FIXME: Переделать регистрацию
router.post("/reg", async (req, res) => {
  const message = [];
  const values = req.body;

  console.log(123213, values);

  // const exist =
  //   (await Admin.getByEmail(values.email)) ||
  //   (await Admin.getByLogin(values.login));

  // if (!!exist) {
  //   message.push("Ошибка: Пользователь с такими данными уже существует");
  //   return;
  // }

  if (message.length === 0) {
    values.pass = await getPass(values.pass).catch((err) => {
      message.push(err.message);
      return;
    });
  }
  if (!values.pass) {
    message.push("Ошибка: Не удалось зашифровать пароль");
    return;
  }

  let admin;
  if (message.length === 0) {
    admin = await Admin.addAdmin(values).catch((err) => {
      message.push(err.message);
      return;
    });
  }

  if (!admin) {
    message.push("Ошибка: Не удалось создать пользователя");
    return;
  }

  if (message.length === 0)
    await mkDir(`${__dirname}/../public/assets/admins/${admin._id}`).catch(
      (err) => {
        message.push(err.message);
      }
    );

  // const getParams = (img) => {
  //   return {
  //     initPath: `${__dirname}/../public/${values[img].preloadedImg}`,
  //     finalPath: `${__dirname}/../public/assets/admins/${admin._id}`,
  //     output: `assets/admins/${admin._id}`,
  //     smallFileName: `${img}Small.jpg`,
  //     mediumFileName: `${img}Medium.jpg`,
  //     largeFileName: `${img}Large.jpg`,
  //     zoom: values[img].zoom || 1,
  //     x: values[img].x || 0,
  //     y: values[img].y || 0,
  //     width: values[img].width,
  //     height: values[img].height,
  //   };
  // };

  // let ava;
  // if (message.length === 0) {
  //   if (!!values.avaImg) {
  //     ava = await saveConvertedImg(getParams("avaImg")).catch((err) => {
  //       message.push(err.message);
  //     });
  //   } else {
  //     ava = getNullImg();
  //   }
  // }

  // if (message.length === 0) {
  //   await Admin.saveAvatar(admin, ava).catch((err) => {
  //     message.push(err.message);
  //     return;
  //   });
  // }

  if (message.length > 0) {
    if (!!admin) {
      await Admin.removeAdmin(admin._id);
    }

    res.json({
      status: 1,
      message: message[0],
    });
    return;
  }

  res.json({ status: 0 });
});

router.put("/", async (req, res) => {
  const { login, pass, remember } = req.body;

  const user = await Admin.getByLogin(login).catch((err) => {
    res.json({ status: 1, message: err.message });
    return;
  });

  if (!user) {
    res.json({ status: 1, message: "Ошибка: Неверные данные" });
    return;
  }

  const isPasswordsMatch = await comparePass(pass, user.password).catch(
    (err) => {
      res.json({ status: 1, message: err.message });
      return;
    }
  );

  if (!isPasswordsMatch) {
    res.json({ status: 1, message: "Ошибка: Неверный пароль" });
    return;
  }

  const token = await jwt.sign(user.toJSON(), secret, {
    expiresIn: remember ? 315360000000 : 3600 * 24,
  });

  res.json({ status: 0, token });
});

module.exports = router;
