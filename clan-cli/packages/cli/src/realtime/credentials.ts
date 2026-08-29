export type RealtimeCredentialsProvider = {
  getToken(): Promise<string>;
};

export class EnvCredentialsProvider implements RealtimeCredentialsProvider {
  async getToken(): Promise<string> {
    const token = process.env.CLANCODE_DEVICE_TOKEN;
    if (token === undefined || token.length === 0) {
      throw new Error(
        "No device credential configured. Set CLANCODE_DEVICE_TOKEN before running `clancode connect`.",
      );
    }
    return token;
  }
}

export function resolveControlUrl(): string {
  const url = process.env.CLANCODE_CONTROL_URL;
  if (url === undefined || url.length === 0) {
    throw new Error("CLANCODE_CONTROL_URL is not configured");
  }
  return url;
}
