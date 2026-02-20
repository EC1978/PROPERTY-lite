# Business Case: AI Voice Cloning & Verdienmodel

## 1. Kostenstructuur (De "Inkoop")
Om dit winstgevend aan te bieden, moeten we de kosten per klant/woning goed begrijpen. De grootste variabele kostenpost is de **Audio Generatie** (ElevenLabs).

### A. ElevenLabs (De Stem)
ElevenLabs rekent per "karakter" (letter).
*   **Vuistregel**: 1.000 karakters ≈ 1 minuut spreken.
*   **Kosten**: Ongeveer **$0.30 per minuut** audio in de lagere pakketten, dalend naar **$0.15 - $0.20** bij groot volume (Enterprise).

### B. LLM (Het Brein - Gemini/OpenAI)
*   Gemini Flash is extreem goedkoop (bijna gratis voor tekst).
*   OpenAI GPT-4o is duurder, maar voor simpele Q&A nog steeds centenwerk per gesprek.
*   **Schatting**: < $0.05 per gesprek.

### C. Server & Opslag (Vercel/Supabase)
*   Verwaarloosbaar per gesprek, valt binnen standaard hosting behalve bij duizenden gebruikers.

---

## 2. Rekenvoorbeeld: Gebruik per Woning
Stel een potentiële kijker praat 3 minuten met de AI over een huis.
*   De AI spreekt zelf ongeveer 1.5 minuut (de rest is de kijker of stiltes).
*   **Kosten per bezichtiging (sessie)**:
    *   Stem (1.5 min): ~$0.45
    *   Brein: ~$0.05
    *   **Totaal: $0.50 per geïnteresseerde.**

*Dit is aanzienlijk!* Als een huis 100 geïnteresseerden heeft die allemaal praten, kost dat $50 aan API-kosten.
**Conclusie**: Je kunt "Custom Voice" niet onbeperkt gratis aanbieden in een goedkoop pakket.

---

## 3. Voorstel Verdienmodel & Pakketten

Je kunt dit het beste opdelen in **kwaliteit van de ervaring** (Standaard vs. Premium Stem) en **volume** (aantal gesprekken).

### 🥉 Pakket 1: STARTER (Instap)
*Bedoeld voor: Kleine kantoren of budget woningen.*
*   **Prijs**: €19 - €29 per woning / maand (of inbegrepen in basis licentie).
*   **Stem**: **Standaard Sythentische Stem** (Google/OpenAI).
    *   *Kosten voor jou:* Bijna nul (alleen LLM kosten).
*   **Beperking**: Geen eigen stem, klinkt als een standaard computerassistent.

### 🥈 Pakket 2: PRO (Personal Brand)
*Bedoeld voor: Makelaars die zichzelf als merk willen neerzetten.*
*   **Prijs**: €49 - €69 per maand (per makelaar).
*   **Stem**: **1x Eigen Gekloonde Stem** (Jouw stem!).
*   **Inclusief**:
    *   Vrij gebruik voor X aantal minuten per maand (bijv. 60 min gegenereerde audio).
    *   Daarna: "Pay-as-you-go" of snelheid verlagen naar standaard stem.
*   *Marge*: Bij €49 heb je ruimte voor ~100 minuten audio (kost jou ~$20). De rest is winst.

### 🥇 Pakket 3: AGENCY (Kantoorbrede Oplossing)
*Bedoeld voor: Grote kantoren met meerdere makelaars.*
*   **Prijs**: €199+ per maand.
*   **Stemmen**: **5+ Gekloonde Stemmen** (Voor elke makelaar één).
*   **Features**:
    *   Automatische detectie: Als kijker vraagt naar "Makelaar Jan", schakelt de stem over naar Jan.
    *   Hogere limieten (bijv. 300 min/maand).
    *   Geavanceerde Analytics (wie vroeg wat?).

---

## 4. Hoe Implementeren? (Technische Strategie)

Om de kosten te beheersen en marges te beschermen:

1.  **Het "Fair Use" Model**:
    *   De eerste 1-2 antwoorden in een gesprek zijn in de **Premium Stem**.
    *   Als een gesprek heel lang duurt, kan de AI (naadloos) overschakelen naar een goedkopere "Hoge Kwaliteit Standaard Stem" om kosten te besparen, tenzij de klant betaalt voor onbeperkt.

2.  **Caching**:
    *   Veel vragen zijn hetzelfde ("Wat is het energielabel?", "Wanneer is het gebouwd?").
    *   We kunnen de audio-antwoorden op deze vragen **opslaan** na de eerste keer genereren.
    *   Bij de volgende bezoeker spelen we het bestand af (Kosten: €0!).
    *   *Dit kan de kosten met 50-70% verlagen!*

3.  **Hybride Aanpak**:
    *   Gebruik ElevenLabs "Turbo" model (goedkoper/sneller) voor de meeste interacties.
    *   Gebruik het duurste model alleen voor de introductie ("Welkom, ik ben Erdem...").

## Advies voor Nu
Begin met het aanbieden als **Premium Add-on**.
*"Wil je dat deze woning door JOU wordt gepresenteerd, 24/7? Voor €X extra activeren we jouw AI-clone."*
Dit maakt de waarde direct tastbaar voor de makelaar.
