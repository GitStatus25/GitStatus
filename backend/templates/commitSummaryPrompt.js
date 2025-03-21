/**
 * OpenAI prompt template for generating commit summaries
 * This ensures consistent formatting and prevents redundant text in summaries
 */

const getCommitSummaryPrompt = ({ commitSha, authorName, message, diff }) => {
  return `
Analyze this commit and provide a concise technical summary of the changes made.

IMPORTANT INSTRUCTIONS:
1. Focus ONLY on describing what was changed and why
2. DO NOT start with phrases like "This commit" or mention the commit hash, repository, or author name
3. Write 2-3 concise, information-dense sentences
4. Focus on the technical purpose and impact of the changes
5. Be specific about what was implemented, fixed, or modified
6. If the commit message is clear and specific, incorporate its information

Commit: ${commitSha}
Author: ${authorName}
Message: ${message}

${diff ? `Changes:\n${diff}` : 'No diff available'}
`;
};

module.exports = { getCommitSummaryPrompt }; 