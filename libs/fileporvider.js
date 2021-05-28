"use strict";

const path = require("path");
const fs = require("fs");
const magick = require("imagemagick");
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);
const rmdir = promisify(require("fs").rmdir);
const multerConfig = require("../config/multer");

const saveFile = async (req, params) => {
  const { file } = req;

  await pipeline(
    file.stream,
    fs.createWriteStream(`${params.path}/${params.filename}`)
  );

  console.log("Файл сохранен ", params.filename);
  return `tmp/productsImg/${params.filename}`;
};

const saveConvertedImg = async (params) => {
  console.log(params);
  const paramsSmallArr = [
    params.initPath,
    "-resize",
    `${params.width * 2}x${params.height * 2}^`,
    "-resize",
    `${Math.round(params.zoom * 100)}%`,
    "-crop",
    `${params.width * 2}x${params.height * 2}+${params.x * 2}+${params.y * 2}`,
    "-resize",
    "50x50",
    params.finalPath + "/" + params.smallFileName,
  ];

  const paramsMediumArr = [
    params.initPath,
    "-resize",
    `${params.width * 2}x${params.height * 2}^`,
    "-resize",
    `${Math.round(params.zoom * 100)}%`,
    "-crop",
    `${params.width * 2}x${params.height * 2}+${params.x * 2}+${params.y * 2}`,
    "-resize",
    `${params.width}x${params.height}`,
    params.finalPath + "/" + params.mediumFileName,
  ];

  const paramsLargeArr = [
    params.initPath,
    "-resize",
    `${params.width * 2}x${params.height * 2}^`,
    "-resize",
    `${Math.round(params.zoom * 100)}%`,
    "-crop",
    `${params.width * 2}x${params.height * 2}+${params.x * 2}+${params.y * 2}`,
    params.finalPath + "/" + params.largeFileName,
  ];

  await convert(paramsSmallArr);
  await convert(paramsMediumArr);
  await convert(paramsLargeArr);

  return {
    small: `${params.output}/${params.smallFileName}`,
    medium: `${params.output}/${params.mediumFileName}`,
    large: `${params.output}/${params.largeFileName}`,
  };
};

const removeDir = async (path) => {
  await removeFilesFromFolder(path);
  return await rmdir(path);
};

const removeFilesFromFolder = async (path) => {
  const files = (await getFile(path)) || [];

  await Promise.all(files.map((file) => removeFile(`${path}/${file}`)));
  console.log("Файлы из папки удалены");
  return true;
};

async function mkDir(path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, (err) => {
      if (err) reject(err);
      resolve("done");
    });
  });
}

//Move Single file
const moveImg = async (core, from, to) => {
  await copyFile(core + from, core + to);
  return to;
};

//Move Files
const moveImgs = async (imgs, path, id, index) => {
  if (!imgs || !imgs.large || !imgs.medium || !imgs.small)
    throw new Error("Ошибка: Не все размеры");

  try {
    await copyFile(
      `${multerConfig.core}${imgs.large}`,
      `${multerConfig.core}${path}${!!id ? id : ""}/${index}_Large.jpg`
    );

    await copyFile(
      `${multerConfig.core}${imgs.medium}`,
      `${multerConfig.core}${path}${!!id ? id : ""}/${index}_Medium.jpg`
    );

    await copyFile(
      `${multerConfig.core}${imgs.small}`,
      `${multerConfig.core}${path}${!!id ? id : ""}/${index}_Small.jpg`
    );
    return {
      large: `${path}${!!id ? id : ""}/${index}_Large.jpg`,
      medium: `${path}${!!id ? id : ""}/${index}_Medium.jpg`,
      small: `${path}${!!id ? id : ""}/${index}_Small.jpg`,
    };
  } catch (err) {
    await removeFile(`${multerConfig.core}${imgs.large}`).catch((err) =>
      console.log("Ошибка: Удаляемый файл не найден")
    );
    await removeFile(`${multerConfig.core}${imgs.medium}`).catch((err) =>
      console.log("Ошибка: Удаляемый файл не найден")
    );
    await removeFile(`${multerConfig.core}${imgs.small}`).catch((err) =>
      console.log("Ошибка: Удаляемый файл не найден")
    );
    throw err;
  }
};

module.exports = {
  saveFile,
  mkDir,
  removeDir,
  saveConvertedImg,
  removeFilesFromFolder,
  moveImgs,
  moveImg,
};

//get Files

const copyFile = async (from, to) => {
  if (!from) throw new Error("Ошибка: Отсутствует путь к исходному файлу");
  if (!to) throw new Error("Ошибка: Отсутствует путь к целевому файлу");

  console.log(from, fs.existsSync(from));

  if (fs.existsSync(from)) {
    return await fs.createReadStream(from).pipe(fs.createWriteStream(to));
  } else {
    throw new Error("Ошибка. Неверный путь к файлу");
  }
};

async function getFile(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, items) => {
      resolve(items);
    });
  });
}

//convert Files

async function convert(params) {
  return new Promise((resolve, reject) => {
    magick.convert(params, (err, stdout) => {
      if (err) reject(err);
      resolve("true");
    });
  });
}

//Remove file

async function removeFile(path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) reject(err);
      resolve("done");
    });
  });
}
