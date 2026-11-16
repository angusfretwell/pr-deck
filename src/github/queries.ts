export const PAGE_SIZE = 50;

export const searchQuery = (owner: string) =>
  `is:pr is:open archived:false user:${owner} sort:updated-desc`;

export const SESSION_QUERY = `
  query Session {
    viewer {
      login
      name
      avatarUrl
      organizations(first: 100) {
        nodes {
          login
          name
          avatarUrl
        }
      }
    }
  }
`;

export const PULL_REQUESTS_QUERY = `
  query PullRequests($owner: String!, $search: String!, $first: Int!, $after: String) {
    repositoryOwner(login: $owner) {
      login
    }
    search(query: $search, type: ISSUE, first: $first, after: $after) {
      issueCount
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on PullRequest {
          id
          number
          title
          url
          isDraft
          updatedAt
          headRefName
          mergeable
          reviewDecision
          repository {
            name
            owner {
              login
            }
          }
          author {
            login
            avatarUrl
          }
          commits(last: 1) {
            nodes {
              commit {
                statusCheckRollup {
                  state
                }
              }
            }
          }
          latestReviews(first: 100) {
            nodes {
              state
              author {
                login
                avatarUrl
              }
            }
          }
          latestOpinionatedReviews(first: 100) {
            nodes {
              state
              author {
                login
                avatarUrl
              }
            }
          }
          reviewRequests(first: 100) {
            nodes {
              requestedReviewer {
                __typename
                ... on User {
                  login
                }
                ... on Team {
                  slug
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const MERGEABILITY_QUERY = `
  query Mergeability($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on PullRequest {
        id
        mergeable
      }
    }
  }
`;

export const VIEWER_TEAMS_QUERY = `
  query ViewerTeams($owner: String!, $viewer: String!) {
    repositoryOwner(login: $owner) {
      ... on Organization {
        teams(first: 100, userLogins: [$viewer]) {
          nodes {
            slug
          }
        }
      }
    }
  }
`;

export const PULL_REQUEST_DETAIL_QUERY = `
  query PullRequestDetail($id: ID!) {
    node(id: $id) {
      ... on PullRequest {
        bodyHTML
        additions
        deletions
        changedFiles
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                contexts(first: 100) {
                  nodes {
                    __typename
                    ... on CheckRun {
                      name
                      status
                      conclusion
                      startedAt
                      completedAt
                      detailsUrl
                    }
                    ... on StatusContext {
                      context
                      state
                      targetUrl
                    }
                  }
                }
              }
            }
          }
        }
        files(first: 100) {
          nodes {
            path
            additions
            deletions
          }
        }
      }
    }
  }
`;
