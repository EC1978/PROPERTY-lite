# Architectuur- en Implementatieplan: Superadmin en Makelaar splitsing

Dit document (PRD) beschrijft de architectuur en de technische implementatie voor het scheiden van de functionaliteit voor makelaars (standaard gebruikers) en de superadmin in deze applicatie.

## 1. Supabase Database & Auth

We gaan een systeem van rollen introduceren op database niveau om ervoor te zorgen dat gebruikers veilig worden gescheiden en de juiste rechten hebben. 

### 1.1 Toekomstige structuur voor Rollen
Er zijn twee opties om rollen te implementeren:
1. **In de `users` tabel (app-schema):** We voegen een `role` kolom toe (bijv. van type `text` met default `'makelaar'`).
2. **In Supabase Auth (`auth.users.raw_user_meta_data`):** We slaan de rol op in de metadata.

**Aanbeveling:** We voegen een `role` kolom (text of enum) toe aan onze eigen `users` / `profiles` tabel in het publieke schema. Dit is vaak overzichtelijker voor Row Level Security (RLS) en sluit goed aan bij query's. Voor snellere identificatie synchroniseren we dit of cachen we dit eventueel, maar voor dit project is een `role` kolom (`'makelaar'` of `'superadmin'`) op de user tabel het makkelijkst en robuust.

### 1.2 Row Level Security (RLS) Updates
De huidige tabellen moeten hun RLS policies aanpassen zodat de rules ook kijken naar de `role` van de ingelogde gebruiker.
Typisch ziet de logica in PostgreSQL RLS er als volgt uit (pseudo-SQL):

*   **Tabel `shop_orders` (en bijbehorende `invoices`):**
    *   *Makelaars (role='makelaar')* mogen:
        *   `SELECT`, `INSERT`: Waarbij de `user_id` gelijk is aan hun eigen `auth.uid()`.
        *   `UPDATE`: Waar toegestaan (bijv. annuleren van hun bestelling), alleen als zij de eigenaar zijn.
    *   *Superadmin (role='superadmin')* mag:
        *   `ALL`: `true` (Volledige lees-, schrijf-, en verwijderrechten op álle rijen).

*   **Tabel `shop_products`:**
    *   *Makelaars*: `SELECT` rechten op alle producten, maar geen `INSERT/UPDATE/DELETE`.
    *   *Superadmin*: `ALL` rechten op alle producten.

Door middel van een helper functie (bijv. `is_admin()`) in PostgreSQL kunnen we de RLS policies overzichtelijk en efficiënt houden.

---

## 2. Route Beveiliging in Next.js

Om te voorkomen dat ongeautoriseerde gebruikers pagina's kunnen inzien die niet voor hen bedoeld zijn, moeten we dit beveiligen. Dit gebeurt op twee lagen:

### 2.1 Middleware (`middleware.ts`)
De Next.js middleware is de poortwachter voor inkomende requests en de snelste manier om ongeautoriseerde bezoeken te weren.
*   We intercepten requests die beginnen met de paden `/admin` (of gerelateerde paden).
*   Via Supabase Auth en het ophalen van de bijbehorende profielgegevens controleren we de rol.
*   Als een gebruiker is ingelogd maar wél de rol `'makelaar'` heeft, en deze bezoekt `/admin*`, blokkeren we de toegang en doen we een `NextResponse.redirect()` naar `/dashboard`.
*   Voor de routes `/dashboard` en `/shop` is enkel de standaard "is ingelogd" check vereist.

### 2.2 Component/Server Action validatie (Diepe Beveiliging)
Voor Server Actions (`use server`) die gerelateerd zijn aan de admin, bouwen we een checks-laag in:
*   We verifiëren bij elke mutatie die superadmin-rechten vereist de rol via de database profielen voordat we de actie toestaan. (Never trust the client).

---

## 3. Voorstel Mappenstructuur (App Router)

De applicatie wordt overzichtelijk opgedeeld in de `app/` directory zodat het admin dashboard zijn eigen layout, navigatie en stijl krijgt, los van de makelaar flow.

