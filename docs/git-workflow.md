# Git Workflow Guide

## Issue to PR to Production

### 1. Create a branch for the issue
```bash
git checkout develop
git pull origin develop
git checkout -b <branch-type>/issue-#<number>-<short-description>
```

Branch types:
- `feature/` - New functionality
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `refactor/` - Code refactoring without changing functionality

Example: `bugfix/issue-#3-notes-scrolling`

### 2. Make your changes locally

### 3. Commit changes with conventional commit format
```bash
git add .
git commit -m "<type>(<scope>): <concise description>"
```

Example: `git commit -m "fix(client/ui): make panels individually scrollable"`

### 4. Push your branch to GitHub
```bash
git push -u origin <your-branch-name>
```

### 5. Create a PR on GitHub
- Go to the repo on GitHub
- Click "Compare & pull request"
- Set base: `develop`, compare: `<your-branch-name>`
- Add description, reference issue number (e.g., "Fixes #3")
- Create PR

### 6. Merge options
- **Merge commit**: Preserves all commits in history (use for feature branches with meaningful commits)
- **Squash and merge**: Combines all branch commits into one (best for most bugfixes)
- **Rebase and merge**: Places commits on top of base branch (use for clean, linear history)

### 7. Update local develop branch
```bash
git checkout develop
git pull origin develop
```

### 8. Update main branch (production)
```bash
git checkout main
git pull origin main
git merge develop
git push origin main
```

### 9. Clean up
```bash
# Delete local branch
git branch -d <your-branch-name>

# Prune remote tracking branches
git fetch --prune
```

## Commit Message Format
```
<type>(<scope>): <description>
```

Example: `fix(client/ui): correct scrolling behavior in notes panels`

- **Types**: feat, fix, docs, style, refactor, test, chore
- **Scope**: Area of the codebase (client/ui, server/api, etc.) 