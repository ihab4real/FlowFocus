# FlowFocus

![CI Pipeline](https://github.com/ihabadham/FlowFocus/actions/workflows/ci.yml/badge.svg) ![Deploy Pipeline](https://github.com/ihabadham/FlowFocus/actions/workflows/deploy.yml/badge.svg)

A full-stack productivity dashboard combining task management, notes, a Pomodoro timer, and a habit tracker built with the MERN stack.

🌐 **Live Demo**: [https://flowfocus.bestoneclinic.com](https://flowfocus.bestoneclinic.com)

## Features

- **Authentication & User Management**: JWT-based auth with refresh tokens
- **Task Management**: Trello-like board with drag-and-drop functionality
- **Notes Section**: Rich text editor with folder organization
- **Pomodoro Timer**: Custom work/break intervals with session history
- **Habit Tracker**: Streak counter with monthly progress tracking

## Tech Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **Authentication**: JWT (Access + Refresh Tokens)
- **Deployment**: Ubuntu VPS with PM2 + Apache
- **CI/CD**: GitHub Actions with CI and deployment workflows

## Setup

### Prerequisites

- Node.js
- MongoDB

### Installation

```bash
# Clone the repository
git clone https://github.com/ihabadham/FlowFocus.git
cd FlowFocus

# Install dependencies
npm install
cd client && npm install
cd ../server && npm install
```

### Running the Application

```bash
# Run both client and server concurrently
npm run dev

# Run server only
npm run server

# Run client only
npm run client
```

## Project Structure

- `/client` - React frontend
- `/server` - Express backend
- `/docs` - Project documentation
- `/.github/workflows` - CI/CD pipeline configuration

## CI/CD Pipeline

- 📚 [Complete CI/CD Pipeline Documentation](./docs/ci-cd-pipeline.md)

### Local Development

```bash
# Check code formatting
npm run format -- --check

# Run linting
cd client && npm run lint

# Run tests
npm test

# Security audit
cd client && npm audit && cd ../server && npm audit
```

## Deployment

The application is automatically deployed to production on every push to the `main` branch.

- **Production URL**: https://flowfocus.bestoneclinic.com
- **Deployment Target**: Ubuntu VPS with Hostinger
- **Process Manager**: PM2
- **Web Server**: Apache (reverse proxy)
- **Deployment Status**: Check the [Actions tab](https://github.com/ihabadham/FlowFocus/actions) for latest deployments

### Manual Deployment

To deploy manually:

1. Go to the [Actions tab](https://github.com/ihabadham/FlowFocus/actions)
2. Select "Deploy to Production"
3. Click "Run workflow" on the `main` branch

## API Endpoints

The API includes endpoints for user authentication, task management, notes, and habit tracking. See the [API documentation](./docs/server/api-documentation.md) for details.
