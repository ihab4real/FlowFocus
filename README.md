# FlowFocus

A full-stack productivity dashboard combining task management, notes, a Pomodoro timer, and a habit tracker built with the MERN stack.

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

## Setup

### Prerequisites

- Node.js
- MongoDB

### Installation

```bash
# Clone the repository
git clone [repository-url]
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

## API Endpoints

The API includes endpoints for user authentication, task management, notes, and habit tracking. See the [API documentation](./docs/server/api-documentation.md) for details.
