const process = require('node:process');
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const { resolve } = require('path');
const TelegramAPI = require('./telegram-bot');
const Piscina = require('piscina');
const PriorityTaskQueue = require('./priority_task_queue');

const dir = __dirname;
const projectName = "webpage";
const stickerPath = "sticker.json";
const pool = new Piscina({
  filename: resolve(__dirname, 'worker.js'),
  taskQueue: new PriorityTaskQueue(),
  maxThreads: 1
});
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

function makeTask (task, priority) {
  return { ...task, [Piscina.queueOptionsSymbol]: { priority } };
}

async function done(answers) {
  let sticker_path = findPath(stickerPath, answers.sticker_path);
  const stickerList = getStickerList(sticker_path);
  console.log(`总需要处理: ${stickerList.length} 个贴纸...`);

  const me = await TelegramAPI.getMe(answers.bot_token);
  console.log(me);
  if (!me.ok) {
    console.log("机器人token无效...");
    return;
  }

  let tasks = [];
  for (let i = 0; i < stickerList.length; i++) {
    const name = stickerList[i];
    tasks.push(pool.runTask(makeTask({ priority: i, answers, name }, i)));
  }
  console.log(await Promise.all(tasks));
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