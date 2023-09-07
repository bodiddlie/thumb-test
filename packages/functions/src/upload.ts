import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { S3Handler } from "aws-lambda";

import sharp from 'sharp';
// import { Bucket } from "sst/node/bucket";

export const handler: S3Handler = async (event) => {
  if (event.Records[0].eventName !== 'ObjectCreated:Put') return;

  const srcBucket = event.Records[0].s3.bucket.name;
  const srcKey = event.Records[0].s3.object.key;
  const fileName = decodeURIComponent(srcKey.replace(/\+/g, '')).split('/').pop();

  if (!fileName) {
    throw new Error('could not retrieve file name');
  }

  const typeMatch = fileName.match(/\.([^.]*)$/);
  if (!typeMatch) {
    throw new Error('could not determine image type');
  }

  const imageType = typeMatch[1].toLowerCase();
  if (imageType != 'jpg' && imageType != 'png') {
    throw new Error(`unsupported file type: ${imageType}`);
  }

  const command = new GetObjectCommand({
    Bucket: srcBucket,
    Key: srcKey
  })

  const client = new S3Client({});
  const response = await client.send(command);
  const bytes = await response.Body?.transformToByteArray();

  if (!bytes) {
    throw new Error('no image data found');
  }

  const buffer = Buffer.from(bytes);
  const outputBuffer = await sharp(buffer).resize(150).withMetadata().toBuffer();

  const thumbnailBucketName = process.env.thumbnailBucketName;

  console.log(`Bucket name: ${thumbnailBucketName}`);

  const putCommand = new PutObjectCommand({
    ACL: "public-read",
    Body: outputBuffer,
    Bucket: thumbnailBucketName,
    Key: `sm-${srcKey}`,
  })
  
  const putResponse = await client.send(putCommand);

  console.log(putResponse);

  return;
}

