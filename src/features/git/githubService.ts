export interface GitCommitMetadata {
  sha: string
  author: string
  date: string
  message: string
}

interface FetchGitHubBpmnParams {
  owner: string
  repo: string
  ref: string
  filePath: string
}

export interface FetchGitHubBpmnSuccess {
  ok: true
  xml: string
  metadata: GitCommitMetadata | null
}

export interface FetchGitHubBpmnFailure {
  ok: false
  error: string
}

export type FetchGitHubBpmnResult = FetchGitHubBpmnSuccess | FetchGitHubBpmnFailure

export async function fetchGitHubBpmnAtRef({
  owner,
  repo,
  ref,
  filePath,
}: FetchGitHubBpmnParams): Promise<FetchGitHubBpmnResult> {
  const normalizedPath = filePath.replace(/^\/+/, '')
  const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(ref)}/${normalizedPath}`

  const xmlResponse = await fetch(rawUrl)
  if (!xmlResponse.ok) {
    return {
      ok: false,
      error: `Unable to load ${normalizedPath} at ref ${ref} (${xmlResponse.status})`,
    }
  }

  const xml = await xmlResponse.text()
  const metadata = await fetchGitHubCommitMetadata(owner, repo, ref)

  return {
    ok: true,
    xml,
    metadata,
  }
}

async function fetchGitHubCommitMetadata(
  owner: string,
  repo: string,
  ref: string,
): Promise<GitCommitMetadata | null> {
  try {
    const commitUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(ref)}`
    const response = await fetch(commitUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    })

    if (!response.ok) return null

    const data = await response.json()
    return {
      sha: String(data.sha ?? '').slice(0, 7),
      author: String(data?.commit?.author?.name ?? 'unknown'),
      date: String(data?.commit?.author?.date ?? ''),
      message: String(data?.commit?.message ?? '').split('\n')[0],
    }
  } catch {
    return null
  }
}
