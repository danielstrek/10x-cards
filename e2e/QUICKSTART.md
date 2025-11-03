# Quick Start Guide - E2E Tests

Get up and running with E2E tests in 5 minutes.

## 1. Install Dependencies

```bash
# Install npm packages (if not already done)
npm install

# Install Playwright browsers
npx playwright install chromium
```

## 2. Setup Environment

Create `.env.test` file in project root:

```env
BASE_URL=http://localhost:3000
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=your_local_anon_key
OPENROUTER_API_KEY=your_api_key
```

**Get Supabase credentials:**
```bash
npx supabase start
# Copy the anon key from output
```

**Get OpenRouter API key:**
- Visit https://openrouter.ai/keys
- Create a new key (free tier available)

## 3. Start Dev Server

```bash
# Terminal 1: Start the app
npm run dev
```

The app should be running at `http://localhost:3000`

## 4. Run Tests

```bash
# Terminal 2: Run E2E tests

# Option A: Run all tests
npm run test:e2e

# Option B: Run in UI mode (recommended)
npm run test:e2e:ui

# Option C: Run specific test
npx playwright test auth/01-registration-and-login.spec.ts
```

## 5. View Results

After running tests:

```bash
# View HTML report
npm run test:e2e:report
```

## Test Structure

```
e2e/
├── auth/                    # Authentication tests
│   ├── 01-registration-and-login.spec.ts
│   └── 04-logout-and-relogin.spec.ts
├── generation/              # Flashcard generation tests
│   └── 02-generate-flashcards.spec.ts
├── flashcards/             # Flashcard management tests
│   └── 03-manage-flashcards.spec.ts
└── pages/                   # Page Object Model
    ├── LoginPage.ts
    ├── RegisterPage.ts
    ├── GeneratePage.ts
    └── FlashcardsPage.ts
```

## Common Commands

```bash
# Run all tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test auth/01-registration-and-login.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug tests
npm run test:e2e:debug

# Generate test code
npm run test:e2e:codegen
```

## What Gets Tested?

### ✅ Authentication (17 tests)
- User registration
- Login/logout
- Password validation
- Session management
- Remember me functionality

### ✅ Flashcard Generation (12 tests)
- AI-powered flashcard generation
- Text validation (1000-10000 chars)
- Accept/reject flashcards
- Edit before saving
- Save operations

### ✅ Flashcard Management (12 tests)
- Create flashcards manually
- Edit existing flashcards
- Delete flashcards
- View flashcard list
- Data persistence

### ✅ Data Security (included in tests)
- Row Level Security (RLS)
- User data isolation
- Session persistence

## Expected Test Duration

- **Authentication tests:** ~30-60 seconds
- **Generation tests:** ~2-3 minutes (AI API calls)
- **Flashcard tests:** ~1-2 minutes
- **Total:** ~5-8 minutes for full suite

## Troubleshooting

### Problem: Tests fail with "Connection refused"

**Solution:** Make sure dev server is running
```bash
npm run dev
```

### Problem: "SUPABASE_URL is not defined"

**Solution:** Create `.env.test` file with proper values
```bash
cp .env .env.test
# Edit .env.test
```

### Problem: Generation tests timeout

**Solution:** Check OpenRouter API key is valid and has credits
```env
# In .env.test
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Problem: "Browser not found"

**Solution:** Install Playwright browsers
```bash
npx playwright install
```

## Next Steps

1. **Read full documentation:** [E2E README](./README.md)
2. **See examples:** [EXAMPLES.md](./EXAMPLES.md)
3. **Check test IDs:** [test-ids.md](./test-ids.md)
4. **View test plan:** [test-plan-generated.mdc](../.ai/test-plan-generated.mdc)

## Tips

💡 **Use UI mode during development:**
```bash
npm run test:e2e:ui
```
- See tests run in real-time
- Step through test execution
- Pick which tests to run

💡 **Run tests in parallel:**
Tests are configured to run in parallel for faster execution

💡 **Check the report on failure:**
```bash
npm run test:e2e:report
```
- View screenshots
- See error traces
- Analyze test timeline

## Need Help?

- 📚 [Playwright Documentation](https://playwright.dev/docs/intro)
- 📝 [Test Examples](./EXAMPLES.md)
- 📖 [Full README](./README.md)
- 📊 [Test Summary](./TEST-SUMMARY.md)

---

**Ready to test?** Start with:
```bash
npm run test:e2e:ui
```

