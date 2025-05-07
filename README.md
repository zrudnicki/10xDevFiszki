# AI Flash Card Generator

![AI Flash Card Generator](https://placeholder.svg?height=300&width=600)

An intelligent flash card application that uses AI to generate study materials on any topic. The app includes spaced repetition algorithms to optimize learning and retention.

## Features

- **AI-Powered Card Generation**: Create flash cards on any topic using AI
- **User Authentication**: Secure user accounts with Supabase authentication
- **Spaced Repetition Learning**: Optimized study scheduling using the SM-2 algorithm
- **Personal Dashboard**: Track your card sets and due reviews
- **Study Sessions**: Track progress and performance during study sessions
- **Responsive Design**: Works on desktop and mobile devices

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **AI Integration**: OpenAI API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for authentication and database)
- OpenAI API key (for AI-powered card generation)
- Git (for version control)

### Local Development Setup

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/ai-flash-card-generator.git
   cd ai-flash-card-generator
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   \`\`\`
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

The application requires several tables in your Supabase database:

1. Navigate to your Supabase project dashboard
2. Go to the SQL Editor
3. Create the required tables by running the SQL script in `supabase/migrations/initial_schema.sql`
4. Alternatively, you can run the following command to execute the SQL script:
   \`\`\`bash
   npx supabase-cli db execute --file=supabase/migrations/initial_schema.sql
   \`\`\`

### Building for Production

To build the application for production:

1. Create an optimized production build:
   \`\`\`bash
   npm run build
   \`\`\`

2. Test the production build locally:
   \`\`\`bash
   npm run start
   \`\`\`

3. The application will be available at [http://localhost:3000](http://localhost:3000)

### Docker Setup

You can also run the application using Docker, which ensures consistent environments across different development and production setups.

#### Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) (optional, for multi-container setup)

#### Using Docker

1. Create a `Dockerfile` in the root directory:

\`\`\`Dockerfile
# Base on Node.js LTS
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# This will use the environment variables from .env.production
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
\`\`\`

2. Create a `.dockerignore` file to exclude unnecessary files:

\`\`\`
node_modules
.next
.git
.env*
\`\`\`

3. Build the Docker image:

\`\`\`bash
docker build -t ai-flash-card-generator .
\`\`\`

4. Run the container:

\`\`\`bash
docker run -p 3000:3000 --env-file .env.local ai-flash-card-generator
\`\`\`

The application will be available at [http://localhost:3000](http://localhost:3000).

#### Using Docker Compose

For a more complete setup including database services, create a `docker-compose.yml` file:

\`\`\`yaml
version: '3'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: always

  # You can add additional services here if needed
  # For example, a local database for development:
  # db:
  #   image: postgres:14
  #   environment:
  #     - POSTGRES_USER=postgres
  #     - POSTGRES_PASSWORD=postgres
  #     - POSTGRES_DB=flashcards
  #   ports:
  #     - "5432:5432"
  #   volumes:
  #     - postgres-data:/var/lib/postgresql/data

# volumes:
#   postgres-data:
\`\`\`

Run the application with Docker Compose:

\`\`\`bash
docker-compose up -d
\`\`\`

#### Development with Docker

For development with hot reloading, create a `docker-compose.dev.yml` file:

\`\`\`yaml
version: '3'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev
\`\`\`

And create a `Dockerfile.dev`:

\`\`\`Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
\`\`\`

Run the development setup:

\`\`\`bash
docker-compose -f docker-compose.dev.yml up
\`\`\`

This setup mounts your local directory into the container, enabling hot reloading during development.

### Running Tests

To run the test suite:

\`\`\`bash
npm run test
\`\`\`

For development with continuous testing:

\`\`\`bash
npm run test:watch
\`\`\`

## Usage

### Generating Flash Cards

1. Navigate to the home page or click "Create New Cards" in the dashboard
2. Enter a topic and optional additional information
3. Select the number of cards to generate
4. Click "Generate Flash Cards"
5. Review the generated cards and save them to your account

### Studying with Spaced Repetition

1. Go to your dashboard to see your card sets
2. Click "Study" on a card set to begin a study session
3. For each card, view the question, then reveal the answer
4. Rate your knowledge of the card (1-5)
5. The system will schedule the card for future review based on your rating

## Project Structure

\`\`\`
ai-flash-card-generator/
├── app/                  # Next.js app router
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # User dashboard
│   ├── study/            # Study session pages
│   ├── card-set/         # Card set details
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── study/            # Study components
│   ├── card-set/         # Card set components
│   └── ui/               # UI components (shadcn)
├── contexts/             # React contexts
├── lib/                  # Utility functions
│   ├── actions.ts        # Server actions
│   ├── card-actions.ts   # Card-related server actions
│   ├── supabase.ts       # Supabase client
│   └── spaced-repetition.ts # Spaced repetition algorithm
├── types/                # TypeScript type definitions
└── public/               # Static assets
\`\`\`

## Screenshots

### Home Page
![Home Page](https://placeholder.svg?height=200&width=400)

### Flash Card Generation
![Flash Card Generation](https://placeholder.svg?height=200&width=400)

### Dashboard
![Dashboard](https://placeholder.svg?height=200&width=400)

### Study Session
![Study Session](https://placeholder.svg?height=200&width=400)

## Spaced Repetition Algorithm

The application uses the SuperMemo-2 (SM-2) algorithm for spaced repetition:

1. After reviewing a card, users rate their knowledge on a scale of 1-5
2. The algorithm calculates the next review date based on:
   - Previous performance (ease factor)
   - Number of repetitions
   - Current interval
3. Cards that are difficult to remember are shown more frequently
4. Cards that are well-known are shown less frequently

This approach optimizes study time by focusing on material that needs more attention.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [OpenAI](https://openai.com/) for the AI text generation
- [Supabase](https://supabase.com/) for authentication and database
- [Next.js](https://nextjs.org/) for the React framework
- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [SuperMemo](https://supermemo.guru/wiki/SuperMemo_Algorithm) for the spaced repetition algorithm
