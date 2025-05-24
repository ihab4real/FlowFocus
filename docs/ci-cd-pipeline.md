# CI/CD Pipeline Documentation

## 🚀 Overview

This document outlines the CI/CD pipeline implementation for the FlowFocus MERN stack monorepo. The pipeline is designed to maintain code quality, catch issues early, and streamline the development workflow.

## 📊 Pipeline Status

![CI Pipeline](https://github.com/YOUR_GITHUB_USERNAME/FlowFocus/actions/workflows/ci.yml/badge.svg)

## 🔧 Current Implementation (CI Focus)

### **Pipeline Triggers**

- Push to `main` and `develop` branches
- Pull requests targeting `main` and `develop`
- Manual workflow dispatch

### **Pipeline Jobs**

#### 1. **Code Quality & Linting** 🎨

- **Purpose**: Ensures consistent code formatting and catches linting issues
- **What it does**:
  - Verifies Prettier formatting
  - Runs ESLint on client code
  - Conditionally runs server linting (when configured)
- **Tools**: Prettier, ESLint

#### 2. **Test Frontend** ⚛️

- **Purpose**: Validates React frontend functionality across Node.js versions
- **What it does**:
  - Runs Jest tests for the React app
  - Builds the Vite production bundle
  - Tests on Node.js 18, 20, and 22
  - Uploads build artifacts for review
- **Tools**: Jest, Vite, Testing Library

#### 3. **Test Backend** 🌐

- **Purpose**: Validates Express backend functionality with real MongoDB
- **What it does**:
  - Runs Jest tests with MongoDB test instance
  - Tests on Node.js 18, 20, and 22
  - Uses MongoDB Docker service for integration tests
- **Tools**: Jest, Supertest, MongoDB Memory Server

#### 4. **Security Audit** 🔒

- **Purpose**: Identifies security vulnerabilities and outdated dependencies
- **What it does**:
  - Runs `npm audit` on both client and server
  - Reports outdated packages
  - Fails on moderate+ security issues
- **Tools**: npm audit

#### 5. **Integration Check** 🔗

- **Purpose**: Ensures both apps can start and work together
- **What it does**:
  - Installs all dependencies across the monorepo
  - Tests that both client and server can start
  - Validates development environment setup
- **Dependencies**: Requires all previous jobs to pass

#### 6. **Conventional Commits** 📝

- **Purpose**: Validates commit message format (PR only)
- **What it does**:
  - Checks commit messages follow conventional commit standards
  - Validates against configured scopes and types
  - Aligns with project's git workflow strategy
- **Tools**: Commitlint

## 📋 Configuration Files

### **Workflow File**

- **Location**: `.github/workflows/ci.yml`
- **Purpose**: Main CI pipeline definition

### **Commitlint Config**

- **Location**: `.commitlintrc.json`
- **Purpose**: Validates conventional commit format
- **Allowed Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `revert`
- **Allowed Scopes**: Matches project structure (client, server, docs, etc.)

## 🚦 Status Checks

The following checks must pass before merging PRs:

- ✅ Code Quality & Linting
- ✅ Test Frontend (Node.js 18, 20, 22)
- ✅ Test Backend (Node.js 18, 20, 22)
- ✅ Security Audit
- ✅ Integration Check
- ✅ Conventional Commits (PRs only)

## 📈 Benefits

### **For Development**

- **Early Issue Detection**: Catches problems before they reach main branches
- **Consistent Code Quality**: Automated formatting and linting enforcement
- **Cross-Environment Testing**: Validates compatibility across Node.js versions
- **Security Awareness**: Regular dependency vulnerability scanning

### **For CV/Portfolio**

- **Professional Standards**: Shows understanding of modern DevOps practices
- **Code Quality**: Demonstrates commitment to maintainable code
- **Documentation**: Well-documented processes and workflows
- **Automation**: Exhibits knowledge of CI/CD best practices

## 🔮 Future Enhancements (CD Phase)

When ready for deployment to Ubuntu VPS:

### **Planned CD Components**

- **Docker Containerization**: Multi-stage builds for client/server
- **Environment Management**: Staging and production configurations
- **Database Migrations**: Automated MongoDB schema updates
- **VPS Deployment**: SSH-based deployment to Ubuntu server
- **Health Checks**: Application monitoring and rollback capabilities
- **SSL/Domain**: HTTPS setup and domain configuration

### **Potential Workflow**

```yaml
# Future CD workflow structure
deploy-staging:
  - Build Docker images
  - Deploy to staging environment
  - Run smoke tests
  - Await manual approval

deploy-production:
  - Deploy to production VPS
  - Run health checks
  - Send deployment notifications
```

## 🛠 Local Development

### **Running CI Checks Locally**

```bash
# Check code formatting
npm run format -- --check

# Lint client code
cd client && npm run lint

# Run all tests
npm test

# Security audit
cd client && npm audit
cd ../server && npm audit
```

### **Pre-commit Hooks** (Optional Enhancement)

Consider adding Husky for local commit validation:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run format -- --check"
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

## 📊 Monitoring & Metrics

### **Current Tracking**

- Build success/failure rates
- Test coverage (when implemented)
- Security vulnerability counts
- Build duration trends

### **GitHub Integration**

- Status checks on PRs
- Build artifacts for review
- Automated failure notifications
- Branch protection rules

## 🤝 Contributing

When contributing to this project:

1. **Follow Conventional Commits**: Use the established format and scopes
2. **Ensure All Checks Pass**: Pipeline must be green before merging
3. **Write Tests**: Add tests for new features and bug fixes
4. **Update Documentation**: Keep docs in sync with changes

## 🆘 Troubleshooting

### **Common Issues**

**Pipeline Fails on Formatting**

```bash
# Fix locally
npm run format
git add .
git commit -m "style: fix code formatting"
```

**Tests Fail Locally**

```bash
# Client tests
cd client && npm test

# Server tests
cd server && npm test
```

**Security Vulnerabilities**

```bash
# Auto-fix where possible
npm audit fix

# Manual review for breaking changes
npm audit
```

---

This pipeline evolves with the project. As new requirements emerge, we'll enhance it accordingly while maintaining the balance between thoroughness and development velocity.
