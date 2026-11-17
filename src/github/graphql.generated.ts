/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** The possible states for a check suite or run conclusion. */
export type CheckConclusionState =
  /** The check suite or run requires action. */
  | 'ACTION_REQUIRED'
  /** The check suite or run has been cancelled. */
  | 'CANCELLED'
  /** The check suite or run has failed. */
  | 'FAILURE'
  /** The check suite or run was neutral. */
  | 'NEUTRAL'
  /** The check suite or run was skipped. */
  | 'SKIPPED'
  /** The check suite or run was marked stale by GitHub. Only GitHub can use this conclusion. */
  | 'STALE'
  /** The check suite or run has failed at startup. */
  | 'STARTUP_FAILURE'
  /** The check suite or run has succeeded. */
  | 'SUCCESS'
  /** The check suite or run has timed out. */
  | 'TIMED_OUT';

/** The possible states for a check suite or run status. */
export type CheckStatusState =
  /** The check suite or run has been completed. */
  | 'COMPLETED'
  /** The check suite or run is in progress. */
  | 'IN_PROGRESS'
  /** The check suite or run is in pending state. */
  | 'PENDING'
  /** The check suite or run has been queued. */
  | 'QUEUED'
  /** The check suite or run has been requested. */
  | 'REQUESTED'
  /** The check suite or run is in waiting state. */
  | 'WAITING';

/** Whether or not a PullRequest can be merged. */
export type MergeableState =
  /** The pull request cannot be merged due to merge conflicts. */
  | 'CONFLICTING'
  /** The pull request can be merged. */
  | 'MERGEABLE'
  /** The mergeability of the pull request is still being calculated. */
  | 'UNKNOWN';

/** The review status of a pull request. */
export type PullRequestReviewDecision =
  /** The pull request has received an approving review. */
  | 'APPROVED'
  /** Changes have been requested on the pull request. */
  | 'CHANGES_REQUESTED'
  /** A review is required before the pull request can be merged. */
  | 'REVIEW_REQUIRED';

/** The possible states of a pull request review. */
export type PullRequestReviewState =
  /** A review allowing the pull request to merge. */
  | 'APPROVED'
  /** A review blocking the pull request from merging. */
  | 'CHANGES_REQUESTED'
  /** An informational review. */
  | 'COMMENTED'
  /** A review that has been dismissed. */
  | 'DISMISSED'
  /** A review that has not yet been submitted. */
  | 'PENDING';

/** The possible commit status states. */
export type StatusState =
  /** Status is errored. */
  | 'ERROR'
  /** Status is expected. */
  | 'EXPECTED'
  /** Status is failing. */
  | 'FAILURE'
  /** Status is pending. */
  | 'PENDING'
  /** Status is successful. */
  | 'SUCCESS';

export type SessionQueryVariables = Exact<{ [key: string]: never; }>;


export type SessionQuery = { viewer: { login: string, name: string | null, avatarUrl: string, organizations: { nodes: Array<{ login: string, name: string | null, avatarUrl: string } | null> | null } } };

export type PullRequestsQueryVariables = Exact<{
  owner: string;
  search: string;
  first: number;
  after?: string | null | undefined;
}>;


export type PullRequestsQuery = { repositoryOwner:
    | { login: string }
    | { login: string }
   | null, search: { issueCount: number, pageInfo: { hasNextPage: boolean, endCursor: string | null }, nodes: Array<
      | { __typename: 'App' }
      | { __typename: 'Discussion' }
      | { __typename: 'Issue' }
      | { __typename: 'MarketplaceListing' }
      | { __typename: 'Organization' }
      | { __typename: 'PullRequest', id: string, number: number, title: string, url: string, isDraft: boolean, updatedAt: string, headRefName: string, baseRefName: string, isCrossRepository: boolean, mergeable: MergeableState, reviewDecision: PullRequestReviewDecision | null, repository: { name: string, owner:
            | { login: string }
            | { login: string }
           }, author:
          | { login: string, avatarUrl: string }
          | { login: string, avatarUrl: string }
          | { login: string, avatarUrl: string }
          | { login: string, avatarUrl: string }
          | { login: string, avatarUrl: string }
         | null, commits: { nodes: Array<{ commit: { statusCheckRollup: { state: StatusState } | null } } | null> | null }, latestReviews: { nodes: Array<{ state: PullRequestReviewState, author:
              | { login: string, avatarUrl: string }
              | { login: string, avatarUrl: string }
              | { login: string, avatarUrl: string }
              | { login: string, avatarUrl: string }
              | { login: string, avatarUrl: string }
             | null } | null> | null } | null, latestOpinionatedReviews: { nodes: Array<{ state: PullRequestReviewState, author:
              | { login: string, avatarUrl: string }
              | { login: string, avatarUrl: string }
              | { login: string, avatarUrl: string }
              | { login: string, avatarUrl: string }
              | { login: string, avatarUrl: string }
             | null } | null> | null } | null, reviewRequests: { nodes: Array<{ requestedReviewer:
              | { __typename: 'Bot' }
              | { __typename: 'Mannequin' }
              | { __typename: 'Team', slug: string }
              | { __typename: 'User', login: string }
             | null } | null> | null } | null }
      | { __typename: 'Repository' }
      | { __typename: 'User' }
     | null> | null } };

