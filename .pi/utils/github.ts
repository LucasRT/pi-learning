import axios from 'axios';

export async function fetchPRDiff(pr_number: number): Promise<string> {
  const url = `https://api.github.com/repos/LucasRT/pi-learning/pulls/${pr_number}`;
  const token = process.env.GITHUB_TOKEN;
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3.diff',
    },
  });
  return response.data;
}