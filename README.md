# infeos® — Website (Relaunch)

Moderne, statische Website für **infeos GmbH** (Bozen / Südtirol) im Agentur-Stil.
Kein Build-Tool nötig — einfach deployen oder lokal einen Server starten.

Farbwelt der bestehenden Seite übernommen (Deep Navy · Teal/Cyan · Magenta→Violet),
neu interpretiert als modernes, hochwertiges Agentur-Design.

## Struktur

```
/ (Repo-Root, flach)
├── index.html      ← komplette One-Page-Site INKL. integriertem KI-Rechner (#rechner)
├── styles.css      ← Design-System + Landing- + Rechner-Sektionen
├── main.js         ← Nav, Mobile-Menü, Scroll-Reveal, Counter
├── rechner.js      ← Rechner-Logik, Live-Vorschau, Lead-Gate, PDF
├── favicon.svg
├── CNAME · robots.txt · sitemap.xml
└── README.md
```

> **One-Page:** Der Rechner ist direkt als Sektion `#rechner` in `index.html`
> integriert — keine separate Seite. Alle CTAs scrollen per Anker dorthin.

## Der KI-Verlustrechner (Sektion `#rechner` in `index.html`)

Das Herzstück. Er beantwortet die Frage **„Was kostet dich fehlende KI?"** —
rein mathematisch aus den Eingaben des Nutzers.

**Ablauf (konversionsoptimiert):**
1. Nutzer stellt seine Kennzahlen per Slider ein (Mitarbeiter, Stundenkosten,
   manuelle Routine, Datenpflege, Service-Anfragen, Fehler/Nacharbeit, entgangene Aufträge).
2. **Live-Vorschau** zeigt den Verlust/Monat in Echtzeit.
3. „Berechnen" → kurzer Loader → **große animierte Ergebniszahl** + Jahreswert
   + realisierbares Einsparpotenzial mit infeos.
4. Die **vollständige Aufschlüsselung** ist unscharf/gesperrt (Tease).
5. Lead-Formular (Vorname, Nachname, Firma, E-Mail, Telefon, Position, Consent).
6. Absenden → **gebrandetes PDF wird erzeugt & sofort heruntergeladen**,
   Lead-Daten gehen per Web3Forms an infeos, die Aufschlüsselung wird freigeschaltet.

**Rechenmodell** (`compute()` in `js/rechner.js`):

```
Verlust/Monat = manuelle Routine + Datenpflege + bot-fähiger Service
              + Fehler/Nacharbeit + entgangene Aufträge

Zeitposten   = Personen × Stunden × 4,33 Wochen × Vollkostensatz × Automatisierungsgrad
Chancen      = Leads × Ø-Auftragswert × Verlust-Anteil
Realisierbar = Verlust × 0,70   (konservativer Realisierungsgrad)
```

Alle Annahmen (4,33 Wo/Monat, 1.700 produktive Std/Jahr, 70 % Realisierung) sind
oben in `js/rechner.js` als Konstanten gesetzt und leicht anpassbar.
Branchen-Voreinstellungen (`BRANCHE`) setzen sinnvolle Startwerte je Branche.

## ⚙️ Vor dem Live-Gang: Web3Forms-Key eintragen

Damit die Lead-E-Mails ankommen, einen kostenlosen Access-Key bei
<https://web3forms.com> anlegen (mit der Empfänger-Adresse, z. B. `fakturo@infeos.eu`)
und in `js/rechner.js` eintragen:

```js
const WEB3FORMS_KEY = 'REPLACE-WITH-INFEOS-WEB3FORMS-KEY';
```

> Solange der Platzhalter steht, funktioniert alles — nur die E-Mail-Benachrichtigung
> wird übersprungen (das PDF wird trotzdem erzeugt & heruntergeladen).

Der Nutzer erhält das PDF **sofort als Download**. Wenn ihr zusätzlich automatisch
das PDF per Mail an den Lead schicken wollt (Anhang), braucht es einen kleinen
Serverless-Endpoint (z. B. Cloudflare Worker) — sag Bescheid, dann bauen wir das.

## Lokal anschauen

```bash
cd infeos.eu
python3 -m http.server 8000
# → http://localhost:8000
```

## Deployen

Statisch — bei Vercel/Netlify/Cloudflare Pages verbinden, kein Build-Command,
Root = `infeos.eu/`. Für die echte Domain `infeos.eu` ggf. eigenes Repo + CNAME.

## Inhalt / Quellen

Texte & Kennzahlen aus der bestehenden infeos-Seite übernommen und geschärft:
ROI Ø 3,35 / Top-5 % = 8 · +60 % Produktivität · Software seit 1986 ·
zertifiziert von der Universität Helsinki · Standort Bozen, Südtirol.

## TODOs / Optionen

- Web3Forms-Key eintragen (s. o.)
- Echtes Logo (SVG) & Team-/Referenz-Bilder einbinden
- Impressum / Datenschutz als eigene Seiten verlinken
- Optional: automatischer PDF-Mailversand per Backend
- Optional: echte Kundenreferenz im Rechner (`case-proof`)
