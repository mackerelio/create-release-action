import { getInput, startGroup, info, endGroup, setFailed } from '@actions/core';
import { getOctokit, context as _context } from '@actions/github';
import read from 'fs-readdir-recursive';
import fs from 'fs/promises';
import { basename } from 'path';

async function readPR (octokit, context, bumpUpBranchPrefix, version) {
  const { repo: { owner, repo } } = context;

  const prs = await octokit.rest.pulls.list({
    owner,
    repo,
    state: "closed",
    head: `${owner}:${bumpUpBranchPrefix}${version}`,
  });

  const pr = prs.data.filter(x => !!x.merged_at);
  if (pr.length == 1) {
    return pr[0].body;
  }

  return "";
}

async function run() {
  try {


    const token = getInput('github-token');
    const directory = getInput('directory');
    const tagPrefix = getInput('tag-prefix');
    const bumpUpBranchPrefix = getInput('bump-up-branch-prefix');

    const octokit = getOctokit(token);

    const context = _context;
    const { repo: { owner, repo }, ref } = context;

    const tag = ref.replace('refs/tags/', '');

    const release = await octokit.rest.repos.getReleaseByTag({
      owner,
      repo,
      tag,
    });

    const version = ref.replace(tagPrefix, '');
    const prText = await readPR(octokit, context, bumpUpBranchPrefix, version);

    const artifacts = read('.', () => true, [], directory);

    startGroup('Assets')
    for (let file of artifacts) {
      info('uploading ' + file);

      await octokit.rest.repos.uploadReleaseAsset({
        owner, repo,
        release_id: release.data.id,
        name: basename(file),
        data: await fs.readFile(file),
      });
    }
    endGroup()

    await octokit.rest.repos.updateRelease({
      owner,
      repo,
      release_id: release.data.id,
      prerelease: false,
      name: tag,
      body: prText,
    });

    info("\u001b[1mRelease: " + release.data.html_url);
  } catch (error) {
    setFailed(error.message);
  }
}

run();
