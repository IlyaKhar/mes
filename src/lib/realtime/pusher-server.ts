import Pusher from "pusher";

let pusher: Pusher | null = null;

export function getPusherServer() {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) return null;
  if (
    appId.startsWith("your_") ||
    key.startsWith("your_") ||
    secret.startsWith("your_") ||
    cluster.startsWith("your_")
  ) {
    return null;
  }

  pusher ??= new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true
  });

  return pusher;
}
