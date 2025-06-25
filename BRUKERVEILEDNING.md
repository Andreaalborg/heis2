# HeisAdmin - Komplett Brukerveiledning

## Innholdsfortegnelse
1. [Innlogging og Navigasjon](#1-innlogging-og-navigasjon)
2. [Dashboard](#2-dashboard)
3. [Kundebehandling](#3-kundebehandling)
4. [Heisforvaltning](#4-heisforvaltning)
5. [Oppdragsbehandling](#5-oppdragsbehandling)
6. [Salgsarbeidsflyt](#6-salgsarbeidsflyt)
7. [Tilbudsbehandling](#7-tilbudsbehandling)
8. [Ordrebehandling](#8-ordrebehandling)
9. [Brukerbehandling](#9-brukerbehandling)
10. [Fraværsbehandling](#10-fraværsbehandling)
11. [Kalender og Planlegging](#11-kalender-og-planlegging)
12. [Kamerafunksjon](#12-kamerafunksjon)

---

## 1. Innlogging og Navigasjon

### Innlogging
1. Gå til innloggingssiden
2. Skriv inn brukernavn
3. Skriv inn passord
4. Klikk "Logg inn"
5. Du blir automatisk sendt til din rollebaserte dashboard

### Hovednavigasjon
**Toppmenyen (Navbar):**
- Viser "HeisAdmin" logo til venstre
- Viser brukerinfo og rolle til høyre
- Logg ut-knapp

**Sidemeny (Sidebar):**
- Klikk hamburgermenyen på mobil for å åpne
- På desktop er menyen alltid synlig
- Menyvalg basert på din brukerrolle:
  - **Administrator**: Alle funksjoner
  - **Tekniker**: Oppdrag, Kalender, Kamera
  - **Selger**: Kunder, Salg, Tilbud, Ordre

---

## 2. Dashboard

### Administrator Dashboard
**Steg-for-steg:**
1. Klikk "Dashboard" i sidemenyen
2. Se oversikt over:
   - Totalt antall aktive oppdrag
   - Oppdrag fordelt på status
   - Oppdrag som nærmer seg frist
3. Bruk søkefeltet for å finne spesifikke oppdrag
4. Klikk "Oppdater" for å hente nyeste data

### Tekniker Dashboard
1. Klikk "Dashboard" i sidemenyen
2. Se dine aktive oppdrag
3. Klikk på et oppdrag for detaljer
4. Bruk "Gå til Kalender" for planlegging

### Selger Dashboard
1. Klikk "Dashboard" i sidemenyen
2. Se salgsoversikt og aktive muligheter
3. Følg opp kunder og leads

---

## 3. Kundebehandling

### Vise Kundeliste
1. Klikk "Kunder" i sidemenyen
2. Se komplett kundeliste
3. Bruk søkefeltet for å finne kunder
4. Filtrer etter organisasjonsnummer om ønskelig

### Legge til Ny Kunde
1. Klikk "Legg til kunde" knappen
2. Fyll ut kundeinfo i popup-vinduet:
   - Kundenavn (påkrevd)
   - Adresse (påkrevd)
   - Postnummer (påkrevd)
   - By (påkrevd)
   - Organisasjonsnummer (valgfritt)
   - Kontaktperson navn
   - Kontaktperson telefon
   - Kontaktperson e-post
3. Klikk "Lagre"
4. Klikk "Avbryt" for å lukke uten å lagre

### Opprette Salgsmulighet
1. Finn kunden i listen
2. Klikk "Opprett salgsmulighet" ved siden av kunden
3. Fyll ut i popup-vinduet:
   - Tittel
   - Beskrivelse
   - Estimert verdi
   - Forventet avslutningsdato
   - Sannsynlighet (%)
   - Status (Lead, Kvalifisert, Tilbud, Forhandling, Vunnet, Tapt)
4. Klikk "Lagre"

---

## 4. Heisforvaltning

### Vise Heisliste
1. Klikk "Heiser" i sidemenyen
2. Se komplett heisliste
3. Bruk søkefeltet for å finne heiser
4. Se heistype og tilknyttet kunde for hver heis

### Legge til Ny Heis
1. Klikk "Legg til heis" knappen
2. Fyll ut i popup-vinduet:
   - Velg kunde fra dropdown
   - Velg heistype fra dropdown
   - Skriv inn plassering/adresse
3. Klikk "Legg til"

### Se Heisdetaljer
1. Klikk på "Vis detaljer" ved siden av en heis
2. Se komplett informasjon om heisen
3. Klikk "Lukk" for å gå tilbake

### Administrere Heistyper
1. Klikk "Heistyper" i sidemenyen
2. Se liste over heistyper
3. Klikk "Legg til heistype" for ny type
4. Klikk "Rediger" for å endre eksisterende
5. Fyll ut merke, modell og spesifikasjoner

---

## 5. Oppdragsbehandling

### Vise Oppdragsliste
1. Klikk "Oppdrag" i sidemenyen
2. Se alle oppdrag med status
3. Filtrer etter:
   - Søketekst
   - Status (Ventende, Pågår, Fullført, Kansellert)
   - Tekniker
   - Prioritet

### Opprette Nytt Oppdrag
1. Klikk "Legg til oppdrag" knappen
2. Fyll ut i popup-vinduet:
   - Tittel (påkrevd)
   - Beskrivelse
   - Velg heis fra dropdown
   - Velg tekniker fra dropdown
   - Sett fristdato
   - Velg prioritet (Høy, Medium, Lav)
   - Sett status
3. Klikk "Lagre"

### Redigere Oppdrag
1. Klikk "Rediger" ved siden av oppdraget
2. Oppdater ønsket informasjon
3. Klikk "Lagre endringer"

### Håndtere Prosedyrer
1. Klikk "Prosedyre" ved siden av et oppdrag
2. Se/rediger prosedyreliste
3. Huk av fullførte steg
4. Klikk "Lukk" når ferdig

---

## 6. Salgsarbeidsflyt

### Kunde til Oppdrag Workflow
1. Klikk "Salgsarbeidsflyt" i sidemenyen
2. Klikk "Kunde til oppdrag" fanen
3. Følg 4-stegs prosessen:
   - **Steg 1**: Velg eksisterende kunde eller opprett ny
   - **Steg 2**: Legg til eller velg heis
   - **Steg 3**: Opprett tilbud med linjer
   - **Steg 4**: Konverter til ordre og oppdrag
4. Naviger mellom steg med "Neste" og "Tilbake"

### Salgspipeline
1. Klikk "Salgspipeline" i sidemenyen
2. Se muligheter organisert i kolonner:
   - Lead
   - Kvalifisert
   - Tilbud
   - Forhandling
   - Vunnet
   - Tapt
3. Dra og slipp muligheter mellom kolonner
4. Klikk på en mulighet for å redigere

### Oppfølgingsplanlegger
1. Klikk "Oppfølging" i sidemenyen
2. Se oversikt over planlagte oppfølginger
3. Legg til ny oppfølging med dato og notater
4. Marker som fullført når gjennomført

---

## 7. Tilbudsbehandling

### Vise Tilbudsliste
1. Klikk "Tilbud" i sidemenyen
2. Se alle tilbud med:
   - Tilbudsnummer
   - Kunde
   - Total sum
   - Status
   - Utstedelsesdato
3. Bruk søk og filtrering

### Opprette Nytt Tilbud
1. Følg Salgsarbeidsflyt for integrert prosess
2. Eller opprett direkte fra tilbudslisten
3. Legg til tilbudslinjer:
   - Produkt/tjeneste
   - Mengde
   - Enhetspris
   - MVA-sats
4. Systemet beregner totaler automatisk

### Tilbudsdetaljer
1. Klikk på et tilbud for detaljer
2. Se komplett tilbudsinformasjon
3. Last ned som PDF
4. Konverter til ordre ved aksept

---

## 8. Ordrebehandling

### Vise Ordreliste
1. Klikk "Ordre" i sidemenyen
2. Se alle ordre med:
   - Ordrenummer
   - Kunde
   - Total sum
   - Status
   - Ordredato
3. Filtrer etter status eller søk

### Ordredetaljer
1. Klikk på en ordre for detaljer
2. Se:
   - Kundeinfo
   - Ordrelinjer
   - Tilknyttede oppdrag
   - Total med MVA
3. Spor ordreprogresjon

### Konvertere Tilbud til Ordre
1. Åpne tilbudsdetaljer
2. Klikk "Konverter til ordre"
3. Bekreft konvertering
4. Ordre opprettes automatisk med samme linjer

---

## 9. Brukerbehandling

### Vise Brukerliste
1. Klikk "Brukere" i sidemenyen (kun admin)
2. Se alle systembrukere
3. Filtrer etter rolle eller søk på navn

### Legge til Ny Bruker
1. Klikk "Legg til bruker" knappen
2. Fyll ut i popup-vinduet:
   - Brukernavn (påkrevd)
   - Passord (påkrevd)
   - Fornavn
   - Etternavn
   - E-post
   - Telefonnummer
   - Fødselsdato
   - Adresse
   - Rolle (admin, tekniker, selger)
   - Førerkort (Ja/Nei)
   - Truckførerbevis (Ja/Nei)
   - Annet sertifikat
3. Last opp profilbilde (valgfritt)
4. Klikk "Lagre"

### Se Brukerdetaljer
1. Klikk "Vis detaljer" ved siden av bruker
2. Se komplett brukerinformasjon
3. Se sertifikater og kompetanse
4. Klikk "Lukk" for å gå tilbake

---

## 10. Fraværsbehandling

### Vise Fraværsoversikt
1. Klikk "Fravær" i sidemenyen
2. Se kalendervisning med:
   - Alle registrerte fravær
   - Fargekodet etter type
   - Månedsvisning som standard

### Registrere Nytt Fravær
1. Klikk "Legg til fravær" knappen
2. Fyll ut:
   - Velg bruker (admin) eller deg selv
   - Fra-dato
   - Til-dato
   - Type (Ferie, Sykdom, Permisjon, Annet)
   - Beskrivelse (valgfritt)
3. Klikk "Lagre"

### Redigere/Slette Fravær
1. Klikk på et fravær i kalenderen
2. Velg "Rediger" eller "Slett"
3. Gjør endringer og lagre

---

## 11. Kalender og Planlegging

### Oppdragskalender
1. Klikk "Kalender" i sidemenyen
2. Se månedsvisning av oppdrag
3. Naviger mellom måneder med pilene
4. Klikk på et oppdrag for detaljer
5. Farger indikerer status:
   - Grå: Ventende
   - Blå: Pågår
   - Grønn: Fullført
   - Rød: Kansellert

### Teknikertilgjengelighet
1. Tilgjengelig for administratorer
2. Se når teknikere er opptatt/ledig
3. Planlegg oppdrag basert på tilgjengelighet
4. Unngå dobbeltbooking

---

## 12. Kamerafunksjon

### Bruke Kamera
1. Klikk "Kamera" i sidemenyen
2. Gi tillatelse til kamerabruk når forespurt
3. Funksjoner:
   - Ta bilde med "Capture" knappen
   - Skann QR-koder automatisk
   - Skann strekkoder
   - Bytt mellom front/bak kamera
4. Resultat vises under kameraet
5. Bilder kan brukes til dokumentasjon

### QR/Strekkode Skanning
1. Hold kamera mot koden
2. Automatisk gjenkjenning
3. Resultat vises umiddelbart
4. Kan kobles til heis-ID eller utstyr

---

## Generelle Tips

### Mobilbruk
- Systemet er fullt responsivt
- Sidemeny kollapser til hamburger
- Touch-vennlige knapper
- Swipe for kalendernavigering

### Søk og Filtrering
- Bruk søkefelt for rask tilgang
- Kombiner flere filtre
- Søk oppdateres i sanntid
- Tøm filtre med "X" knappen

### Feilhåndtering
- Røde feilmeldinger vises øverst
- Grønne suksessmeldinger bekrefter handlinger
- Påkrevde felt markert med stjerne (*)
- Validering skjer før lagring

### Hurtigtaster
- Enter: Bekreft i skjemaer
- Escape: Lukk modaler
- Tab: Naviger mellom felt
