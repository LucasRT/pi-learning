import axios from 'axios';

const DEFAULT_REPO = 'LucasRT/pi-learning';

/**
 * Which "owner/repo" to query. Configurable via GITHUB_REPO so that
 * installing this package's tools into a *different* project (see
 * package.json's "pi" field / README install instructions) reviews PRs
 * in that project's repo, not this one. Falls back to this project's own
 * repo when unset, which keeps it working out of the box here.
 */
export function getRepo(): string {
  return process.env.GITHUB_REPO || DEFAULT_REPO;
}

export function buildPrDiffUrl(pr_number: number, repo: string = getRepo()): string {
  return `https://api.github.com/repos/${repo}/pulls/${pr_number}`;
}

export async function fetchPRDiff(pr_number: number): Promise<string> {
  const url = buildPrDiffUrl(pr_number);
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