export type MergeabilityQueryVariables = Exact<{
  ids: Array<string | number> | string | number;
}>;


export type MergeabilityQuery = { nodes: Array<
    | { __typename: 'AddedToMergeQueueEvent' }
    | { __typename: 'AddedToProjectEvent' }
    | { __typename: 'App' }
    | { __typename: 'AssignedEvent' }
    | { __typename: 'AutoMergeDisabledEvent' }
    | { __typename: 'AutoMergeEnabledEvent' }
    | { __typename: 'AutoRebaseEnabledEvent' }
    | { __typename: 'AutoSquashEnabledEvent' }
    | { __typename: 'AutomaticBaseChangeFailedEvent' }
    | { __typename: 'AutomaticBaseChangeSucceededEvent' }
    | { __typename: 'BaseRefChangedEvent' }
    | { __typename: 'BaseRefDeletedEvent' }
    | { __typename: 'BaseRefForcePushedEvent' }
    | { __typename: 'Blob' }
    | { __typename: 'Bot' }
    | { __typename: 'BranchProtectionRule' }
    | { __typename: 'BypassForcePushAllowance' }
    | { __typename: 'BypassPullRequestAllowance' }
    | { __typename: 'CWE' }
    | { __typename: 'CheckRun' }
    | { __typename: 'CheckSuite' }
    | { __typename: 'ClosedEvent' }
    | { __typename: 'CodeOfConduct' }
    | { __typename: 'CommentDeletedEvent' }
    | { __typename: 'Commit' }
    | { __typename: 'CommitComment' }
    | { __typename: 'CommitCommentThread' }
    | { __typename: 'Comparison' }
    | { __typename: 'ConnectedEvent' }
    | { __typename: 'ConvertToDraftEvent' }
    | { __typename: 'ConvertedNoteToIssueEvent' }
    | { __typename: 'ConvertedToDiscussionEvent' }
    | { __typename: 'CrossReferencedEvent' }
    | { __typename: 'DemilestonedEvent' }
    | { __typename: 'DependencyGraphManifest' }
    | { __typename: 'DeployKey' }
    | { __typename: 'DeployedEvent' }
    | { __typename: 'Deployment' }
    | { __typename: 'DeploymentEnvironmentChangedEvent' }
    | { __typename: 'DeploymentReview' }
    | { __typename: 'DeploymentStatus' }
    | { __typename: 'DisconnectedEvent' }
    | { __typename: 'Discussion' }
    | { __typename: 'DiscussionCategory' }
    | { __typename: 'DiscussionComment' }
    | { __typename: 'DiscussionPoll' }
    | { __typename: 'DiscussionPollOption' }
    | { __typename: 'DraftIssue' }
    | { __typename: 'Enterprise' }
    | { __typename: 'EnterpriseAdministratorInvitation' }
    | { __typename: 'EnterpriseIdentityProvider' }
    | { __typename: 'EnterpriseMemberInvitation' }
    | { __typename: 'EnterpriseRepositoryInfo' }
    | { __typename: 'EnterpriseServerInstallation' }
    | { __typename: 'EnterpriseServerUserAccount' }
    | { __typename: 'EnterpriseServerUserAccountEmail' }
    | { __typename: 'EnterpriseServerUserAccountsUpload' }
    | { __typename: 'EnterpriseUserAccount' }
    | { __typename: 'Environment' }
    | { __typename: 'ExternalIdentity' }
    | { __typename: 'Gist' }
    | { __typename: 'GistComment' }
    | { __typename: 'HeadRefDeletedEvent' }
    | { __typename: 'HeadRefForcePushedEvent' }
    | { __typename: 'HeadRefRestoredEvent' }
    | { __typename: 'IpAllowListEntry' }
    | { __typename: 'Issue' }
    | { __typename: 'IssueComment' }
    | { __typename: 'Label' }
    | { __typename: 'LabeledEvent' }
    | { __typename: 'Language' }
    | { __typename: 'License' }
    | { __typename: 'LinkedBranch' }
    | { __typename: 'LockedEvent' }
    | { __typename: 'Mannequin' }
    | { __typename: 'MarkedAsDuplicateEvent' }
    | { __typename: 'MarketplaceCategory' }
    | { __typename: 'MarketplaceListing' }
    | { __typename: 'MemberFeatureRequestNotification' }
    | { __typename: 'MembersCanDeleteReposClearAuditEntry' }
    | { __typename: 'MembersCanDeleteReposDisableAuditEntry' }
    | { __typename: 'MembersCanDeleteReposEnableAuditEntry' }
    | { __typename: 'MentionedEvent' }
    | { __typename: 'MergeQueue' }
    | { __typename: 'MergeQueueEntry' }
    | { __typename: 'MergedEvent' }
    | { __typename: 'MigrationSource' }
    | { __typename: 'Milestone' }
    | { __typename: 'MilestonedEvent' }
    | { __typename: 'MovedColumnsInProjectEvent' }
    | { __typename: 'OIDCProvider' }
    | { __typename: 'OauthApplicationCreateAuditEntry' }
    | { __typename: 'OrgAddBillingManagerAuditEntry' }
    | { __typename: 'OrgAddMemberAuditEntry' }
    | { __typename: 'OrgBlockUserAuditEntry' }
    | { __typename: 'OrgConfigDisableCollaboratorsOnlyAuditEntry' }
    | { __typename: 'OrgConfigEnableCollaboratorsOnlyAuditEntry' }
    | { __typename: 'OrgCreateAuditEntry' }
    | { __typename: 'OrgDisableOauthAppRestrictionsAuditEntry' }
    | { __typename: 'OrgDisableSamlAuditEntry' }
    | { __typename: 'OrgDisableTwoFactorRequirementAuditEntry' }
    | { __typename: 'OrgEnableOauthAppRestrictionsAuditEntry' }
    | { __typename: 'OrgEnableSamlAuditEntry' }
    | { __typename: 'OrgEnableTwoFactorRequirementAuditEntry' }
    | { __typename: 'OrgInviteMemberAuditEntry' }
    | { __typename: 'OrgInviteToBusinessAuditEntry' }
    | { __typename: 'OrgOauthAppAccessApprovedAuditEntry' }
    | { __typename: 'OrgOauthAppAccessBlockedAuditEntry' }
    | { __typename: 'OrgOauthAppAccessDeniedAuditEntry' }
    | { __typename: 'OrgOauthAppAccessRequestedAuditEntry' }
    | { __typename: 'OrgOauthAppAccessUnblockedAuditEntry' }
    | { __typename: 'OrgRemoveBillingManagerAuditEntry' }
    | { __typename: 'OrgRemoveMemberAuditEntry' }
    | { __typename: 'OrgRemoveOutsideCollaboratorAuditEntry' }
    | { __typename: 'OrgRestoreMemberAuditEntry' }
    | { __typename: 'OrgUnblockUserAuditEntry' }
    | { __typename: 'OrgUpdateDefaultRepositoryPermissionAuditEntry' }
    | { __typename: 'OrgUpdateMemberAuditEntry' }
    | { __typename: 'OrgUpdateMemberRepositoryCreationPermissionAuditEntry' }
    | { __typename: 'OrgUpdateMemberRepositoryInvitationPermissionAuditEntry' }
    | { __typename: 'Organization' }
    | { __typename: 'OrganizationIdentityProvider' }
    | { __typename: 'OrganizationInvitation' }
    | { __typename: 'OrganizationMigration' }
    | { __typename: 'Package' }
    | { __typename: 'PackageFile' }
    | { __typename: 'PackageTag' }
    | { __typename: 'PackageVersion' }
    | { __typename: 'ParentIssueAddedEvent' }
    | { __typename: 'ParentIssueRemovedEvent' }
    | { __typename: 'PinnedDiscussion' }
    | { __typename: 'PinnedEnvironment' }
    | { __typename: 'PinnedEvent' }
    | { __typename: 'PinnedIssue' }
    | { __typename: 'PrivateRepositoryForkingDisableAuditEntry' }
    | { __typename: 'PrivateRepositoryForkingEnableAuditEntry' }
    | { __typename: 'Project' }
    | { __typename: 'ProjectCard' }
    | { __typename: 'ProjectColumn' }
    | { __typename: 'ProjectV2' }
    | { __typename: 'ProjectV2Field' }
    | { __typename: 'ProjectV2Item' }
    | { __typename: 'ProjectV2ItemFieldDateValue' }
    | { __typename: 'ProjectV2ItemFieldIterationValue' }
    | { __typename: 'ProjectV2ItemFieldNumberValue' }
    | { __typename: 'ProjectV2ItemFieldSingleSelectValue' }
    | { __typename: 'ProjectV2ItemFieldTextValue' }
    | { __typename: 'ProjectV2IterationField' }
    | { __typename: 'ProjectV2SingleSelectField' }
    | { __typename: 'ProjectV2StatusUpdate' }
    | { __typename: 'ProjectV2View' }
    | { __typename: 'ProjectV2Workflow' }
    | { __typename: 'PublicKey' }
    | { __typename: 'PullRequest', id: string, mergeable: MergeableState }
    | { __typename: 'PullRequestCommit' }
    | { __typename: 'PullRequestCommitCommentThread' }
    | { __typename: 'PullRequestReview' }
    | { __typename: 'PullRequestReviewComment' }
    | { __typename: 'PullRequestReviewThread' }
    | { __typename: 'PullRequestThread' }
    | { __typename: 'Push' }
    | { __typename: 'PushAllowance' }
    | { __typename: 'Query' }
    | { __typename: 'Reaction' }
    | { __typename: 'ReadyForReviewEvent' }
    | { __typename: 'Ref' }
    | { __typename: 'ReferencedEvent' }
    | { __typename: 'Release' }
    | { __typename: 'ReleaseAsset' }
    | { __typename: 'RemovedFromMergeQueueEvent' }
    | { __typename: 'RemovedFromProjectEvent' }
    | { __typename: 'RenamedTitleEvent' }
    | { __typename: 'ReopenedEvent' }
    | { __typename: 'RepoAccessAuditEntry' }
    | { __typename: 'RepoAddMemberAuditEntry' }
    | { __typename: 'RepoAddTopicAuditEntry' }
    | { __typename: 'RepoArchivedAuditEntry' }
    | { __typename: 'RepoChangeMergeSettingAuditEntry' }
    | { __typename: 'RepoConfigDisableAnonymousGitAccessAuditEntry' }
    | { __typename: 'RepoConfigDisableCollaboratorsOnlyAuditEntry' }
    | { __typename: 'RepoConfigDisableContributorsOnlyAuditEntry' }
    | { __typename: 'RepoConfigDisableSockpuppetDisallowedAuditEntry' }
    | { __typename: 'RepoConfigEnableAnonymousGitAccessAuditEntry' }
    | { __typename: 'RepoConfigEnableCollaboratorsOnlyAuditEntry' }
    | { __typename: 'RepoConfigEnableContributorsOnlyAuditEntry' }
    | { __typename: 'RepoConfigEnableSockpuppetDisallowedAuditEntry' }
    | { __typename: 'RepoConfigLockAnonymousGitAccessAuditEntry' }
    | { __typename: 'RepoConfigUnlockAnonymousGitAccessAuditEntry' }
    | { __typename: 'RepoCreateAuditEntry' }
    | { __typename: 'RepoDestroyAuditEntry' }
    | { __typename: 'RepoRemoveMemberAuditEntry' }
    | { __typename: 'RepoRemoveTopicAuditEntry' }
    | { __typename: 'Repository' }
    | { __typename: 'RepositoryInvitation' }
    | { __typename: 'RepositoryMigration' }
    | { __typename: 'RepositoryRule' }
    | { __typename: 'RepositoryRuleset' }
    | { __typename: 'RepositoryRulesetBypassActor' }
    | { __typename: 'RepositoryTopic' }
    | { __typename: 'RepositoryVisibilityChangeDisableAuditEntry' }
    | { __typename: 'RepositoryVisibilityChangeEnableAuditEntry' }
    | { __typename: 'RepositoryVulnerabilityAlert' }
    | { __typename: 'ReviewDismissalAllowance' }
    | { __typename: 'ReviewDismissedEvent' }
    | { __typename: 'ReviewRequest' }
    | { __typename: 'ReviewRequestRemovedEvent' }
    | { __typename: 'ReviewRequestedEvent' }
    | { __typename: 'SavedReply' }
    | { __typename: 'SecurityAdvisory' }
    | { __typename: 'SponsorsActivity' }
    | { __typename: 'SponsorsListing' }
    | { __typename: 'SponsorsListingFeaturedItem' }
    | { __typename: 'SponsorsTier' }
    | { __typename: 'Sponsorship' }
    | { __typename: 'SponsorshipNewsletter' }
    | { __typename: 'Status' }
    | { __typename: 'StatusCheckRollup' }
    | { __typename: 'StatusContext' }
    | { __typename: 'SubIssueAddedEvent' }
    | { __typename: 'SubIssueRemovedEvent' }
    | { __typename: 'SubscribedEvent' }
    | { __typename: 'Tag' }
    | { __typename: 'Team' }
    | { __typename: 'TeamAddMemberAuditEntry' }
    | { __typename: 'TeamAddRepositoryAuditEntry' }
    | { __typename: 'TeamChangeParentTeamAuditEntry' }
    | { __typename: 'TeamDiscussion' }
    | { __typename: 'TeamDiscussionComment' }
    | { __typename: 'TeamRemoveMemberAuditEntry' }
    | { __typename: 'TeamRemoveRepositoryAuditEntry' }
    | { __typename: 'Topic' }
    | { __typename: 'TransferredEvent' }
    | { __typename: 'Tree' }
    | { __typename: 'UnassignedEvent' }
    | { __typename: 'UnlabeledEvent' }
    | { __typename: 'UnlockedEvent' }
    | { __typename: 'UnmarkedAsDuplicateEvent' }
    | { __typename: 'UnpinnedEvent' }
    | { __typename: 'UnsubscribedEvent' }
    | { __typename: 'User' }
    | { __typename: 'UserBlockedEvent' }
    | { __typename: 'UserContentEdit' }
    | { __typename: 'UserList' }
    | { __typename: 'UserNamespaceRepository' }
    | { __typename: 'UserStatus' }
    | { __typename: 'VerifiableDomain' }
    | { __typename: 'Workflow' }
    | { __typename: 'WorkflowRun' }
    | { __typename: 'WorkflowRunFile' }
   | null> };

