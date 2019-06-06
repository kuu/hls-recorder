const path = require('path');
const {createReadStream} = require('hls-stream');
const {putFile} = require('./mediaStore');

function getPath(url, baseUrl) {
  // Remove
  const index = url.indexOf('?');
  if (index !== -1 && (url.startsWith('http:') || url.startsWith('https:'))) {
    url = url.slice(0, index);
  }
  if (url.startsWith(baseUrl)) {
    return url.replace(baseUrl, '');
  }
  if (url.includes(baseUrl)) {
    return url.slice(url.lastIndexOf(baseUrl) + baseUrl.length);
  }
  return path.basename(url);
}

function record(url) {
  const baseUrl = `${path.dirname(url)}/`;
  return new Promise((resolve, reject) => {
    const stream = createReadStream(url, {concurrency: 7});
    // let counter = 0;

    stream.on('variants', (variants, cb) => {
      // Choose variants
      const variantsToLoad = [];
      console.log(`${variants.length} variants available:`);
      for (const [index, variant] of variants.entries()) {
        console.log(`\tvariant[${index}] : ${variant.bandwidth} bps, ${variant.uri}`);
        variantsToLoad.push(index);
      }
      cb(variantsToLoad);
    })
    .on('renditions', (renditions, cb) => {
      // Choose renditions
      const renditionsToLoad = [];
      console.log(`${renditions.length} renditions available:`);
      for (const [index, rendition] of renditions.entries()) {
        console.log(`\trendition[${index}] : type = ${rendition.type}, name = ${rendition.name}, isDefault = ${rendition.isDefault}`);
        renditionsToLoad.push(index);
      }
      cb(renditionsToLoad);
    })
    .on('data', data => {
      let dest = '';
      let body = null;
      let type = '';
      if (data.type === 'playlist') {
        const playlist = data;
        dest = getPath(playlist.uri, baseUrl);
        body = playlist.source;
        type = 'application/vnd.apple.mpegurl';
      } else if (data.type === 'segment') {
        const segment = data;
        dest = getPath(segment.uri, baseUrl);
        body = segment.data;
        type = segment.mimeType;
      }
      putFile(dest, body, type);
    })
    .on('end', () => {
      resolve('Done');
    })
    .on('error', err => {
      reject(err);
    });
  });
}

module.exports = {
  record
};
