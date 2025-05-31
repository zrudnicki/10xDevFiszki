# 10xDevFiszki Project Documentation

## Project Overview
10xDevFiszki is a flashcard learning application built with Astro, React, TypeScript, and Tailwind CSS. The application uses Supabase for backend services and authentication.

## Directory Structure

### `/src` - Main Source Directory

#### `/components` - React Components
- Contains all React components used throughout the application
- Components are organized by feature/functionality
- Uses TypeScript for type safety
- Implements Tailwind CSS for styling

#### `/db` - Database Related Files
- Contains database schema definitions
- Database migration files
- Type definitions for database entities
- Database utility functions

#### `/layouts` - Astro Layout Components
- `Layout.astro` - Main application layout
  - Handles the common structure of all pages
  - Includes navigation and authentication state
  - Manages global styles and meta tags

#### `/lib` - Utility Libraries
- `/supabase` - Supabase client configuration
  - `client.ts` - Supabase client setup and authentication
  - `server.ts` - Server-side Supabase utilities
- `/utils` - General utility functions
- `/services` - Business logic and API services

#### `/middleware` - Request/Response Middleware
- Authentication middleware
- Request validation
- Error handling
- Logging

#### `/pages` - Astro Pages
- Contains all route pages
- Organized by feature/functionality
- Implements server-side rendering where needed
- Handles form submissions and API endpoints

#### `/styles` - Global Styles
- `global.css` - Global style definitions
  - Tailwind CSS directives
  - CSS variables for theming
  - Dark mode support
  - Custom utility classes

### Configuration Files

#### `tailwind.config.js`
- Tailwind CSS configuration
- Theme customization
- Color palette definitions
- Custom plugins and extensions

#### `astro.config.mjs`
- Astro framework configuration
- Integration settings
- Build options
- Server configuration

#### `tsconfig.json`
- TypeScript configuration
- Compiler options
- Path aliases
- Type definitions

## Key Features

### Authentication
- Implemented using Supabase Auth
- Handles user registration and login
- Session management
- Protected routes

### Flashcard Management
- Create and edit flashcards
- Organize into collections
- Study mode with spaced repetition
- Progress tracking

### UI Components
- Built with React and Tailwind CSS
- Responsive design
- Dark mode support
- Accessible components

### Data Management
- Supabase for data storage
- Real-time updates
- Offline support
- Data synchronization

## Development Guidelines

### Styling
- Use Tailwind CSS for styling
- Follow the established color scheme
- Implement responsive design
- Support dark mode

### TypeScript
- Use strict type checking
- Define interfaces for all data structures
- Use type guards where necessary
- Document complex types

### Component Structure
- Keep components small and focused
- Use composition over inheritance
- Implement proper error boundaries
- Follow React best practices

### State Management
- Use React hooks for local state
- Implement context for global state
- Handle side effects properly
- Optimize performance

## Build and Deployment

### Development
```bash
npm run dev
```
- Starts development server
- Enables hot module replacement
- Provides development tools

### Production Build
```bash
npm run build
```
- Creates optimized production build
- Minifies assets
- Generates static files

### Preview
```bash
npm run preview
```
- Tests production build locally
- Verifies static file generation
- Checks routing

## Environment Variables
Required environment variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase API key
- Other configuration variables as needed

## Contributing
1. Follow the established code style
2. Write tests for new features
3. Update documentation
4. Submit pull requests

## License
[Add license information here] 