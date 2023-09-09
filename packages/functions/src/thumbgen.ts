import {SQSHandler} from "aws-lambda";
import {Bucket} from 'sst/node/bucket';
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from 'sharp';

const sizeMap = {
  sm: 150,
  md: 300,
  lg: 600,
};

export const handler: SQSHandler = async (event) => {
  const message = JSON.parse(event.Records[0].body);

  const {docId} = message;

  const command = new GetObjectCommand({
    Bucket: Bucket.Upload.bucketName,
    Key: `IMG_9529.jpg`,
  })

  const client = new S3Client({});
  const response = await client.send(command);

  const bytes = await response.Body?.transformToByteArray();

  if (!bytes) {
    throw new Error('no image data found');
  }

  const buffer = Buffer.from(bytes);

  const sizes = Object.keys(sizeMap);
  for (const size of sizes) {
    const outputBuffer = await sharp(buffer).resize(sizeMap[size as keyof typeof sizeMap]).withMetadata().toBuffer();
    const putCommand = new PutObjectCommand({
      ACL: "public-read",
      Body: outputBuffer,
      Bucket: Bucket.Thumbnail.bucketName,
      Key: `${size}-${docId}.jpg`
    })
    await client.send(putCommand);
  }
}
