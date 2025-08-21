# Gmail DISC Extension

## Overview

This project is a full-stack web application that provides AI-powered email categorization and personalized response suggestions based on DISC communication styles. The application integrates with Gmail through OAuth2, analyzes user communication patterns, and provides intelligent email assistance through both a web interface and a Chrome extension.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with CSS custom properties
- **UI Components**: shadcn/ui (Radix UI primitives with custom styling)
- **Build Tool**: Vite with hot reload support

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth with Passport.js and OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **External APIs**: OpenAI GPT-4o for AI analysis, Google Gmail API

### Chrome Extension Architecture
- **Manifest**: Version 3 with service worker background script
- **Content Scripts**: Injected into Gmail pages for real-time analysis
- **Popup Interface**: React-based extension popup
- **Communication**: Message passing between content script and background worker

## Key Components

### Authentication System
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with 7-day TTL
- **Gmail Integration**: OAuth2 flow for Gmail API access
- **User Management**: Automatic user creation and profile management

### Database Schema
- **Users**: Core user data with Gmail tokens and DISC profiles
- **Sender Categories**: User-defined email categorization system
- **Email Classifications**: AI analysis results for processed emails
- **Response Templates**: DISC-style personalized response suggestions
- **Sessions**: Authentication session storage (required for Replit Auth)

### AI Services
- **DISC Analysis**: Analyzes user communication patterns from email samples
- **Email Classification**: Categorizes incoming emails by priority and style
- **Response Generation**: Creates personalized response suggestions
- **Sender Categorization**: Automatically categorizes email senders

### Gmail Integration
- **API Access**: Full Gmail read/write permissions
- **Email Processing**: Real-time email analysis and categorization
- **Response Injection**: Seamless integration of AI suggestions into Gmail compose

## Data Flow

1. **User Authentication**: Replit Auth → User profile creation/retrieval
2. **Gmail Authorization**: OAuth2 flow → Token storage → API access
3. **Email Analysis**: Gmail API → AI processing → Database storage
4. **DISC Profiling**: Email samples → OpenAI analysis → User profile update
5. **Real-time Integration**: Chrome extension → Content script → Background service → API calls
6. **Response Suggestions**: Email context → AI generation → User interface

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **openai**: GPT-4o API integration
- **googleapis**: Gmail API client
- **passport**: Authentication middleware

### UI Dependencies
- **@radix-ui/**: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight routing library

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety and development experience
- **drizzle-kit**: Database migration management

## Deployment Strategy

### Development Environment
- **Database**: Neon PostgreSQL (serverless)
- **Backend**: Express server on port 5000
- **Frontend**: Vite dev server with HMR
- **Extension**: Local development build

### Production Deployment
- **Database**: Neon PostgreSQL with connection pooling
- **Backend**: Node.js server with ESM modules
- **Frontend**: Static build served by Express
- **Extension**: Chrome Web Store distribution

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **OPENAI_API_KEY**: OpenAI API access
- **GOOGLE_CLIENT_ID/SECRET**: Gmail OAuth credentials
- **SESSION_SECRET**: Session encryption key
- **REPLIT_DOMAINS**: Authentication domain configuration

### Build Process
1. **Frontend**: Vite build → Static assets
2. **Backend**: ESBuild → Single bundled module
3. **Extension**: Content scripts + popup compilation
4. **Database**: Drizzle migrations → Schema deployment

## Recent Changes

### July 30, 2025
- ✅ **Chrome Extension Successfully Installed**: User confirmed extension installation works
- ✅ **Extension Files Created**: Complete extension with OAuth, AI analysis, and Gmail integration  
- ✅ **Manifest V3 Compliance**: Fixed permissions structure for Chrome extension standards
- ✅ **Testing Extension Created**: Simple test extension for troubleshooting installation issues
- ✅ **Google OAuth Configured**: User's Client ID integrated for browser extension authentication

### August 6, 2025
- ✅ **Gmail OAuth Setup Fixed**: Resolved 403 error by making onboarding publicly accessible
- ✅ **Extension Popup Updated**: "Setup Gmail Connection" button redirects to web onboarding flow
- ✅ **Web Onboarding Flow**: 3-step process accessible at localhost:5000/onboarding
- ✅ **Backend API Integration**: Extension popup connects to backend for status checks
- ✅ **Route Authentication Fixed**: Onboarding page no longer requires login

### August 8, 2025
- ✅ **Advanced DISC Coaching Feature Implemented**: Complete coaching system with AI analysis
- ✅ **Database Schema Updated**: Added DISC coaching recommendations and analysis tables
- ✅ **OpenAI Integration**: GPT-4o powered DISC personality analysis from email samples
- ✅ **Coaching Dashboard**: Full React interface for DISC profile and recommendations
- ✅ **API Endpoints**: Complete backend routes for coaching functionality
- ✅ **Navigation Added**: Home page link to access DISC coaching features

### Next Steps
- Test OAuth flow fixes with improved error handling
- Verify DISC coaching analysis with real email samples
- Test complete end-to-end coaching workflow

The application prioritizes user privacy, seamless Gmail integration, and intelligent AI assistance while maintaining a clean, accessible user interface across both web and extension platforms.