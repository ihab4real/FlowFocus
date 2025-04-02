# FlowFocus (Productivity Dashboard - MERN Stack)

## 📌 Project Overview

A full-stack productivity dashboard combining task management, notes, a Pomodoro timer, and a habit tracker. The goal is to build a practical, real-world app with solid authentication and a clean UI.

## 🛠 Tech Stack

- **Frontend:** React (Context API / Zustand) + Tailwind CSS
- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Auth:** JWT (Access + Refresh Tokens), Optional OAuth (Google/GitHub)
- **Deployment:** Vercel (Frontend) + Render (Backend)

## 🔑 Core Features

### **Authentication & User Management**

- Sign up, login, logout (JWT-based auth)
- Refresh token workflow for persistent sessions
- OAuth (Google/GitHub) as an enhancement
- User settings (dark mode, Pomodoro intervals, etc.)

### **Task Management (Trello-like)**

- CRUD tasks with drag-and-drop (React DnD / Beautiful DnD)
- Task categories: Todo, Doing, Done
- Due dates, reminders, and priority levels

### **Notes Section (Notion Lite)**

- Rich text editor (TipTap or Slate.js)
- Organize notes via folders/tags
- Search functionality

### **Pomodoro Timer**

- Custom work/break intervals (stored per user)
- Session history with progress charts (Chart.js)

### **Habit Tracker**

- Streak counter ("X-day streak")
- Monthly progress tracking
- User incentives (e.g., streak-based rewards)

### **UI & UX Enhancements**

- Dark/Light mode toggle (CSS variables + Context API)
- Responsive design with Tailwind CSS
- Prebuilt UI components when useful (e.g., modals, notifications)

## 📌 Core Entities & Relationships

### **User**

- Owns tasks, notes, Pomodoro sessions, and habit streaks
- Stores settings (theme, Pomodoro intervals, etc.)

### **Task**

- Belongs to a user
- Can have a category (Todo, Doing, Done)
- Can have due dates, priority, and reminders

### **Note**

- Belongs to a user
- Organized via folders/tags
- Searchable content

### **Pomodoro Session**

- Belongs to a user
- Stores session duration, breaks, and completion history
- Used for progress visualization

### **Habit**

- Belongs to a user
- Tracks streaks and completion history
- Tied to user incentives (rewards)

## 📅 Development Plan

1. **Setup & Authentication** (JWT-based auth, user model, login/signup API)
2. **Core Features** (Tasks, Notes, Pomodoro, Habit Tracker)
3. **Enhancements** (Search, filtering, data visualization, OAuth)
4. **Deployment & Optimization** (SEO, performance improvements)

---

This README will be updated as development progresses.
