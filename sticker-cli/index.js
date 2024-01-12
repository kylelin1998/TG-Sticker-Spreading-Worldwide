const process = require('node:process');
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const TelegramAPI = require('./telegram-bot');
const ImgUploadAPI = require('./img-upload');
const Handlebars = require("handlebars");
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const base64 = require('node-base64-image');

const dir = __dirname;
const projectName = "webpage";
const stickerPath = "sticker.json";
const templateSource = `---
title: "{{title}}"
description: "{{description}}"
featured_image: "{{featured_image}}"
link: "{{link}}"
weight: {{weight}}
date: {{date}}
images:
{{#each images}}
  - {{this}}
{{/each}}
---
`;
console.log(dir);

function findPath(name, defaultDir) {
  const curDir = `${dir}/${name}`;
  if (fs.existsSync(curDir)) {
    return curDir;
  }
  const parentDir = path.resolve(__dirname, '..');
  const parentPath = `${parentDir}/${name}`
  if (fs.existsSync(parentPath)) {
    return parentPath;
  }
  return defaultDir;
}

function getStickerList(sticker_path) {
  const result = [];
  if (fs.existsSync(sticker_path)) {
    const data = fs.readFileSync(sticker_path, 'utf-8');
    try {
      const list = JSON.parse(data);
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item instanceof Object) {
          result.push(item.name);
        } else {
          result.push(item);
        }
      }
    } catch(e) {
      console.log(e);
    }
  }
  return result;
}

async function done(answers) {
  let bot_token = answers.bot_token;
  let img_platform = answers.img_platform || "imgbb";
  let webpage_path = findPath(projectName, answers.webpage_path);
  let sticker_path = findPath(stickerPath, answers.sticker_path);
  let imgbb_apikey = answers.imgbb_apikey;
  let github_token = answers.github_token;
  let github_repo = answers.github_repo;
  let github_owner = answers.github_owner;
  let github_branch = answers.github_branch;

  const stickerList = getStickerList(sticker_path);
  console.log(`总需要处理: ${stickerList.length} 个贴纸...`);

  const me = await TelegramAPI.getMe(answers.bot_token);
  console.log(me);
  if (!me.ok) {
    console.log("机器人token无效...");
    return;
  }

  for (let i = 0; i < stickerList.length; i++) {
    const name = stickerList[i];
    const stickerDir = `${webpage_path}/site/content/${name.toLowerCase()}`;
    if (fs.existsSync(stickerDir)) {
      console.log(`${name} 此贴纸已存在...`);
      continue;
    }

    const sticker = await TelegramAPI.getStickerSet(bot_token, name);
    if (!sticker || !sticker.ok) {
      console.log(`${name} 获取贴纸失败...`);
      continue;
    }
    console.log(sticker);
    const imageList = [];
    for (let s = 0; s < sticker.result.stickers.length; s++) {
      if (imageList.length >= 20) {
        break;
      }
      const item = sticker.result.stickers[s];
      console.log("总数: ",sticker.result.stickers.length, ", 当前坐标: ", s + 1);
      const file = await TelegramAPI.getFile(bot_token, item.thumbnail.file_id);
      console.log(file);
      if (file && file.ok) {
        const url = `https://api.telegram.org/file/bot${bot_token}/${file.result.file_path}`
        if (img_platform == "imgbb") {
          const rsp = await ImgUploadAPI.imgbb('imgbb', imgbb_apikey, url).catch(e => {
            console.log(e);
          });
          console.log(rsp);
          if (rsp) {
            if (rsp.status == 200) {
              console.log(rsp.data.display_url);
              imageList.push(rsp.data.display_url);
            }
          }
        } else if (img_platform == "github") {
          const image = await base64.encode(url, {
            string: true
          });
          const path = `img/${uuidv4()}.jpg`;
          const rsp = await ImgUploadAPI.github(github_token, github_owner, github_repo, github_branch, path, image);
          if (rsp) {
            if (rsp.status == 201) {
              const url = `https://raw.githubusercontent.com/${github_owner}/${github_repo}/${github_branch}/${path}`;
              console.log(url);
              imageList.push(url);
            }
          }
        }
      }
    }
    
    console.log("上传后: ", imageList);
    if (imageList.length == 0) {
      console.log(`${name} 上传图床失败...`);
      continue;
    }
    fs.mkdirSync(stickerDir);
    const template = Handlebars.compile(templateSource);
    const date = moment().utcOffset('+08:00').format("YYYY-MM-DDTHH:mm:ssZ");
    const data = {
      title: `${sticker.result.title}`,
      description: `${sticker.result.sticker_type}: https://t.me/addstickers/${sticker.result.name}`,
      featured_image: `${imageList[0]}`,
      link: `https://t.me/addstickers/${sticker.result.name}`,
      weight: 3,
      images: imageList,
      date
    };
    const result = template(data);
    fs.writeFileSync(`${stickerDir}/index.md`, result, 'utf8');
  }
}

const configPath = `${dir}/config.json`;
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  done(config);
} else {
  inquirer
  .prompt([
     {
      "type": "input",
      "name": "bot_token",
      "message": "请输入TG机器人token:"
     },
     {
      "type": "input",
      "name": "imgbb_apikey",
      "message": "请输入IMGBB图床的API Key:"
     },
     {
      "type": "input",
      "name": "webpage_path",
      "message": "请输入[webpage]本地路径(默认回车):"
     },
     {
      "type": "input",
      "name": "sticker_path",
      "message": "请输入贴纸JSON本地路径(默认回车):"
     }
  ])
  .then((answers) => {
    done(answers);
  })
  .catch((error) => {
    console.log(error);
  });
}