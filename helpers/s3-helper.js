const S3 = require('aws-sdk/clients/s3');
const path = require('path');
require('dotenv').config();

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey
});

// uploads a file to s3
function uploadFile(file) {
  const fileStream = file.data;
  const fileName = path.basename(file.name);
  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: `product-images/${Date.now()}-${fileName}`
  };

  return s3.upload(uploadParams).promise();
}
exports.uploadFile = uploadFile;