export type ViewerTeamsQueryVariables = Exact<{
  owner: string;
  viewer: string;
}>;


export type ViewerTeamsQuery = { repositoryOwner:
    | { __typename: 'Organization', teams: { nodes: Array<{ slug: string } | null> | null } }
    | { __typename: 'User' }
   | null };

export type PullRequestDetailQueryVariables = Exact<{
  id: string | number;
}>;


export type PullRequestDetailQuery = { node:
    | { __typename: 'AddedToMergeQueueEvent' }
    | { __typename: 'AddedToProjectEvent' }
    | { __typename: 'App' }
    | { __typename: 'AssignedEvent' }
    | { __typename: 'AutoMergeDisabledEvent' }
    | { __typename: 'AutoMergeEnabledEvent' }
    | { __typename: 'AutoRebaseEnabledEvent' }
    | { __typename: 'AutoSquashEnabledEvent' }
    | { __typename: 'AutomaticBaseChangeFailedEvent' }
    | { __typename: 'AutomaticBaseChangeSucceededEvent' }
    | { __typename: 'BaseRefChangedEvent' }
    | { __typename: 'BaseRefDeletedEvent' }
    | { __typename: 'BaseRefForcePushedEvent' }
    | { __typename: 'Blob' }
    | { __typename: 'Bot' }
    | { __typename: 'BranchProtectionRule' }
    | { __typename: 'BypassForcePushAllowance' }
    | { __typename: 'BypassPullRequestAllowance' }
    | { __typename: 'CWE' }
    | { __typename: 'CheckRun' }
    | { __typename: 'CheckSuite' }
    | { __typename: 'ClosedEvent' }
    | { __typename: 'CodeOfConduct' }
    | { __typename: 'CommentDeletedEvent' }
    | { __typename: 'Commit' }
    | { __typename: 'CommitComment' }
    | { __typename: 'CommitCommentThread' }
    | { __typename: 'Comparison' }
    | { __typename: 'ConnectedEvent' }
    | { __typename: 'ConvertToDraftEvent' }
    | { __typename: 'ConvertedNoteToIssueEvent' }
    | { __typename: 'ConvertedToDiscussionEvent' }
    | { __typename: 'CrossReferencedEvent' }
    | { __typename: 'DemilestonedEvent' }
    | { __typename: 'DependencyGraphManifest' }
    | { __typename: 'DeployKey' }
    | { __typename: 'DeployedEvent' }
    | { __typename: 'Deployment' }
    | { __typename: 'DeploymentEnvironmentChangedEvent' }
    | { __typename: 'DeploymentReview' }
    | { __typename: 'DeploymentStatus' }
    | { __typename: 'DisconnectedEvent' }
    | { __typename: 'Discussion' }
    | { __typename: 'DiscussionCategory' }
    | { __typename: 'DiscussionComment' }
    | { __typename: 'DiscussionPoll' }
    | { __typename: 'DiscussionPollOption' }
    | { __typename: 'DraftIssue' }
    | { __typename: 'Enterprise' }
    | { __typename: 'EnterpriseAdministratorInvitation' }
    | { __typename: 'EnterpriseIdentityProvider' }
    | { __typename: 'EnterpriseMemberInvitation' }
    | { __typename: 'EnterpriseRepositoryInfo' }
    | { __typename: 'EnterpriseServerInstallation' }
    | { __typename: 'EnterpriseServerUserAccount' }
    | { __typename: 'EnterpriseServerUserAccountEmail' }
    | { __typename: 'EnterpriseServerUserAccountsUpload' }
    | { __typename: 'EnterpriseUserAccount' }
    | { __typename: 'Environment' }
    | { __typename: 'ExternalIdentity' }
    | { __typename: 'Gist' }
    | { __typename: 'GistComment' }
    | { __typename: 'HeadRefDeletedEvent' }
    | { __typename: 'HeadRefForcePushedEvent' }
    | { __typename: 'HeadRefRestoredEvent' }
    | { __typename: 'IpAllowListEntry' }
    | { __typename: 'Issue' }
    | { __typename: 'IssueComment' }
    | { __typename: 'Label' }
    | { __typename: 'LabeledEvent' }
    | { __typename: 'Language' }
    | { __typename: 'License' }
    | { __typename: 'LinkedBranch' }
    | { __typename: 'LockedEvent' }
    | { __typename: 'Mannequin' }
    | { __typename: 'MarkedAsDuplicateEvent' }
    | { __typename: 'MarketplaceCategory' }
    | { __typename: 'MarketplaceListing' }
    | { __typename: 'MemberFeatureRequestNotification' }
    | { __typename: 'MembersCanDeleteReposClearAuditEntry' }
    | { __typename: 'MembersCanDeleteReposDisableAuditEntry' }
    | { __typename: 'MembersCanDeleteReposEnableAuditEntry' }
    | { __typename: 'MentionedEvent' }
    | { __typename: 'MergeQueue' }
    | { __typename: 'MergeQueueEntry' }
    | { __typename: 'MergedEvent' }
    | { __typename: 'MigrationSource' }
    | { __typename: 'Milestone' }
    | { __typename: 'MilestonedEvent' }
    | { __typename: 'MovedColumnsInProjectEvent' }
    | { __typename: 'OIDCProvider' }
    | { __typename: 'OauthApplicationCreateAuditEntry' }
    | { __typename: 'OrgAddBillingManagerAuditEntry' }
    | { __typename: 'OrgAddMemberAuditEntry' }
    | { __typename: 'OrgBlockUserAuditEntry' }
    | { __typename: 'OrgConfigDisableCollaboratorsOnlyAuditEntry' }
    | { __typename: 'OrgConfigEnableCollaboratorsOnlyAuditEntry' }
    | { __typename: 'OrgCreateAuditEntry' }
    | { __typename: 'OrgDisableOauthAppRestrictionsAuditEntry' }
    | { __typename: 'OrgDisableSamlAuditEntry' }
    | { __typename: 'OrgDisableTwoFactorRequirementAuditEntry' }
    | { __typename: 'OrgEnableOauthAppRestrictionsAuditEntry' }
    | { __typename: 'OrgEnableSamlAuditEntry' }
    | { __typename: 'OrgEnableTwoFactorRequirementAuditEntry' }
    | { __typename: 'OrgInviteMemberAuditEntry' }
    | { __typename: 'OrgInviteToBusinessAuditEntry' }
    | { __typename: 'OrgOauthAppAccessApprovedAuditEntry' }
    | { __typename: 'OrgOauthAppAccessBlockedAuditEntry' }
    | { __typename: 'OrgOauthAppAccessDeniedAuditEntry' }
    | { __typename: 'OrgOauthAppAccessRequestedAuditEntry' }
    | { __typename: 'OrgOauthAppAccessUnblockedAuditEntry' }
    | { __typename: 'OrgRemoveBillingManagerAuditEntry' }
    | { __typename: 'OrgRemoveMemberAuditEntry' }
    | { __typename: 'OrgRemoveOutsideCollaboratorAuditEntry' }
    | { __typename: 'OrgRestoreMemberAuditEntry' }
    | { __typename: 'OrgUnblockUserAuditEntry' }
    | { __typename: 'OrgUpdateDefaultRepositoryPermissionAuditEntry' }
    | { __typename: 'OrgUpdateMemberAuditEntry' }
    | { __typename: 'OrgUpdateMemberRepositoryCreationPermissionAuditEntry' }
    | { __typename: 'OrgUpdateMemberRepositoryInvitationPermissionAuditEntry' }
    | { __typename: 'Organization' }
    | { __typename: 'OrganizationIdentityProvider' }
    | { __typename: 'OrganizationInvitation' }
    | { __typename: 'OrganizationMigration' }
    | { __typename: 'Package' }
    | { __typename: 'PackageFile' }
    | { __typename: 'PackageTag' }
    | { __typename: 'PackageVersion' }
    | { __typename: 'ParentIssueAddedEvent' }
    | { __typename: 'ParentIssueRemovedEvent' }
    | { __typename: 'PinnedDiscussion' }
    | { __typename: 'PinnedEnvironment' }
    | { __typename: 'PinnedEvent' }
    | { __typename: 'PinnedIssue' }
    | { __typename: 'PrivateRepositoryForkingDisableAuditEntry' }
    | { __typename: 'PrivateRepositoryForkingEnableAuditEntry' }
    | { __typename: 'Project' }
    | { __typename: 'ProjectCard' }
    | { __typename: 'ProjectColumn' }
    | { __typename: 'ProjectV2' }
    | { __typename: 'ProjectV2Field' }
    | { __typename: 'ProjectV2Item' }
    | { __typename: 'ProjectV2ItemFieldDateValue' }
    | { __typename: 'ProjectV2ItemFieldIterationValue' }
    | { __typename: 'ProjectV2ItemFieldNumberValue' }
    | { __typename: 'ProjectV2ItemFieldSingleSelectValue' }
    | { __typename: 'ProjectV2ItemFieldTextValue' }
    | { __typename: 'ProjectV2IterationField' }
    | { __typename: 'ProjectV2SingleSelectField' }
    | { __typename: 'ProjectV2StatusUpdate' }
    | { __typename: 'ProjectV2View' }
    | { __typename: 'ProjectV2Workflow' }
    | { __typename: 'PublicKey' }
    | { __typename: 'PullRequest', bodyHTML: string, additions: number, deletions: number, changedFiles: number, commits: { nodes: Array<{ commit: { statusCheckRollup: { contexts: { nodes: Array<
                  | { __typename: 'CheckRun', name: string, status: CheckStatusState, conclusion: CheckConclusionState | null, startedAt: string | null, completedAt: string | null, detailsUrl: string | null, isRequired: boolean }
                  | { __typename: 'StatusContext', context: string, state: StatusState, targetUrl: string | null, isRequired: boolean }
                 | null> | null } } | null } } | null> | null }, files: { nodes: Array<{ path: string, additions: number, deletions: number } | null> | null } | null }
    | { __typename: 'PullRequestCommit' }
    | { __typename: 'PullRequestCommitCommentThread' }
    | { __typename: 'PullRequestReview' }
    | { __typename: 'PullRequestReviewComment' }
    | { __typename: 'PullRequestReviewThread' }
    | { __typename: 'PullRequestThread' }
    | { __typename: 'Push' }
    | { __typename: 'PushAllowance' }
    | { __typename: 'Query' }
    | { __typename: 'Reaction' }
    | { __typename: 'ReadyForReviewEvent' }
    | { __typename: 'Ref' }
    | { __typename: 'ReferencedEvent' }
    | { __typename: 'Release' }
    | { __typename: 'ReleaseAsset' }
    | { __typename: 'RemovedFromMergeQueueEvent' }
    | { __typename: 'RemovedFromProjectEvent' }
    | { __typename: 'RenamedTitleEvent' }
    | { __typename: 'ReopenedEvent' }
    | { __typename: 'RepoAccessAuditEntry' }
    | { __typename: 'RepoAddMemberAuditEntry' }
    | { __typename: 'RepoAddTopicAuditEntry' }
    | { __typename: 'RepoArchivedAuditEntry' }
    | { __typename: 'RepoChangeMergeSettingAuditEntry' }
    | { __typename: 'RepoConfigDisableAnonymousGitAccessAuditEntry' }
    | { __typename: 'RepoConfigDisableCollaboratorsOnlyAuditEntry' }
    | { __typename: 'RepoConfigDisableContributorsOnlyAuditEntry' }
    | { __typename: 'RepoConfigDisableSockpuppetDisallowedAuditEntry' }
    | { __typename: 'RepoConfigEnableAnonymousGitAccessAuditEntry' }
    | { __typename: 'RepoConfigEnableCollaboratorsOnlyAuditEntry' }
    | { __typename: 'RepoConfigEnableContributorsOnlyAuditEntry' }
    | { __typename: 'RepoConfigEnableSockpuppetDisallowedAuditEntry' }
    | { __typename: 'RepoConfigLockAnonymousGitAccessAuditEntry' }
    | { __typename: 'RepoConfigUnlockAnonymousGitAccessAuditEntry' }
    | { __typename: 'RepoCreateAuditEntry' }
    | { __typename: 'RepoDestroyAuditEntry' }
    | { __typename: 'RepoRemoveMemberAuditEntry' }
    | { __typename: 'RepoRemoveTopicAuditEntry' }
    | { __typename: 'Repository' }
    | { __typename: 'RepositoryInvitation' }
    | { __typename: 'RepositoryMigration' }
    | { __typename: 'RepositoryRule' }
    | { __typename: 'RepositoryRuleset' }
    | { __typename: 'RepositoryRulesetBypassActor' }
    | { __typename: 'RepositoryTopic' }
    | { __typename: 'RepositoryVisibilityChangeDisableAuditEntry' }
    | { __typename: 'RepositoryVisibilityChangeEnableAuditEntry' }
    | { __typename: 'RepositoryVulnerabilityAlert' }
    | { __typename: 'ReviewDismissalAllowance' }
    | { __typename: 'ReviewDismissedEvent' }
    | { __typename: 'ReviewRequest' }
    | { __typename: 'ReviewRequestRemovedEvent' }
    | { __typename: 'ReviewRequestedEvent' }
    | { __typename: 'SavedReply' }
    | { __typename: 'SecurityAdvisory' }
    | { __typename: 'SponsorsActivity' }
    | { __typename: 'SponsorsListing' }
    | { __typename: 'SponsorsListingFeaturedItem' }
    | { __typename: 'SponsorsTier' }
    | { __typename: 'Sponsorship' }
    | { __typename: 'SponsorshipNewsletter' }
    | { __typename: 'Status' }
    | { __typename: 'StatusCheckRollup' }
    | { __typename: 'StatusContext' }
    | { __typename: 'SubIssueAddedEvent' }
    | { __typename: 'SubIssueRemovedEvent' }
    | { __typename: 'SubscribedEvent' }
    | { __typename: 'Tag' }
    | { __typename: 'Team' }
    | { __typename: 'TeamAddMemberAuditEntry' }
    | { __typename: 'TeamAddRepositoryAuditEntry' }
    | { __typename: 'TeamChangeParentTeamAuditEntry' }
    | { __typename: 'TeamDiscussion' }
    | { __typename: 'TeamDiscussionComment' }
    | { __typename: 'TeamRemoveMemberAuditEntry' }
    | { __typename: 'TeamRemoveRepositoryAuditEntry' }
    | { __typename: 'Topic' }
    | { __typename: 'TransferredEvent' }
    | { __typename: 'Tree' }
    | { __typename: 'UnassignedEvent' }
    | { __typename: 'UnlabeledEvent' }
    | { __typename: 'UnlockedEvent' }
    | { __typename: 'UnmarkedAsDuplicateEvent' }
    | { __typename: 'UnpinnedEvent' }
    | { __typename: 'UnsubscribedEvent' }
    | { __typename: 'User' }
    | { __typename: 'UserBlockedEvent' }
    | { __typename: 'UserContentEdit' }
    | { __typename: 'UserList' }
    | { __typename: 'UserNamespaceRepository' }
    | { __typename: 'UserStatus' }
    | { __typename: 'VerifiableDomain' }
    | { __typename: 'Workflow' }
    | { __typename: 'WorkflowRun' }
    | { __typename: 'WorkflowRunFile' }
   | null };
