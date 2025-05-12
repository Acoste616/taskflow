import axios from 'axios';

const LMSTUDIO_API_URL = process.env.LMSTUDIO_API_URL || 'http://localhost:1234/v1/chat/completions';

export async function analyzeBookmarkWithLLM(bookmark: any, examples: any[] = []) {
  // Initial prompt to generate first-pass thoughts
  const initialThoughtsPrompt = `
Przeanalizuj poniższą zakładkę i wygeneruj szczegółowe przemyślenia dotyczące jej kategoryzacji i zawartości.
Rozważ różne aspekty, takie jak domena, tytuł, potencjalna zawartość, branża, cel strony itp.
Zwróć szczególną uwagę na to, co wyróżnia tę stronę i jak powinna być skategoryzowana.

Zakładka: ${JSON.stringify(bookmark, null, 2)}

Twoje przemyślenia powinny być głębokie i uwzględniać różne perspektywy. Rozważ także potencjalne niejednoznaczności.
`;

  try {
    // First pass: Generate initial thoughts
    const initialResponse = await axios.post(LMSTUDIO_API_URL, {
      model: "Qwen-3-14B", // lub inny model
      messages: [{ role: "user", content: initialThoughtsPrompt }],
      temperature: 0.7, // Wyższy temperature dla bardziej kreatywnych przemyśleń
      max_tokens: 1000,
    });

    const initialThoughts = initialResponse.data.choices[0].message.content.trim();

    // Second pass: Recursive Analysis
    const recursivePrompt = `
Teraz przeanalizuj swoje wcześniejsze przemyślenia dotyczące tej zakładki i popraw wszelkie błędy rozumowania, 
zajmij się niejednoznacznościami i pogłęb swoją analizę. Zwróć szczególną uwagę na:
1. Czy moje początkowe kategoryzacje są odpowiednie?
2. Czy nie pomijam ważnych aspektów strony?
3. Czy istnieją lepsze tagi lub kategorie do opisania tej zawartości?
4. Czy moje wnioski wypływają logicznie z dostępnych informacji?

Zakładka: ${JSON.stringify(bookmark, null, 2)}

Twoje wcześniejsze przemyślenia:
${initialThoughts}

Poprawione i pogłębione przemyślenia:
`;

    const recursiveResponse = await axios.post(LMSTUDIO_API_URL, {
      model: "Qwen-3-14B",
      messages: [{ role: "user", content: recursivePrompt }],
      temperature: 0.5, // Niższy temperature dla bardziej ustrukturyzowanej poprawy
      max_tokens: 1000,
    });

    const refinedThoughts = recursiveResponse.data.choices[0].message.content.trim();

    // Final pass: Generate structured output
    const finalPrompt = `
Na podstawie twoich przemyśleń i analizy, wygeneruj ostateczną, ustrukturyzowaną analizę zakładki.
Wykorzystaj zarówno swoje pierwotne przemyślenia, jak i poprawioną analizę, aby stworzyć najlepszą możliwą kategoryzację.

Zakładka: ${JSON.stringify(bookmark, null, 2)}

Twoje początkowe przemyślenia:
${initialThoughts}

Twoje pogłębione przemyślenia:
${refinedThoughts}

Teraz zwróć ostateczną analizę TYLKO jako JSON w formacie:
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
  "sentiment": "pozytywny|negatywny|neutralny",
  "confidence": 0.95  // nowe pole z pewnością w zakresie 0-1
}
`;

    const finalResponse = await axios.post(LMSTUDIO_API_URL, {
      model: "Qwen-3-14B",
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.2, // Niski temperature dla precyzyjnego wyjścia
      max_tokens: 1000,
    });

    // Pobierz tekst odpowiedzi
    const responseText = finalResponse.data.choices[0].message.content.trim();
    
    // Zapisz proces myślowy do logów lub bazy (opcjonalnie)
    console.log("Chain of Recursive Thoughts process:");
    console.log("Initial thoughts:", initialThoughts);
    console.log("Refined thoughts:", refinedThoughts);
    console.log("Final analysis:", responseText);
    
    // Załącz proces myślowy do wyniku, jeśli potrzebny
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      // Opcjonalnie dodaj proces myślowy do rezultatu
      result.thoughtProcess = {
        initial: initialThoughts,
        refined: refinedThoughts
      };
      return result;
    }
    
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
      sentiment: "neutralny",
      confidence: 0.5
    };
  }
} 