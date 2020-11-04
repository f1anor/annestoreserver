"use strict";

const path = require("path");
const fs = require("fs");
const magick = require("imagemagick");
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);
const rmdir = promisify(require("fs").rmdir);

const saveFile = async (req, params) => {
  const { file } = req;
  const { name } = req.params;

  await pipeline(
    file.stream,
    fs.createWriteStream(
      `${__dirname}/../${params.path}/${params.filename}${file.detectedFileExtension}`
    )
  );

  return `tmp/${name}/${params.filename}${file.detectedFileExtension}`;
};

const saveConvertedImg = async (params) => {
  const paramsSmallArr = [
    params.initPath,
    "-resize",
    `${params.width * 2}x${params.height * 2}^`,
    "-resize",
    `${Math.round(params.zoom * 100)}%`,
    "-crop",
    `${params.width * 2}x${params.height * 2}+${params.x * 2}+${params.y * 2}`,
    "-resize",
    `${params.width}x${params.height}`,
    params.finalPath + "/" + params.smallFileName,
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
  await convert(paramsLargeArr);

  // await removeFile(params.initPath);

  return {
    small: `${params.output}/${params.smallFileName}`,
    large: `${params.output}/${params.largeFileName}`,
  };
};

const removeDir = async (path) => {
  await removeFilesFromFolder(path);
  return await rmdir(path);
};

const removeFilesFromFolder = async (path) => {
  const files = (await getFile(path)) || [];
  for (let file of files) {
    await removeFile(`${path}/${file}`);
  }
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

module.exports = {
  saveFile,
  mkDir,
  removeDir,
  saveConvertedImg,
  removeFilesFromFolder,
};

//get Files

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
