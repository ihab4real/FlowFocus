# Version Control Strategy

This document outlines the version control strategy for the `FlowFocus` MERN stack monorepo, which includes a React frontend (`client/`) and an Express backend (`server/`). The goal is to maintain a clean, consistent, and collaborative Git history.

## Repository Structure

FlowFocus/
├── client/ # React frontend
├── server/ # Express backend
├── docs/ # Documentation (e.g., this file)
├── .gitignore
└── README.md

## Git Workflow

### Branching Strategy

- **`main`**: Stable, production-ready branch.
- **`develop`**: Integration branch for features and fixes before merging to `main`.
- **Feature Branches**: Named `feature/<description>` (e.g., `feature/add-authentication`) for new functionality.
- **Bugfix Branches**: Named `bugfix/<description>` (e.g., `bugfix/fix-cors-issue`) for bug fixes.
- **Hotfix Branches**: Named `hotfix/<description>` (e.g., `hotfix/patch-api-endpoint`) for urgent production fixes.

### Workflow Steps

1. **Start Work**: Create a branch from `develop` (e.g., `git checkout -b feature/add-contact-form`).
2. **Commit Changes**: Use small, focused commits with the structure below.
3. **Push and PR**: Push the branch (`git push origin <branch-name>`) and open a pull request to `develop`.
4. **Merge**: After review, merge the PR into `develop`. Squash commits if the history is messy.
5. **Release**: Merge `develop` into `main` for production releases and tag them (e.g., `git tag -a v1.0.0`).

### Tagging

- Use annotated tags for releases (e.g., `git tag -a v1.0.0 -m "Initial release"`).
- Push tags to remote: `git push origin <tag-name>`.

## Commit Message Structure

We use the [Conventional Commits](https://www.conventionalcommits.org/) format for consistency and automation potential.

### Format

```
<type>(<scope>): <short description>
<BLANK LINE>
<body> (optional)
<BLANK LINE>
<footer> (optional)
```

- **Type**: feat, fix, docs, style, refactor, test, chore.
- **Scope**: Affected area (e.g., client, server, ui, api).
- **Short Description**: Concise summary (50 characters or less).
- **Body**: Additional context (wrap at 72 characters).
- **Footer**: Metadata (e.g., Closes #123).

### Examples

```
feat(client/ui): add contact form component
```

```
fix(server/api): resolve CORS issue in middleware

Added proper headers to allow cross-origin requests.
```

```
docs(readme): update installation instructions
```

```
chore(deps): bump react to v18.3.0
```

## Change Categories and Subcategories

Changes are categorized to improve readability and searchability in the commit history.

### Categories

- **Client**: Frontend changes (client/).
  - **UI**: Visuals or layout.
  - **Logic**: State management, hooks, or business logic.
  - **Assets**: Images, styles, or static files.
  - **Tests**: Frontend tests.
- **Server**: Backend changes (server/).
  - **API**: Endpoints or routes.
  - **DB**: Database schema or queries.
  - **Middleware**: Auth, logging, or error handling.
  - **Tests**: Backend tests.
- **Shared**: Cross-cutting changes.
  - **Config**: Build scripts or environment setup.
  - **Deps**: Dependency updates.
- **Docs**: Documentation.
  - **Readme**: README.md updates.
  - **Comments**: Inline code docs.
- **Chore**: Maintenance.
  - **Build**: Build process or CI/CD.
  - **Git**: .gitignore or Git config.

### Examples

```
feat(client/ui): redesign navbar with responsive layout
```

```
fix(server/db): correct user schema validation
```

```
test(client/logic): add tests for auth reducer
```

## Best Practices

- **Small Commits**: One logical change per commit (e.g., separate client/ and server/ unless coupled).
- **Imperative Mood**: Use "Add feature" not "Added feature".
- **Separate Concerns**: Avoid mixing unrelated changes (e.g., UI tweaks with dependency updates).
- **Review History**: Use `git log --oneline` to ensure clarity.
- **Squash Messy Commits**: Combine experimental commits into a single meaningful one before merging.

## .gitignore

Ensure the following are excluded:

```
node_modules/
client/build/
*.log
.env
```
