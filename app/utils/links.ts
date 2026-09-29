/** Where the source lives. Used by the sidebar and by "edit this page". */
export const repo = {
  owner: 'imswarnil',
  name: 'job-seekers-guide',
  branch: 'main'
} as const

export const repoUrl = `https://github.com/${repo.owner}/${repo.name}`

/** Deep link to edit one content file on GitHub. */
export function editUrl(file: string) {
  return `${repoUrl}/edit/${repo.branch}/${file}`
}

/** The few places outside the guide. Shown small, at the foot of the sidebar. */
export const footLinks = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Contact', to: '/contact' },
  { label: 'GitHub', to: repoUrl, target: '_blank' }
]
