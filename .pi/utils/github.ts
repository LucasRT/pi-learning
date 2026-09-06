import axios from 'axios';

export async function fetchPRDiff(pr_number: number): Promise<string> {
  const url = `https://api.github.com/repos/LucasRT/pi-learning/pulls/${pr_number}`;
  const token = process.env.GITHUB_TOKEN;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3.diff',
      },
    });
    return response.data;
  } catch (err: any) {
    // Surface real diagnostic info instead of a generic "404" with no context.
    const debugInfo = {
      requestedUrl: url,
      tokenPresent: Boolean(token),
      tokenPrefix: token ? token.slice(0, 8) + '...' : 'MISSING',
      status: err?.response?.status,
      responseBody: err?.response?.data,
    };
    throw new Error(`fetchPRDiff failed: ${JSON.stringify(debugInfo, null, 2)}`);
  }
}
