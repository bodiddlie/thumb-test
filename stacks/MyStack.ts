import { StackContext, Api, Bucket, } from "sst/constructs";

export function API({ stack }: StackContext) {
  const thumbnailBucket = new Bucket(stack, "Thumbnail");

  const bucket = new Bucket(stack, "Upload");

  const api = new Api(stack, "api", {
    defaults: {
      function: {
        bind: [bucket, thumbnailBucket],
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
