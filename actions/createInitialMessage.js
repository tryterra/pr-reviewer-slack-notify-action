const core = require("@actions/core");
const github = require("@actions/github");
const { slackWebClient } = require("../utils");

module.exports = async () => {
  const { payload } = github.context;

  try {
    const channelId = core.getInput("channel-id");
    const slackUsers = JSON.parse(core.getInput("slack-users"));

    const requestedReviewers = github.context.payload.pull_request.requested_reviewers.map(
      (user) => user.login
    );
    // stop everything if there are no requested reviewers
    if (!requestedReviewers.length) {
      return null;
    }
    // TODO update this to include content from the author's description or last comment
    const baseMessage = `${github.context.payload.sender.login} is requesting your review on ${github.context.payload.pull_request._links.html.href}`;

    // build users to mention string
    const usersToAt = slackUsers.filter((user) =>
      requestedReviewers.includes(user.github_username)
    );
    let usersToAtString;
    usersToAt.forEach((user) => {
      if (!usersToAtString) {
        usersToAtString = `<@${user.slack_id}>`;
        return;
      }
      usersToAtString = `${usersToAtString}, <@${user.slack_id}>`;
      return;
    });
    // See: https://api.slack.com/methods/chat.postMessage
    prSlackMsg = await slackWebClient.chat.postMessage({
      channel: channelId,
      text: `${usersToAtString} ${baseMessage}`,
    });

    if (!prSlackMsg.ok || !prSlackMsg.ts)
      throw Error("failed to create initial slack message");

    const token = core.getInput("github-token");
    const octokit = github.getOctokit(token);
    return await octokit.issues.createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.number,
      body: `SLACK_MESSAGE_ID:${prSlackMsg.ts}`,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
};
