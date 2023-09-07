import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {Bucket} from 'sst/node/bucket';
import sharp from 'sharp';

const sizeMap = {
  sm: 150,
  md: 300,
  lg: 600,
};

export const get: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.pathParameters) throw new Error('shit broke');
  const {id} = event.pathParameters;
  if (!id) throw new Error('shit broke');

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
      Key: `${size}-${id}.jpg`
    })
    await client.send(putCommand);
  }

  return {
    statusCode: 200,
  }
}

export const thumbnails: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.pathParameters || !event.pathParameters.id) throw new Error('shit broke');
  let size = 'sm';
  if (event.queryStringParameters) {
    const tmpSize = event.queryStringParameters.size;
    if (tmpSize && Object.keys(sizeMap).includes(tmpSize)){ 
      size = tmpSize;
    }
  }

  const {id} = event.pathParameters;

  const command = new GetObjectCommand({
    Bucket: process.env.thumbnailBucketName,
    Key: `${size}-${id}.jpg`,
  })

  const client = new S3Client({});
  const url = await getSignedUrl(client, command, {expiresIn: 30});

  return {
    statusCode: 200,
    body: url
  }
}
