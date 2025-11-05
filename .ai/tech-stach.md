## Tech Stack - 10x-cards

### Frontend

**Astro z React dla komponentów interaktywnych:**

- **Astro 5** - Tworzenie szybkich, wydajnych stron z minimalną ilością JavaScript
- **React 19** - Interaktywność tam, gdzie jest potrzebna
- **TypeScript 5** - Statyczne typowanie kodu i lepsze wsparcie IDE
- **Tailwind 4** - Utility-first CSS styling
- **Shadcn/ui** - Biblioteka dostępnych komponentów React dla UI

### Backend

**Supabase jako kompleksowe rozwiązanie Backend-as-a-Service:**

- **PostgreSQL 15** - Relacyjna baza danych z zaawansowanymi funkcjami
- **Supabase SDK** - Backend-as-a-Service w wielu językach
- **Open source** - Możliwość hostowania lokalnie lub na własnym serwerze
- **Supabase Auth** - Wbudowana autentykacja użytkowników (JWT, cookies, localStorage)
- **Row Level Security (RLS)** - Izolacja danych na poziomie bazy danych

### AI & Machine Learning

**OpenRouter.ai dla komunikacji z modelami LLM:**

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google, Meta i wiele innych)
- Optymalizacja kosztów i efektywności poprzez wybór różnych modeli
- Ustawianie limitów finansowych na klucze API
- Retry logic i error handling dla stabilności

### Testing & Quality Assurance

**Unit & Integration Testing:**

- **Vitest** - Szybki framework testowy (Vite-powered)
- **React Testing Library** - User-centric testing komponentów
- **Testcontainers** - Izolowane środowisko testowe z Supabase local

**End-to-End Testing:**

- **Playwright** - Cross-browser E2E testing (Chromium, Firefox, WebKit)
- Screenshot/video recording, auto-wait, parallel execution

**API Testing:**

- **PowerShell Scripts** - Szybkie testy manualne i automatyzacja
- **Thunder Client / Postman** - Exploratory testing z collections

**Performance Testing:**

- **Lighthouse** - Web performance, accessibility, SEO audits
- **Artillery** - Load testing i stress testing
- **PostgreSQL EXPLAIN ANALYZE** - Optymalizacja zapytań SQL

**Security Testing:**

- **OWASP ZAP** - Vulnerability scanning
- **SQLMap** - SQL injection testing (staging only)
- **axe DevTools** - WCAG 2.1 AA accessibility compliance

### Monitoring & Observability

**Production Monitoring:**

- **Sentry** - Error tracking i performance monitoring
- **LogTail** - Structured logging i log aggregation
- **Supabase Dashboard** - Database monitoring, query performance
- **GitHub Actions** - CI/CD logs i deployment tracking

### CI/CD i Hosting

**Development & Deployment:**

- **GitHub Actions** - Automated CI/CD pipelines
  - Linting i code quality checks
  - Unit, integration, E2E test execution
  - Test coverage reporting (>80% dla core logic)
  - Automated deployment na staging i production
- **DigitalOcean Droplets** - Hosting aplikacji (Docker containers)
- **Supabase Cloud** - Managed PostgreSQL i auth (staging + production)
- **Docker** - Containerization dla spójnych środowisk

### Development Tools

**Local Development:**

- **Node.js 22.14.0** - Runtime environment (via nvm)
- **Docker Desktop** - Supabase local instance
- **Supabase CLI** - Database migrations i local testing
- **ESLint** - Code linting i static analysis
- **Prettier** - Code formatting

### Security & Compliance

**Data Protection:**

- **JWT Tokens** - Secure authentication
- **httpOnly Cookies** - XSS protection
- **Row Level Security** - Data isolation per user
- **GDPR Compliance** - Cascade delete, data portability
- **Input Validation** - Zod schemas dla API endpoints
