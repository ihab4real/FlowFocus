# CI/CD Pipeline Documentation

## Overview

This document outlines the CI/CD pipeline implementation for the FlowFocus MERN stack monorepo. The pipeline maintains code quality, catches issues early, and automatically deploys to production VPS using separate CI and CD workflows.

## Pipeline Status

![CI Pipeline](https://github.com/ihab4real/FlowFocus/actions/workflows/ci.yml/badge.svg)
![Deploy Pipeline](https://github.com/ihab4real/FlowFocus/actions/workflows/deploy.yml/badge.svg)

## Pipeline Architecture

### Separated Workflows

- **`ci.yml`** - Continuous Integration (runs on all branches and PRs)
- **`deploy.yml`** - Continuous Deployment (runs only after CI passes on main)

### Pipeline Triggers

#### CI Pipeline (`ci.yml`)

- Push to `main` and `develop` branches
- Pull requests targeting `main` and `develop`
- Manual workflow dispatch

#### CD Pipeline (`deploy.yml`)

- Automatically triggered when CI completes successfully on `main` branch
- Manual deployment trigger with branch selection
- Only deploys if CI pipeline passes

### Workflow Dependencies

```
Push to main → CI Pipeline → (if successful) → CD Pipeline → Production
```

## CI Pipeline Jobs (`ci.yml`)

#### 1. Code Quality & Linting

- **Purpose**: Ensures consistent code formatting and catches linting issues
- **Actions**:
  - Verifies Prettier formatting
  - Runs ESLint on client code
  - Conditionally runs server linting (when configured)
- **Tools**: Prettier, ESLint

#### 2. Test Frontend

- **Purpose**: Validates React frontend functionality
- **Actions**:
  - Runs Jest tests for the React app
  - Builds the Vite production bundle
  - Tests on Node.js 20
  - Uploads build artifacts for review
- **Tools**: Jest, Vite, Testing Library

#### 3. Test Backend

- **Purpose**: Validates Express backend functionality with real MongoDB
- **Actions**:
  - Runs Jest tests with MongoDB test instance
  - Tests on Node.js 20
  - Uses MongoDB Docker service for integration tests
- **Tools**: Jest, Supertest, MongoDB Memory Server

#### 4. Security Audit

- **Purpose**: Identifies security vulnerabilities and outdated dependencies
- **Actions**:
  - Runs `npm audit` on both client and server
  - Reports outdated packages
  - Fails on moderate+ security issues
- **Tools**: npm audit

#### 5. Integration Check

- **Purpose**: Ensures both apps can start and work together
- **Actions**:
  - Installs all dependencies across the monorepo
  - Tests that both client and server can start
  - Validates development environment setup
- **Dependencies**: Requires all previous jobs to pass

## CD Pipeline Jobs (`deploy.yml`)

#### Deploy to Production

- **Purpose**: Automated deployment to Ubuntu VPS
- **Trigger**: Only after CI pipeline completes successfully on `main` branch
- **Actions**:
  - Connects to VPS via SSH
  - Creates timestamped backup of current deployment
  - Pulls latest code from GitHub
  - Installs/updates dependencies
  - Builds client application
  - Restarts PM2 backend service
  - Restarts Apache reverse proxy
  - Performs health check
  - Provides deployment summary
  - Cleans up old backups (keeps last 5)
- **Tools**: SSH, PM2, Apache2, curl
- **Target**: https://flowfocus.bestoneclinic.com

## Required GitHub Secrets

### VPS Deployment Secrets

- `VPS_HOST` - VPS hostname/IP
- `VPS_USER` - VPS username
- `VPS_SSH_PRIVATE_KEY` - SSH private key content for deployment

### Setting Up Secrets

1. Navigate to GitHub repository Settings → Secrets and variables → Actions
2. Add each secret with the exact names above
3. Ensure SSH key is properly formatted with headers and footers

## Configuration Files

### Workflow Files

- **Location**: `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`
- **Purpose**: Separated CI and CD pipeline definitions

### Deployment Architecture

```
GitHub Actions (CI) → GitHub Actions (CD) → Ubuntu VPS
                                        ↓
                                    /var/www/flowfocus/
                                        ├── client/ (React + Vite)
                                        ├── server/ (Express + PM2)
                                        └── Apache Reverse Proxy
```

### Commitlint Config

- **Location**: `.commitlintrc.json`
- **Purpose**: Validates conventional commit format
- **Allowed Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `revert`
- **Allowed Scopes**: Matches project structure (client, server, docs, etc.)

## Status Checks

### CI Pipeline Status Checks (Required for all PRs)

- ✅ Code Quality & Linting
- ✅ Test Frontend (Node.js 20)
- ✅ Test Backend (Node.js 20)
- ✅ Security Audit
- ✅ Integration Check

### CD Pipeline (Automatic on main)

- ✅ Deploy to Production (only after CI passes)

## Benefits

### CI Benefits

- **Early Issue Detection**: Catches problems before they reach main branches
- **Consistent Code Quality**: Automated formatting and linting enforcement
- **Standardized Environment**: Validates functionality on Node.js 20
- **Security Awareness**: Regular dependency vulnerability scanning

### CD Benefits

- **Automated Deployment**: Zero-touch deployment to production
- **Consistent Deployments**: Same process every time
- **Rollback Capability**: Automated backups for quick recovery
- **Health Monitoring**: Automatic health checks post-deployment
- **Reduced Downtime**: Fast, automated deployment process

### Separation Benefits

- **Faster CI**: CI pipeline runs quickly without deployment overhead
- **Focused Workflows**: Each pipeline has a clear, single responsibility
- **Better Debugging**: Easier to troubleshoot CI vs deployment issues
- **Flexible Deployment**: Can deploy manually without re-running CI

## Deployment Process

### Automatic Deployment Flow

1. **Push to main** → Triggers CI pipeline
2. **CI Pipeline** → All quality checks must pass
3. **CD Pipeline** → Automatically triggered if CI succeeds
4. **Backup** → Current version backed up with timestamp
5. **Update** → Latest code pulled from GitHub
6. **Build** → Dependencies installed, client built
7. **Restart** → PM2 backend and Apache restarted
8. **Health Check** → Site availability verified
9. **Cleanup** → Old backups removed (keeps last 5)
10. **Summary** → Deployment status reported

### Manual Deployment

#### Option 1: Manual CD Trigger

1. Navigate to Actions tab in GitHub
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Select `main` branch
5. Click "Run workflow"

#### Option 2: Push to Main

Push any change to the `main` branch and both pipelines will run automatically.

## Local Development

### Running CI Checks Locally

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

### VPS Management Commands

```bash
# SSH into VPS
ssh user@vps_host

# Check PM2 status
sudo pm2 list

# Check Apache status
sudo systemctl status apache2

# View deployment logs
sudo journalctl -f

# Check recent backups
ls -la /var/www/flowfocus-backup-*
```

## Monitoring & Metrics

### CI Tracking

- Build success/failure rates for all branches
- Test coverage and performance
- Security vulnerability trends
- Lint and formatting compliance

### CD Tracking

- Deployment success/failure rates
- Deployment duration trends
- Health check response times
- Backup creation verification

### Production Monitoring

- Site availability (automated health checks)
- PM2 process status
- Apache server status
- Disk space usage (for backups)

## Troubleshooting

### CI Pipeline Issues

#### Tests Failing

```bash
# Run tests locally
cd client && npm test
cd ../server && npm test
```

#### Linting Errors

```bash
# Fix formatting
npm run format

# Check linting
cd client && npm run lint
```

### CD Pipeline Issues

#### SSH Connection Failed

**Error**: "Permission denied" or "Host key verification failed"

**Solution**:

```bash
# Verify SSH key works
ssh -T git@github.com
ssh user@vps_host
```

#### PM2 Process Not Starting

**Error**: "Process 'flowfocus-backend' not found"

**Solution**:

```bash
# On VPS, restart PM2 manually
cd /var/www/flowfocus
sudo pm2 restart flowfocus-backend
sudo pm2 logs flowfocus-backend
```

#### Apache Not Responding

**Error**: Site returns 500 or doesn't respond

**Solution**:

```bash
# Check Apache status and logs
sudo systemctl status apache2
sudo journalctl -u apache2 -f
sudo systemctl restart apache2
```

### Rollback Procedure

If deployment fails, rollback can be performed:

```bash
# SSH into VPS
ssh user@vps_host

# Find latest backup
ls -la /var/www/flowfocus-backup-*

# Restore backup (replace with actual backup name)
sudo rm -rf /var/www/flowfocus
sudo mv /var/www/flowfocus-backup-YYYYMMDD-HHMMSS /var/www/flowfocus

# Restart services
sudo pm2 restart flowfocus-backend
sudo systemctl restart apache2
```

## Contributing

When contributing to this project:

1. **Follow Conventional Commits**: Use the established format and scopes
2. **Ensure CI Passes**: All CI checks must be green before merging
3. **Test Thoroughly**: Both local and staging environments
4. **Monitor Deployments**: Check deployment status after merge to main

## Future Enhancements

### Potential Improvements

- **Staging Environment**: Deploy to staging before production
- **Blue-Green Deployment**: Zero-downtime deployments
- **Database Migrations**: Automated schema updates
- **Performance Monitoring**: Response time and error tracking
- **Slack/Discord Integration**: Deployment notifications
- **Environment Variables Management**: Secure config deployment
- **Multi-environment Support**: Dev, staging, and production environments

---

This separated CI/CD pipeline provides a professional, scalable approach that follows industry best practices while maintaining high standards for code quality and deployment reliability.
