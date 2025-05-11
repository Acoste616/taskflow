import axios from 'axios';

const LMSTUDIO_API_URL = process.env.LMSTUDIO_API_URL || 'http://localhost:1234/v1/chat/completions';

export async function analyzeBookmarkWithLLM(bookmark: any, examples: any[] = []) {
  const prompt = `
Jesteś ekspertem w analizie treści internetowych. Przeanalizuj dokładnie poniższą zakładkę i wygeneruj szczegółowe informacje:
1. Tytuł (jeśli nie jest podany)
2. Kategoria (np. Technologia, Nauka, Hobby, Praca, Finance)
3. Grupa (podkategoria, np. dla Technologia -> AI, Programowanie, Hardware)
4. Status (np. Do przeczytania, W trakcie, Ukończone)
5. Link (pozostaw bez zmian)
6. Wartość merytoryczna treści (wysoka, średnia, niska)
7. Tagi (5-7 tagów precyzyjnie opisujących treść)
8. Krótkie podsumowanie (2-3 zdania streszczające główne tezy)
9. Sugerowany folder do organizacji
10. 3-5 kluczowych punktów wyciągniętych z treści
11. Wydźwięk treści (pozytywny, negatywny, neutralny)

Zakładka: ${JSON.stringify(bookmark, null, 2)}

Na podstawie adresu URL i tytułu wnioskuj o możliwej zawartości strony. Zauważ, że nie masz bezpośredniego dostępu do treści strony,
więc musisz wykorzystać swoją wiedzę o różnych domenach i typach treści, aby podać jak najdokładniejsze informacje.

Zwróć wynik TYLKO jako JSON w formacie:
{
  "title": "...",
  "category": "...",
  "group": "...",
  "status": "Do przeczytania",
  "link": "...",
  "contentValue": "wysoka|średnia|niska",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "summary": "...",
  "keypoints": ["punkt 1", "punkt 2", "punkt 3"],
  "suggestedFolder": "...",
  "sentiment": "pozytywny|negatywny|neutralny"
}
`;

  try {
    const response = await axios.post(LMSTUDIO_API_URL, {
      model: "Qwen-3-14B", // lub inny model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    // Pobierz tekst odpowiedzi
    const responseText = response.data.choices[0].message.content.trim();
    
    // Wyciągnij JSON z odpowiedzi
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Jeśli nie udało się znaleźć JSON, zwróć oryginalną odpowiedź
    return JSON.parse(responseText);
  } catch (error: any) {
    console.error("Błąd przy komunikacji z LLM:", error.message);
    // W przypadku błędu zwróć podstawową strukturę
    return {
      title: bookmark.title || "Bez tytułu",
      category: "Inne",
      group: "Ogólne",
      status: "Do przeczytania",
      link: bookmark.link,
      contentValue: "średnia",
      tags: [],
      summary: "Automatyczna analiza nie powiodła się.",
      keypoints: ["Nie udało się wyodrębnić kluczowych punktów."],
      suggestedFolder: "Inne",
      sentiment: "neutralny"
    };
  }
} 