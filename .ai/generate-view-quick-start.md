# Quick Start Guide - Generate View

## Prerequisites

1. **Environment Setup**

   ```bash
   # Copy .env.example to .env (if exists) or create .env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

2. **Database Migrations**
   - Ensure all Supabase migrations are applied
   - Tables required: `generations`, `flashcards`, `generation_error_logs`

3. **Install Dependencies**
   ```bash
   npm install
   ```

## Development

### Start Dev Server

```bash
npm run dev
```

The app will be available at `http://localhost:4321`

### Access Generate View

Navigate to: `http://localhost:4321/generate`

## Testing the Feature

### 1. Setup Authentication (Temporary)

Since auth isn't fully implemented yet, you'll need to manually set a token:

```javascript
// In browser console:
localStorage.setItem("auth_token", "your_supabase_jwt_token");
```

To get a JWT token, you can:

- Use Supabase Dashboard > Authentication > Users
- Or create a test user via API

### 2. Test Generation

**Valid Test Input (1500 characters):**

```
The solar system consists of the Sun and the objects that orbit it.
The Sun is a yellow dwarf star that contains 99.86% of the system's mass.
There are eight planets in our solar system: Mercury, Venus, Earth, Mars,
Jupiter, Saturn, Uranus, and Neptune. The four inner planets (Mercury,
Venus, Earth, and Mars) are rocky and smaller. The four outer planets
(Jupiter, Saturn, Uranus, and Neptune) are gas giants and much larger.

Mercury is the smallest planet and closest to the Sun. It has no
atmosphere and experiences extreme temperature variations. Venus is
similar in size to Earth but has a thick, toxic atmosphere composed
mainly of carbon dioxide, making it the hottest planet despite not
being closest to the Sun.

Earth is the only known planet with liquid water on its surface and
the only one known to support life. Mars, often called the Red Planet,
has the largest volcano and canyon in the solar system. Jupiter is the
largest planet and has at least 79 moons, including Ganymede, the
largest moon in the solar system.

Saturn is famous for its prominent ring system made of ice and rock
particles. Uranus rotates on its side and appears blue-green due to
methane in its atmosphere. Neptune, the farthest planet, is known for
its strong winds, which are the fastest in the solar system.

Beyond Neptune lies the Kuiper Belt, a region of icy bodies including
Pluto, which was reclassified as a dwarf planet in 2006. The solar
system also contains asteroids, comets, and other small bodies.
```

### 3. Test Workflow

1. **Generate**
   - Paste the text above (or any text 1000-10000 chars)
   - Click "Generate Flashcards"
   - Wait for AI to generate proposals (5-30 seconds)

2. **Review**
   - View generated flashcards
   - Accept good ones (click "Accept")
   - Edit if needed (click "Edit", modify, "Save Changes")
   - Reject bad ones (click "Reject")

3. **Save**
   - Click "Save Accepted" to save only accepted cards
   - Or "Save All" to save all remaining cards
   - Confirm in success dialog

### 4. Verify Database

Check Supabase Dashboard:

- `generations` table should have new record
- `flashcards` table should have your saved cards

## Common Issues

### Issue: "Not authenticated"

**Solution:** Make sure you have a valid JWT token in localStorage

```javascript
localStorage.setItem("auth_token", "your_valid_token");
```

### Issue: "OPENROUTER_API_KEY is not configured"

**Solution:** Add OPENROUTER_API_KEY to your .env file

```env
OPENROUTER_API_KEY=sk-or-v1-...
```

### Issue: Generation takes too long or fails

**Solutions:**

- Check OpenRouter API status
- Verify API key is valid
- Check console for errors
- Try with shorter text
- Check network tab in DevTools

### Issue: "Generation not found" when saving

**Solution:**

- Make sure you generated flashcards first
- Check that generationId is set
- Verify user_id matches in database

### Issue: Build errors

**Solution:**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm run build -- --force
```

## Development Tips

### Hot Reload

The dev server supports hot reload. Changes to:

- `.tsx` files → Hot reload
- `.astro` files → Full reload
- `.ts` files (services) → Server restart

### Debugging

**Frontend:**

```javascript
// Add to component
console.log("Current state:", { flashcards, isLoading, error });
```

**Backend:**

```typescript
// Add to service
console.log("Calling LLM with:", { model, textLength: sourceText.length });
```

**Network:**

- Open DevTools > Network
- Filter by "Fetch/XHR"
- Check request/response for API calls

### Component Structure

```
src/components/
├── FlashcardGenerationView.tsx    # Main view
├── TextInputArea.tsx              # Input component
├── GenerateButton.tsx             # Generation trigger
├── FlashcardList.tsx              # List container
├── FlashcardListItem.tsx          # Individual card
├── BulkSaveButton.tsx             # Save controls
├── SuccessDialog.tsx              # Confirmation
├── ErrorNotification.tsx          # Errors
├── SkeletonLoader.tsx             # Loading state
├── types.ts                       # Frontend types
└── hooks/
    ├── useGenerateFlashcards.ts   # Generation logic
    └── useSaveFlashcards.ts       # Save logic
```

## API Endpoints

### POST /api/generations

Generate flashcards from text

- **Auth:** Required (Bearer token)
- **Body:** `{ sourceText: string, model: string }`
- **Returns:** `{ generationId, model, generatedCount, proposals }`

### POST /api/flashcards

Save flashcards to database

- **Auth:** Required (Bearer token)
- **Body:** `{ generationId: number, flashcards: [...] }`
- **Returns:** `{ created: [...] }`

## Next Steps

After getting the generate view working:

1. **Implement Authentication**
   - Create login page
   - Add auth context
   - Replace localStorage with proper auth

2. **Add More Features**
   - Model selection UI
   - Draft saving
   - Batch operations
   - Undo functionality

3. **Testing**
   - Write unit tests
   - Add integration tests
   - E2E testing with Playwright

4. **Deploy**
   - Set up CI/CD
   - Configure production environment
   - Deploy to Vercel/Netlify

## Support

- Check `.ai/tests/test-generate-view-manual.md` for detailed test scenarios
- Review `.ai/generate-view-implementation-summary.md` for architecture details
- See `.ai/generate-view-implementation-plan.md` for original requirements

## Success Criteria

✅ You should be able to:

1. Enter text (1000+ chars)
2. Generate flashcards
3. See loading states
4. Review proposals
5. Accept/edit/reject cards
6. Save to database
7. See success confirmation

If all steps work, the feature is ready! 🎉
