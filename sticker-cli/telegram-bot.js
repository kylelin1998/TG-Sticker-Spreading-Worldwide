const unirest = require('unirest');

class TelegramAPI {
  getMe(token) {
    return new Promise((resolve, reject) => {
      unirest.get(`https://api.telegram.org/bot${token}/getMe`).then(response => {
        resolve(response.body);
      }).catch(e => {
        reject(e);
      });
    })
  }
  getStickerSet(token, name) {
    return new Promise((resolve, reject) => {
      unirest.post(`https://api.telegram.org/bot${token}/getStickerSet`).send({
        name
      }).then(response => {
        resolve(response.body);
      }).catch(e => {
        reject(e);
      });
    })
  }
  getFile(token, file_id) {
    return new Promise((resolve, reject) => {
      unirest.post(`https://api.telegram.org/bot${token}/getFile`).send({
        file_id
      }).then(response => {
        resolve(response.body);
      }).catch(e => {
        reject(e);
      });
    })
  }
  download(token, file_path) {
    return new Promise((resolve, reject) => {
      unirest.get(`https://api.telegram.org/file/bot${token}/${file_path}`).then(response => {
        resolve(response.body);
      }).catch(e => {
        reject(e);
      });
    })
  }
}

module.exports = new TelegramAPI();