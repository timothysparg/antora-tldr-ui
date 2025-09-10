#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const { promises: fsp } = fs
const { Octokit } = require('@octokit/rest')
const ospath = require('node:path')
const { execSync } = require('node:child_process')

async function getNextReleaseNumber ({ octokit, owner, repo, tagPrefix, latestTagName }) {
  const filter = ({ name }) => name !== latestTagName && name.startsWith(tagPrefix)
  const releases = await collectReleases({ octokit, owner, repo, filter })

  if (releases.length) {
    releases.sort((a, b) => -1 * a.name.localeCompare(b.name, 'en', { numeric: true }))
    const latestName = releases[0].name
    return Number(latestName.slice(tagPrefix.length)) + 1
  } else {
    return 1
  }
}

async function collectReleases ({ octokit, owner, repo, filter, page = 1, accum = [] }) {
  const result = await octokit.repos.listReleases({ owner, repo, page, per_page: 100 })
  const releases = result.data.filter(filter)
  const links = result.headers.link

  if (links && links.includes('; rel="next"')) {
    return collectReleases({ octokit, owner, repo, filter, page: page + 1, accum: accum.concat(releases) })
  } else {
    return accum.concat(releases)
  }
}

async function versionBundle (bundleFile, tagName) {
  const tempDir = ospath.join(ospath.dirname(bundleFile), 'temp-bundle')

  // Extract the zip to temp directory
  execSync(`unzip -q "${bundleFile}" -d "${tempDir}"`)

  // Create or update ui.yml
  const uiYmlPath = ospath.join(tempDir, 'ui.yml')
  let versionEntry = `version: ${tagName}\n`

  if (fs.existsSync(uiYmlPath)) {
    const existingContent = await fsp.readFile(uiYmlPath, 'utf8')
    if (existingContent.length && !existingContent.endsWith('\n')) {
      versionEntry = `\n${versionEntry}`
    }
    await fsp.writeFile(uiYmlPath, existingContent + versionEntry)
  } else {
    await fsp.writeFile(uiYmlPath, versionEntry)
  }

  // Recreate the zip with version info
  execSync(`cd "${tempDir}" && zip -rq "${ospath.resolve(bundleFile)}" .`)

  // Clean up temp directory
  execSync(`rm -rf "${tempDir}"`)

  return bundleFile
}

async function release () {
  const token = process.env.GITHUB_API_TOKEN
  if (!token) {
    console.error('Error: GITHUB_API_TOKEN environment variable is required')
    process.exit(1)
  }

  // Read package.json to get repository info
  const pkg = JSON.parse(await fsp.readFile('package.json', 'utf8'))
  const [owner, repo] = new URL(pkg.repository.url).pathname.slice(1).split('/')

  const octokit = new Octokit({ auth: `token ${token}` })

  const ref = process.env.GITHUB_REF || 'refs/heads/main'
  let variant = ref.replace(/^refs\/heads\//, '')
  if (variant === 'main') variant = 'prod'

  const tagPrefix = `${variant}-`
  const latestTagName = `${tagPrefix}latest`
  const tagName = `${tagPrefix}${await getNextReleaseNumber({ octokit, owner, repo, tagPrefix, latestTagName })}`
  const message = `Release ${tagName}`

  const bundleName = 'ui'
  const bundleFileBasename = `${bundleName}-bundle.zip`
  const buildDir = ['deploy-preview', 'branch-deploy'].includes(process.env.CONTEXT) ? 'preview-dist/dist' : 'build'
  const bundleFile = await versionBundle(ospath.join(buildDir, bundleFileBasename), tagName)

  // Get current commit
  let commit = await octokit.git.getRef({ owner, repo, ref: ref.replace(/^refs\//, '') })
    .then((result) => result.data.object.sha)

  // Update README with new release version
  const readmeContent = await fsp.readFile('README.adoc', 'utf-8')
    .then((contents) => contents.replace(/^(?:\/\/)?(:current-release: ).+$/m, `$1${tagName}`))

  const readmeBlob = await octokit.git.createBlob({
    owner,
    repo,
    content: readmeContent,
    encoding: 'utf-8',
  }).then((result) => result.data.sha)

  // Get current tree
  let tree = await octokit.git.getCommit({ owner, repo, commit_sha: commit })
    .then((result) => result.data.tree.sha)

  // Create new tree with updated README
  tree = await octokit.git.createTree({
    owner,
    repo,
    tree: [{ path: 'README.adoc', mode: '100644', type: 'blob', sha: readmeBlob }],
    base_tree: tree,
  }).then((result) => result.data.sha)

  // Create new commit
  commit = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree,
    parents: [commit],
  }).then((result) => result.data.sha)

  // Update branch reference
  await octokit.git.updateRef({
    owner,
    repo,
    ref: ref.replace(/^refs\//, ''),
    sha: commit,
  })

  // Delete existing latest release if it exists
  try {
    const existingRelease = await octokit.repos.getReleaseByTag({
      owner,
      repo,
      tag: latestTagName,
    })
    await octokit.repos.deleteRelease({
      owner,
      repo,
      release_id: existingRelease.data.id,
    })
    await octokit.git.deleteRef({
      owner,
      repo,
      ref: `tags/${latestTagName}`,
    }).catch(() => undefined)
  } catch (error) {
    // Latest release doesn't exist, continue
  }

  // Create releases (both versioned and latest)
  for (const tag of [tagName, latestTagName]) {
    if (tag !== tagName) {
      // Small delay between releases
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    const isLatest = tag === tagName ? 'true' : 'false'

    const uploadUrl = await octokit.repos.createRelease({
      owner,
      repo,
      tag_name: tag,
      target_commitish: commit,
      name: tag,
      make_latest: isLatest,
    }).then((result) => result.data.upload_url)

    // Upload the bundle as an asset
    const bundleStats = await fsp.stat(bundleFile)
    await octokit.repos.uploadReleaseAsset({
      url: uploadUrl,
      data: fs.createReadStream(bundleFile),
      name: bundleFileBasename,
      headers: {
        'content-length': bundleStats.size,
        'content-type': 'application/zip',
      },
    })

    console.log(`Created release: ${tag}`)
  }

  console.log(`Release process completed successfully. Tagged as ${tagName}`)
}

if (require.main === module) {
  release().catch((error) => {
    console.error('Error during release:', error)
    process.exit(1)
  })
}

module.exports = release
