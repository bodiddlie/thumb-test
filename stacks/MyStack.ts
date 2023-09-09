import { StackContext, Api, Bucket, Queue} from "sst/constructs";

export function API({ stack }: StackContext) {

  const thumbnailBucket = new Bucket(stack, "Thumbnail");

  const bucket = new Bucket(stack, "Upload");

  const thumbGenQueue = new Queue(stack, "ThumbGenQueue", {
    consumer: {
      function: {
        handler: "packages/functions/src/thumbgen.handler",
        bind: [bucket, thumbnailBucket]
      },
    }
  });

  const api = new Api(stack, "api", {
    defaults: {
      function: {
        bind: [thumbnailBucket, thumbGenQueue]
      },
    },
    routes: {
      "POST /images/{id}": "packages/functions/src/image.get",
      "GET /thumbnails/{id}": "packages/functions/src/image.thumbnails"
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
