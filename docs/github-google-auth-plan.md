# GitHub and Google Authentication Implementation Plan

## Overview

This document outlines the plan to implement GitHub and Google OAuth authentication for the FlowFocus application to address [Issue #7](https://github.com/ihab4real/FlowFocus/issues/7). This will allow users to sign up and log in using their GitHub or Google accounts in addition to the existing email/password authentication.

## Git Workflow

Following our [version control strategy](./version-control.md):

1. Create a feature branch from `develop`:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/oauth-authentication
   ```

2. Make commits following our conventional format:

   ```
   feat(server/auth): add Google OAuth strategy
   feat(client/auth): implement GitHub login button
   ```

3. Push the branch and create a PR:

   ```bash
   git push origin feature/oauth-authentication
   # Then create PR through GitHub interface
   ```

4. After review (self-review in this case), merge to `develop`

## Implementation Plan

### 1. Server-Side Implementation

#### 1.1 Install Dependencies

```bash
cd server
npm install passport passport-google-oauth20 passport-github2 --save
```

#### 1.2 Configure Passport Strategies

Create a new file `server/config/passport.js`:

- Configure Passport with Google and GitHub strategies
- Set up serialization/deserialization of user

#### 1.3 Set Up Environment Variables

Add to `.env`:

```
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
OAUTH_CALLBACK_BASE_URL=http://localhost:3000/api/auth
```

#### 1.4 Update User Model

Modify `server/models/userModel.js`:

- Add fields for OAuth providers:
  - `providerId` (Google or GitHub user ID)
  - `provider` (enum: 'local', 'google', 'github')
  - Make password optional when provider is not 'local'

#### 1.5 Add OAuth Routes

Update `server/routes/authRoutes.js`:

- Add routes for initiating OAuth flow
- Add callback routes for OAuth providers
- Ensure they integrate with existing JWT token system

#### 1.6 Update Auth Controller & Services

Modify `server/controllers/authController.js` and `server/services/authService.js`:

- Add functions to handle OAuth authentication flow
- Ensure proper account linking if emails match

### 2. Client-Side Implementation

#### 2.1 Install Dependencies

```bash
cd client
npm install @react-oauth/google --save
```

#### 2.2 Add OAuth Provider Buttons

Update login and register components:

- Add visually distinct buttons for Google and GitHub login
- Implement onClick handlers that redirect to appropriate server endpoints

#### 2.3 Handle OAuth Redirects

Create a redirect handler component:

- Capture OAuth callback in the client
- Process authentication tokens in URL parameters
- Store tokens in the same way as traditional login

#### 2.4 Update Authentication Store/Context

Modify authentication state management:

- Add provider information to user state
- Update authentication flows to handle OAuth

### 3. Integration and Flow

1. User clicks "Login with Google/GitHub" button
2. Browser redirects to OAuth provider authentication page
3. After authentication, provider redirects back to our callback URL
4. Server verifies the OAuth details, creates or retrieves user account
5. Server issues JWT tokens, same as traditional login
6. Client stores tokens and updates UI to reflect authenticated state

## Required OAuth Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Navigate to APIs & Services > Credentials
4. Create OAuth client ID credentials (Web application type)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - Production URL when deployed
6. Note Client ID and Client Secret for `.env` file

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:3000/api/auth/github/callback` (development)
   - Production URL when deployed
4. Note Client ID and Client Secret for `.env` file

## Testing Plan

### Manual Testing Checklist

- [ ] Login with Google works (new user)
- [ ] Login with Google works (returning user)
- [ ] Login with GitHub works (new user)
- [ ] Login with GitHub works (returning user)
- [ ] Correct user profile is displayed after OAuth login
- [ ] JWT refresh token system works with OAuth accounts
- [ ] Account linking works if a user with the same email exists
- [ ] Error handling works for OAuth failures

### Automated Testing (Optional)

- Add tests for OAuth controller and service logic
- Mock OAuth provider responses

## Timeline Estimate

- Setup and configuration: 1 day
- Server-side implementation: 2 days
- Client-side implementation: 2 days
- Testing and debugging: 1 day
- Total: ~6 days

## Resources

- [Passport.js Documentation](http://www.passportjs.org/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [React OAuth/Google Package](https://github.com/MomenSherif/react-oauth)
