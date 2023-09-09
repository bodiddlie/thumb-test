import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {SQSClient, SendMessageCommand} from "@aws-sdk/client-sqs";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {Bucket} from 'sst/node/bucket';
import {Queue} from 'sst/node/queue';
// import sharp from 'sharp';

const sizeMap = {
  sm: 150,
  md: 300,
  lg: 600,
};

export const get: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.pathParameters || !event.pathParameters.id) throw new Error('shit broke');
  const {id} = event.pathParameters;

  const messageBody = {
    docId: id
  }

  const command = new SendMessageCommand({
    QueueUrl: Queue.ThumbGenQueue.queueUrl,
    MessageBody: JSON.stringify(messageBody)
  });

  const client = new SQSClient({});
  await client.send(command);

  return {
    statusCode: 200,
  };
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
    Bucket: Bucket.Thumbnail.bucketName,
    Key: `${size}-${id}.jpg`,
  })

  const client = new S3Client({});
  const url = await getSignedUrl(client, command, {expiresIn: 30});

  return {
    statusCode: 200,
    body: url
  }
}
