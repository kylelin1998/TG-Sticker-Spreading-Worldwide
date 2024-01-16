const unirest = require('unirest');
const { Octokit } = require("@octokit/core");

class ImgUploadAPI {
  github(token, owner, repo, branch, path, base64) {
    const octokit = new Octokit({
      auth: token
    })
    return octokit.request(`PUT /repos/${owner}/${repo}/contents/${path}`, {
      owner,
      repo,
      path,
      branch,
      message: 'Upload a image',
      committer: {
        name: 'sticker',
        email: 'sticker@github.com'
      },
      content: base64,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
  }
  imgbb(apikey, remote) {
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