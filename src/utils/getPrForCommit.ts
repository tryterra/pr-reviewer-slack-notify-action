import * as core from "@actions/core";
import * as github from "@actions/github";

import { fail } from "./fail";
import { logger } from "./logger";

export const getPrForCommit = async () => {
  logger.info('START getPrForCommit')
  logger.info('START getPrForCommit but custom')
  try {
    logger.info(`Inside try block`)

    const { commits, pull_request: pr, repository } = github.context.payload;

    logger.info(`PR is ${pr}`)

    if (pr) {
      return pr;
    }

    logger.info(`Commits are ${commits}`)

    if (!commits || !commits.length) {
      throw Error("No commits found");
    }

    logger.info(`repository is ${repository}`)

    if (!repository) {
      throw Error("No repository found in github.context.payload");
    }

    const commit_sha = commits[0].id;
    const ghToken = core.getInput("github-token");
    const octokit = github.getOctokit(ghToken);
    const res = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
      owner: repository.owner.name!,
      repo: repository.name,
      commit_sha,
    });

    const [pull_request] = res.data;

    if (!pull_request) {
      throw Error(`No pull_request found for commit: ${commit_sha}`);
    }

    logger.info(`END getPrForCommit: ${JSON.stringify(pull_request)}`)
    return pull_request;
  } catch (error) {
    logger.error(`Error occurred: ${error}`);
    fail(error);


    throw error;
  }
};