```
app/
├── (auth)               # Bestaande inlog/registratie routes
├── (makelaar)           # Het gedeelte voor makelaars
│   ├── dashboard/       # Makelaar dashboard
│   ├── shop/            # Webshop frontend voor makelaars
│   └── orders/          # Bestelgeschiedenis makelaar
│
└── admin/               # Het nieuwe Superadmin gedeelte
    ├── layout.tsx       # Specifieke lay-out voor het admin dashboard (Zijbalk, Header, Navigatie)
    ├── page.tsx         # Dashboard hoofdpagina voor de admin (bijv. statistieken: omzet, nieuwe bestellingen)
    │
    ├── orders/
    │   ├── page.tsx     # Overzicht van alle bestellingen
    │   └── [id]/page.tsx# Detailpagina van één bestelling (status updaten naar 'verzonden', etc.)
    │
    ├── products/
    │   ├── page.tsx     # Producten catalogus beheren (Lijst overzicht)
    │   ├── new/page.tsx # Nieuw product aanmaken
    │   └── [id]/page.tsx# Bestaand product wijzigen
    │
    └── users/
        ├── page.tsx     # Geregistreerde makelaars (klanten) inzien
        └── [id]/page.tsx# Profiel van de makelaar inzien (aantal orders etc.)
```

### Navigatie en Layout (Admin)
Binnen `/admin/layout.tsx` komt een toegewijd navigatiemenu specificiek voor dit onderdeel van de applicatie. Dit bevat links naar o.a. *Bestellingen*, *Klantbeheer* en *Producten*. Dit is compleet losgekoppeld van de publieke header.

---

## 4. Geavanceerde SaaS Functionaliteiten

Om het platform schaalbaar en flexibel te maken voor diverse makelaars, worden de volgende SaaS-features geïmplementeerd:

### 4.1 Modulair Systeem & Pakketten (Feature Toggling)
Niet elke makelaar gebruikt dezelfde set aan features. We introduceren een modulair systeem waarbij features aan/uit gezet kunnen worden.
*   **Database Structuur:** We voegen een `tenant_features` (of `agency_features`) tabel toe die gekoppeld is aan de makelaar (`user_id` of `agency_id`). Hierin slaan we JSONB of boolean kolommen op per module (bijv. `has_agenda: true`, `has_leads: false`, `has_webshop: true`).
*   **Superadmin Dashboard:** In het `/admin/users/[id]` overzicht krijgt de superadmin een paneel met toggles om deze functionaliteiten per klant direct aan of uit te zetten.
*   **Frontend Check:** De frontend controleert via een React Context of server-side check (via de database) of een module actief is voor de huidige gebruiker, en verbergt/toont de betreffende navigatie-items en pagina's.

### 4.2 Drag & Drop Navigatie (Dynamische Menu's)
Om de gebruikerservaring te personaliseren, maken we de navigatie dynamisch in plaats van hardcoded.
*   **Database Structuur:** Een tabel `navigation_items` (gekoppeld aan de makelaar) slaat de menu-structuur op, inclusief de `order` (volgorde), `label`, `icon`, en de bijbehorende `path`. Standaard ontvangt een nieuwe makelaar een default set aan items.
*   **Functionaliteit:** In het instellingen-paneel van de makelaar bouwen we een drag-and-drop interface (bijv. met `dnd-kit` of een vergelijkbare library). Hiermee kan de makelaar de menu-items in de sidebar of topbar naar wens sorteren. De nieuwe volgorde (`order` index) wordt opgeslagen in Supabase.

### 4.3 Ghost Login (User Impersonation)
Voor effectieve support moet de superadmin de applicatie kunnen zien exact zoals de klant (makelaar) die ziet, zonder inloggegevens te hoeven opvragen.
*   **Technische Flow:**
    1.  De superadmin klikt in `/admin/users/[id]` op een "Log in als deze gebruiker" knop.
    2.  Er wordt een veilige Server Action aangeroepen die de identiteit verifieert (is het wel echt de superadmin?).
    3.  We maken gebruik van een 'impersonation token' of zetten via Supabase Admin API direct de sessie om naar de doelsgebruiker, eventueel met een custom JWT claim `is_impersonating: true`.
*   **Frontend Waarschuwing:** Zodra de applicatie detecteert dat er sprake is van een active impersonation-sessie, tonen we een persistente (bijv. rode) banner bovenaan het scherm: *"⚠️ Je bent momenteel ingelogd als [Klantnaam]. [Keer terug naar Admin]"*. Dit voorkomt dat de superadmin per ongeluk permanente wijzigingen doorvoert onder de naam van de klant.

---

**Volgende stappen:**
Als dit plan aansluit bij de wensen, zullen we overgaan tot:
1. Aanmaken van de database wijzigingen (SQL scripts via Supabase voor `role`, `tenant_features`, `navigation_items` en RLS modificaties).
2. De routering en middleware beveiligen in de codebase (inclusief impersonation afhandeling).
3. De lay-out en stubs (basis bestanden) opzetten in de `/admin` folder route.
