const unirest = require('unirest');

class ImgUploadAPI {
  upload(platform, apikey, remote) {
    return new Promise((resolve, reject) => {
      unirest.post(`https://api.imgbb.com/1/upload`)
      .field('key', apikey)
      .attach('image', remote)
      .then(response => {
        resolve(response.body);
      }).catch(e => {
        reject(e);
      });
    })
  }
}

module.exports = new ImgUploadAPI();