AI Flash Card Generator PoC

## BACKGROUND

We're building a web application called "Fiszki" that lets users create educational flash cards with AI assistance. For the PoC, focus ONLY on the core functionality: text input → AI generation → display cards.

## TECH STACK

- Frontend: Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- Backend: Supabase (PostgreSQL + Auth)
- AI: Gemini API integration

## CORE USER FLOW

1. User enters text (1000-10000 characters) in a form
2. System validates the input length
3. Text is sent to Openrouter.ai API
4. AI generates 5-15 flash cards with Front (≤200 chars) and Back (≤500 chars) fields
5. Cards are displayed in a simple list view

## PROJECT REQUIREMENTS

- Build a single-page application with a text input area and results display
- Implement length validation (1000-10000 chars)
- Create a clear, accessible UI with Shadcn components
- Set up Openrouter.ai integration to generate flash cards
- Display generated cards in a clean, readable format
- Add error handling for API failures and validation errors

## OUT OF SCOPE

- User authentication/accounts
- Saving cards to database
- Card editing functionality
- Tagging/categorization
- Flashcard review system
- Mobile app versions

## DELIVERABLE REQUEST

1. First create a detailed implementation plan with specific steps and timeline
2. WAIT FOR MY EXPLICIT APPROVAL before implementing any code
3. After approval, implement the minimal PoC as specified

## FINAL DELIVERY

- A functional, deployable Astro application
- Clear documentation on setup and usage
- Clean, typed code following best practices

When presenting your plan, explain your approach to the AI integration and any key architectural decisions you'll make.
