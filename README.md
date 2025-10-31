# 10x-Astro-Starter

## Table of Contents
- [Project Name](#project-name)
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Name
10x-Astro-Starter

## Project Description
This project, named 10x-cards, enables users to quickly create and manage educational flashcard sets. It uses LLM models via an API to generate flashcard suggestions based on provided text, addressing the problem of time-consuming manual flashcard creation and simplifying spaced repetition learning.

## Tech Stack
- Astro 5: For building fast, content-focused websites.
- TypeScript 5: For type-safe JavaScript development.
- React 19: For creating interactive user interfaces.
- Tailwind 4: For utility-first CSS styling.
- Shadcn/ui: For reusable UI components.

## Getting Started Locally
To set up and run the project locally:
1. Ensure you have Node.js installed (version specified in .nvmrc: 22.14.0). If using nvm, run `nvm use` in the project root.
2. Clone the repository and navigate to the project directory.
3. Install dependencies by running `npm install`.
4. Start the development server with the appropriate script.

## Available Scripts
In the project, you can use the following npm scripts:
- `npm run dev`: Starts the development server.
- `npm run build`: Builds the project for production.
- `npm run preview`: Previews the production build.
- `npm run astro`: Runs Astro CLI commands.
- `npm run lint`: Lints the code for errors.
- `npm run lint:fix`: Automatically fixes linting issues.
- `npm run format`: Formats the code using Prettier.

## Project Scope
The project focuses on providing a starter template for Astro applications, including basic pages, components, and API endpoints. It covers core features like automatic flashcard generation, manual creation, user authentication, and integration with a spaced repetition algorithm (using an open-source library). Boundaries include no advanced features in the MVP, such as gamification, mobile apps, or public API sharing.

## Project Status
The project is in active development, with the current version at 0.0.1. It is stable for local testing but may require updates based on evolving dependencies.

## License
This project is licensed under the MIT License (assumed based on common open-source practices; confirm and update in package.json if specified).


## How to Start

### Prerequisites
1. **Docker Desktop** - Required for running Supabase locally
2. **Node.js 22.14.0** - Use `nvm use` to switch to correct version
3. **Supabase CLI** - Will be used via npx

### Setup Steps

#### 1. Start Supabase
```bash
# Make sure Docker Desktop is running
npx supabase start
```

This will output your local Supabase credentials. Save these!

#### 2. Configure Environment Variables
Create a `.env` file in project root:

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=your_anon_key_from_step_1
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_step_1
OPENROUTER_API_KEY=your_openrouter_key
```

See `.ai/tests/ENV-SETUP.md` for detailed instructions.

#### 3. Run Database Migrations
```bash
npx supabase db reset
```

Or apply specific migration to fix RLS:
```bash
npx supabase migration up
```

#### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

## Testing

This project implements a comprehensive testing strategy covering unit, integration, E2E, security, performance, and accessibility tests.

### Testing Framework & Tools

**Unit & Integration Testing:**
- **Vitest** - Fast, Vite-powered test framework
- **React Testing Library** - User-centric component testing
- **Testcontainers** - Supabase local for integration tests

**E2E Testing:**
- **Playwright** - Cross-browser testing (Chromium, Firefox, WebKit)
- Auto-wait, retry logic, screenshot/video recording
- Parallel test execution

**API Testing:**
- **PowerShell scripts** (`.ai/tests/`) - Quick manual tests
- **Thunder Client / Postman** - Exploratory testing with collections

**Performance Testing:**
- **Lighthouse** - Web performance & accessibility scores
- **Artillery** - Load and stress testing
- **PostgreSQL EXPLAIN ANALYZE** - Query optimization

**Security Testing:**
- **OWASP ZAP** - Vulnerability scanning
- **SQLMap** - SQL injection testing (staging only)
- **axe DevTools** - WCAG 2.1 AA accessibility audit

**Monitoring & Logging:**
- **Sentry** - Error tracking (production)
- **LogTail** - Structured logging
- **Supabase Dashboard** - Database monitoring

### Test Environments

**Local (Development):**
- Node.js 22.14.0 + Docker Desktop
- Supabase local via CLI (`npx supabase start`)
- PostgreSQL 15 in container
- Purpose: Unit tests, integration tests, debugging

**Staging (Testing):**
- Supabase Cloud (staging project)
- DigitalOcean Droplet
- GitHub Actions CI/CD
- Purpose: E2E tests, UAT, pre-release validation

**Production:**
- Supabase Cloud (production project)
- DigitalOcean Droplet with monitoring
- Sentry + LogTail for observability
- Purpose: Smoke tests, production monitoring

### Test Coverage Goals

- **Unit tests:** >80% coverage for `/src/lib`, `/src/components/hooks`
- **Integration tests:** >70% coverage for `/src/pages/api`
- **E2E tests:** All user stories (US-001 to US-009)
- **Performance:** Lighthouse score >90, API <200ms (p95)
- **Accessibility:** WCAG 2.1 Level AA compliance

### Running Tests

#### Unit & Integration Tests
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

#### E2E Tests
```bash
# Run Playwright tests
npx playwright test

# Run specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

#### API Testing (Manual)
```bash
cd .ai/tests

# Get access token
.\get-token.ps1

# Run quick API tests
.\test-quick.ps1

# Run comprehensive tests
.\test-flashcards-api.ps1
```

See `.ai/tests/README.md` for full testing documentation.

### Test Scenarios

**Critical Test Areas:**
- **Authentication:** Register, login, logout, password reset, session management
- **AI Generation:** Flashcard generation via OpenRouter API, validation, error handling
- **Flashcard CRUD:** Create, read, update, delete with proper authorization
- **Row Level Security (RLS):** Data isolation between users, GDPR compliance
- **Performance:** Response times, concurrent users, bulk operations
- **Accessibility:** Keyboard navigation, screen readers, ARIA labels

**Test Types:**
- Success cases: Happy path scenarios, valid inputs
- Error cases: Validation errors, auth failures, API errors
- Edge cases: Max lengths, limits, concurrent operations
- Security: XSS, SQL injection, JWT validation, RLS bypass attempts

### Troubleshooting

If you get "Generation not found" errors:
1. Run `.ai/tests/fix-rls.ps1` to disable RLS
2. Create test data (see `.ai/tests/SETUP-TEST-DATA.md`)
3. See `.ai/tests/ROZWIAZANIE.md` for detailed explanation (Polish)

For detailed test plan, see `.cursor/rules/test-plan-generated.mdc` 