import axios from 'axios';

const LMSTUDIO_API_URL = process.env.LMSTUDIO_API_URL || 'http://localhost:1234/v1/chat/completions';

export async function analyzeBookmarkWithLLM(bookmark: any, examples: any[] = []) {
  const prompt = `
Przeanalizuj poniższą zakładkę i wygeneruj następujące informacje:
1. Tytuł (jeśli nie jest podany)
2. Kategoria (np. Technologia, Nauka, Hobby, Praca)
3. Grupa (podkategoria, np. dla Technologia -> AI, Programowanie, Hardware)
4. Status (np. Do przeczytania, W trakcie, Ukończone)
5. Link (pozostaw bez zmian)
6. Tagi (5-8 tagów opisujących treść)
7. Krótkie podsumowanie (1-2 zdania)
8. Sugerowany folder do organizacji

Zakładka: ${JSON.stringify(bookmark, null, 2)}

Przykłady tagów: programowanie, AI, machine learning, notatki, projekt, praca, nauka, artykuł, video

Zwróć wynik TYLKO jako JSON w formacie:
{
  "title": "...",
  "category": "...",
  "group": "...",
  "status": "Do przeczytania",
  "link": "...",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "...",
  "suggestedFolder": "..."
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
    
    // Wyciągnij JSON z odpowiedzi (może być otoczony innym tekstem)
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
      tags: [],
      summary: "Automatyczna analiza nie powiodła się.",
      suggestedFolder: "Inne"
    };
  }
} 