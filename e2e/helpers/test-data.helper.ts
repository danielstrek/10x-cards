/**
 * Helper functions for generating test data
 */

/**
 * Generate sample text for flashcard generation
 * @param length Approximate length in characters (1000-10000)
 */
export function generateSampleText(length: number): string {
  const minLength = 1000;
  const maxLength = 10000;
  
  const targetLength = Math.max(minLength, Math.min(maxLength, length));

  const topics = [
    'JavaScript to wieloparadygmatowy język programowania. Obsługuje programowanie obiektowe, imperatywne i funkcyjne. JavaScript jest jednym z najpopularniejszych języków programowania na świecie.',
    'React to biblioteka JavaScript służąca do budowania interfejsów użytkownika. Została stworzona przez Facebook i jest szeroko wykorzystywana w tworzeniu aplikacji webowych.',
    'TypeScript to nadzbiór JavaScriptu, który dodaje statyczne typowanie. Pomaga w wykrywaniu błędów na etapie kompilacji i ułatwia utrzymanie dużych projektów.',
    'Node.js to środowisko uruchomieniowe JavaScript zbudowane na silniku V8 przeglądarki Chrome. Pozwala na uruchamianie JavaScript po stronie serwera.',
    'Astro to nowoczesny framework do budowania stron internetowych. Generuje statyczne strony HTML z minimalną ilością JavaScriptu po stronie klienta.',
    'Playwright to framework do testowania end-to-end aplikacji webowych. Obsługuje wiele przeglądarek i oferuje bogate API do automatyzacji testów.',
  ];

  let text = '';
  let currentLength = 0;

  while (currentLength < targetLength) {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    text += topic + ' ';
    currentLength = text.length;
  }

  return text.substring(0, targetLength).trim();
}

/**
 * Generate short sample text (below minimum for testing validation)
 */
export function generateShortText(): string {
  return 'To jest zbyt krótki tekst do wygenerowania fiszek.';
}

/**
 * Generate very long text (above maximum for testing validation)
 */
export function generateLongText(): string {
  return generateSampleText(12000); // Over 10000 limit
}

/**
 * Generate sample flashcard data
 */
export function generateFlashcardData(): { front: string; back: string } {
  const examples = [
    {
      front: 'Co to jest React?',
      back: 'React to biblioteka JavaScript do budowania interfejsów użytkownika, stworzona przez Facebook.',
    },
    {
      front: 'Czym jest TypeScript?',
      back: 'TypeScript to nadzbiór JavaScriptu, który dodaje statyczne typowanie do języka.',
    },
    {
      front: 'Co to jest Node.js?',
      back: 'Node.js to środowisko uruchomieniowe JavaScript zbudowane na silniku V8, pozwalające na uruchamianie JS po stronie serwera.',
    },
    {
      front: 'Czym się charakteryzuje Astro?',
      back: 'Astro to framework do budowania stron generujący statyczne HTML z minimalną ilością JavaScriptu.',
    },
  ];

  return examples[Math.floor(Math.random() * examples.length)];
}

/**
 * Generate multiple flashcard data
 */
export function generateMultipleFlashcards(count: number): Array<{ front: string; back: string }> {
  const flashcards: Array<{ front: string; back: string }> = [];
  
  for (let i = 0; i < count; i++) {
    const data = generateFlashcardData();
    flashcards.push({
      front: `${data.front} (${i + 1})`,
      back: `${data.back} (${i + 1})`,
    });
  }

  return flashcards;
}

/**
 * Generate flashcard with text exceeding limits
 */
export function generateInvalidFlashcard(): { front: string; back: string } {
  return {
    front: 'A'.repeat(250), // Over 200 character limit
    back: 'B'.repeat(600), // Over 500 character limit
  };
}

/**
 * Generate flashcard with empty fields
 */
export function generateEmptyFlashcard(): { front: string; back: string } {
  return {
    front: '',
    back: '',
  };
}

/**
 * Generate realistic study material text
 */
export function generateStudyMaterialText(): string {
  return `
Programowanie Funkcyjne w JavaScript

Programowanie funkcyjne to paradygmat programowania, w którym funkcje są traktowane jako obywatele pierwszej klasy. 
Oznacza to, że funkcje mogą być przypisywane do zmiennych, przekazywane jako argumenty i zwracane z innych funkcji.

Kluczowe koncepcje:

1. Funkcje Pure (Czyste)
Funkcje pure to funkcje, które dla tych samych argumentów zawsze zwracają ten sam wynik i nie mają efektów ubocznych.
Nie modyfikują stanu zewnętrznego ani nie zależą od niego.

2. Immutability (Niezmienność)
Zamiast modyfikować istniejące dane, tworzymy nowe kopie z wprowadzonymi zmianami.
To zapobiega nieoczekiwanym efektom ubocznym i ułatwia debugowanie.

3. Higher-Order Functions (Funkcje Wyższego Rzędu)
Funkcje wyższego rzędu to funkcje, które przyjmują inne funkcje jako argumenty lub zwracają funkcje.
Przykłady: map, filter, reduce.

4. Composition (Kompozycja)
Kompozycja funkcji polega na łączeniu prostych funkcji w bardziej złożone operacje.
Pozwala to na tworzenie modularnego i testowalnego kodu.

5. Declarative Programming (Programowanie Deklaratywne)
Skupiamy się na tym "co" chcemy osiągnąć, a nie "jak" to zrobić.
Kod jest bardziej czytelny i łatwiejszy do zrozumienia.

Zalety programowania funkcyjnego:
- Łatwiejsze testowanie
- Lepsze wykorzystanie wielowątkowości
- Mniej błędów związanych ze stanem
- Bardziej przewidywalny kod
- Łatwiejsze utrzymanie

Wady programowania funkcyjnego:
- Krzywa uczenia się może być stroma
- Czasem mniej wydajne niż imperatywne podejście
- Może być trudniejsze dla programistów przyzwyczajonych do OOP

Popularne biblioteki wspierające programowanie funkcyjne w JavaScript:
- Ramda
- Lodash/FP
- Immutable.js
`.trim();
}

