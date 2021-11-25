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

const { getPass, getAvatarImgConvertParams } = require("../utlis/utils");

const {
  removeFilesFromFolder,
  saveConvertedImg,
  mkDir,
  saveFile,
  removeDir,
} = require("../libs/fileporvider");

// Готово - Предзагрузить аватар
router.post(
  "/preloadimg/:name",
  upload.single("myImage"),
  async (req, res, next) => {
    try {
      const { name } = req.params;

      // имя и пути до папки public и до папки с временными аватарами
      const fileParams = {
        filename: `tmp_${name}`,
        core: multerConfig.core,
        path: multerConfig.tmpAvatars,
      };

      // Удаляем все файлы в папке сохранения временных аватаров
      const remove = await removeFilesFromFolder(
        `${fileParams.core}${fileParams.path}`
      );

      if (!remove) throw new Erorr("Ошибка: Не удалось завершить операцию");

      // Сохраняем изображение и возвращаем путь до него
      const file = await saveFile(req, fileParams);

      if (!file) throw new Error("Ошибка: Не удалось сохранить файл");

      res.json({ status: 0, file });
    } catch (err) {
      console.info(err);
      return next(err.message);
    }
  }
);

// Готово - Авторизация
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const user = req.user;

      // Прописываем куку для ведения сессии
      let type = 0;
      if (!!user && user.hasOwnProperty("status")) {
        type = 1;
      } else if (!!user) {
        type = 2;
      }

      req.session.date = Date.now();
      req.session.type = type;
      req.session.ip = req.clientIp;
      req.session.platform = `${req.useragent.browser} на ${req.useragent.platform}`;
      req.session.reffer = req.headers.referrer;

      //

      await Admin.setVisit(user, Date.now()).catch((err) => {
        message.push(err.message);
        return;
      });

      res.json({ status: 0, user });
    } catch (err) {
      console.info(err);
      return next(err.message);
    }
  }
);

// Готово - Регистрация
router.post("/reg", async (req, res, next) => {
  try {
    const testCode = "563256";
    const values = req.body;

    // Перепроверяем данные

    // Повторно перепроверяем код приглашения
    if (!values.code !== !testCode)
      throw new Error(
        JSON.stringify({ stage: "firstStage", code: "Неверный код" })
      );

    // Если поле логина пустое - вываливаемся в обшику
    if (!values.login)
      throw new Error(
        JSON.stringify({ stage: "secondStage", login: "Некорректные данные" })
      );

    // Повторно проверяем существует ли пользователь
    if (!!(await Admin.getByLogin(values.login)))
      throw new Error(
        JSON.stringify({
          stage: "secondStage",
          login: "Пользователь существует",
        })
      );

    if (!values.password || values.password.length < 8)
      throw new Error(
        JSON.stringify({
          stage: "secondStage",
          password: "Некорректные данные",
        })
      );

    if (
      !values.rePassword ||
      values.password.toString() !== values.rePassword.toString()
    )
      throw new Error(
        JSON.stringify({
          stage: "secondStage",
          rePassword: "Пароли не совпадают",
        })
      );

    // Повторно проверяем существует ли пользователь с таким email
    if (!!(await Admin.getByEmail(values.email)))
      throw new Error(
        JSON.stringify({
          stage: "thirdStage",
          email: "Пользователь с таким email уже существует",
        })
      );

    // Создаем зашифрованный пароль
    values.password = await getPass(values.password);

    // Добавляем пользователя в базу (временно без аватарки)
    const admin = await Admin.addAdmin(values);

    if (!admin) throw new Error("Не удалось создать пользователя");

    // Создаем папку пользователя
    await mkDir(`${multerConfig.core}${multerConfig.users}${admin._id}`);

    // Конвертируем и сохраняем изображения в папку администратора
    const saved = await saveConvertedImg(
      getAvatarImgConvertParams(values.avatarTmp, admin._id)
    );

    // Если сконвертировать и сохранить не удалось - удаляем администратора и его папку
    if (!saved) {
      removeDir(`${multerConfig.core}${multerConfig.users}${admin._id}`);
      Admin.removeAdmin(admin._id);
      throw new Error("Не удалось сохранить изображение");
    }

    // Сохряняем пути до изображений в администратора
    await Admin.saveAvatar(admin, saved);

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
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

// Проверить код приглашения в первом шаге регистрации
// TODO: сделать так чтобы код брался из базы данных
router.post("/firststage", async (req, res, next) => {
  try {
    const testCode = "563256";
    const { code } = req.body;

    if (+code.join("") !== +testCode)
      throw new Error(JSON.stringify({ code: "Неверный код!" }));

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

// Проверить логин во втором шаге регистрации
router.post("/secondstage", async (req, res, next) => {
  try {
    const { login } = req.body;
    if (!login)
      throw new Error(JSON.stringify({ login: "Некорректные данные" }));

    const exist = await Admin.getByLogin(login);

    if (!!exist) throw new Error("Пользователь уже существует");

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

router.post("/thirdstage", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email)
      throw new Error(JSON.stringify({ email: "Некорректные данные" }));

    const exist = await Admin.getByEmail(email);

    if (!!exist)
      throw new Error(JSON.stringify({ email: "Пользователь существует" }));

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

module.exports = router;
