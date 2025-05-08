# Fiszki

## Project Description
Fiszki is a web application that enables users to generate educational flash cards using AI. The application addresses the time-consuming nature of manually creating high-quality flash cards, making spaced repetition learning more accessible. The MVP focuses on generating flash cards from input text, manual creation, and integration with an open-source spaced repetition algorithm.

## Tech Stack
- **Frontend**: Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Authentication)
- **AI**: Gemini API (Google AI models)
- **CI/CD**: GitHub Actions
- **Hosting**: DigitalOcean (Docker)

## Getting Started Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fiszki.git
   cd fiszki
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your Supabase and Gemini API keys
4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts
- `npm run dev`: Start the development server
- `npm run build`: Build the project for production
- `npm run preview`: Preview the production build
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint issues
- `npm run format`: Format code with Prettier

## Project Scope
- **MVP Features**:
  - AI-generated flash cards from input text (1000-10000 characters)
  - Manual flash card creation
  - Flash card review and editing
  - User account management
  - Integration with spaced repetition algorithm
- **Out of Scope**:
  - Advanced spaced repetition algorithms
  - Multi-format imports (PDF, DOCX, etc.)
  - Flash card sharing between users
  - Mobile applications

## Project Status
- **Current Phase**: MVP Development
- **Target Completion**: 16.05.2025
- **Success Metrics**:
  - 75% of AI-generated flash cards accepted by users
  - 75% of all flash cards created using AI

## Requirements
- Node.js version: 22.14.0 (specified in .nvmrc)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
