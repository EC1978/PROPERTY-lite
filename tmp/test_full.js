const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "AIzaSyBUZxsuUlSIXFNZTH1xrzyxrdqy6WbV-cw";

const rawText = `[BEZOEKER ZEGT]: Hoi ik ben "Erdem" en mijn budget is 300.000 euro.
[AI ZEGT]: Prima Erdem, wat is je telefoonnummer?
[BEZOEKER ZEGT]: Dat is 06-12345678.
[AI ZEGT]: En je emailadres?
[BEZOEKER ZEGT]: erdem@test.nl`;

const extractionPrompt = `Je bent een data-extractie assistent. Hieronder staat een transcript van een gesprek tussen een AI vastgoed assistent en een bezoeker over een woning.

Analyseer dit transcript ZORGVULDIG en extraheer de volgende informatie:

1. naam: De volledige naam van de bezoeker (als die genoemd is)
2. telefoon: Het telefoonnummer van de bezoeker (kijk specifiek naar berichten van [BEZOEKER ZEGT])
3. email: Het e-mailadres van de bezoeker
4. reden: Waarom de bezoeker belde (bezichtiging, informatie, bod, etc.)
5. budget: Het budget of bod van de bezoeker (als dat genoemd is)
6. transcript: Een SCHONE samenvatting in het Nederlands van wat er besproken is, in maximaal 3-5 zinnen. Dit moet leesbaar zijn voor een makelaar.
7. score: Een lead score van 0-100:
   - 0-20: Geen interesse
   - 21-40: Vragen gesteld
   - 41-60: Interesse getoond
   - 61-80: Contactgegevens achtergelaten
   - 81-100: Bod geplaatst of bezichtiging ingepland

REGELS:
- Geef null terug als een veld niet gevonden kan worden
- Verzin NOOIT informatie
- Let op: [BEZOEKER ZEGT] bevat wat de bezoeker zei, [AI ZEGT] bevat het AI-antwoord

Antwoord in dit JSON formaat:
{"naam":null,"telefoon":null,"email":null,"reden":null,"budget":null,"transcript":"...","score":10}

--- TRANSCRIPT ---
${rawText}
--- EINDE ---`;

async function test() {
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    console.log("Sending request to Gemini...");
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: extractionPrompt }]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1024,
                responseMimeType: "application/json"
            }
        })
    });

    if (!res.ok) {
        console.error("HTTP Error:", res.status);
        console.error(await res.text());
        return;
    }

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

test();
