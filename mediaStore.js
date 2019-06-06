const config = require('config');
const AWS = require('aws-sdk');

const mediastoreData = new AWS.MediaStoreData({
  apiVersion: '2017-09-01',
  accessKeyId: config.aws.iam.accessKeyId,
  secretAccessKey: config.aws.iam.secretAccessKey,
  endpoint: config.aws.mediaStore.endpoint
});

function putFile(path, data, type) {
  mediastoreData.putObject(
    {
      Path: path,
      Body: data,
      ContentType: type,
      UploadAvailability: 'STREAMING'
    },
    (err, data) => {
      if (err) {
        return console.error(err.stack);
      }
      console.log(data);
    }
  );
}

module.exports = {
  putFile
};
