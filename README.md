# Heisfirma Administrasjonssystem

Dette er et administrasjonssystem for heisfirmaer, utviklet for å håndtere oppdrag, kunder, heiser og tekniske ressurser.

## Systemet inneholder:

1. **Backend (Django/REST API)**
   - Brukeradministrasjon med roller (admin, tekniker, selger)
   - Kundeadministrasjon
   - Heisadministrasjon og typekatalog
   - Oppdragshåndtering og arbeidsflyt
   - Deladministrasjon og inventarstyring

2. **Frontend (React)**
   - Admin-grensesnitt for driftsledere
   - Tekniker-grensesnitt for arbeidere i felt
   - Responsivt design som fungerer på både PC, nettbrett og mobil

## Teknisk oppbygning

### Backend
- Django REST Framework
- SQLite for utvikling (kan lett byttes til PostgreSQL for produksjon)
- Token-basert autentisering
- CORS-støtte for sikker frontend-kommunikasjon

### Frontend
- React med hooks
- Axios for API-kommunikasjon  
- React Router for navigasjon
- Responsive komponenter

## Installasjon og oppsett

### Backend

1. Klon repositoriet
2. Opprett et virtuelt miljø: `python -m venv venv`
3. Aktiver miljøet:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Installer avhengigheter: `pip install -r requirements.txt`
5. Opprett en `.env`-fil med følgende innhold:
   ```
   SECRET_KEY=din_hemmelige_nøkkel_her
   ```
6. Kjør migrasjoner: `python manage.py migrate`
7. Opprett en superbruker: `python manage.py createsuperuser`
8. Start serveren: `python manage.py runserver`

Backenden vil nå kjøre på http://localhost:8000/

### Frontend

1. Naviger til frontend-mappen: `cd heis_frontend`
2. Installer avhengigheter: `npm install`
3. Start utviklingsserveren: `npm start`

Frontenden vil nå kjøre på http://localhost:3000/

## API Endepunkter

- `/api/users/` - Brukerhåndtering
- `/api/customers/` - Kundehåndtering
- `/api/elevator-types/` - Heistyper
- `/api/elevators/` - Heiser
- `/api/parts/` - Deler
- `/api/assignments/` - Oppdrag og arbeidsordre

Autentisering skjer via `/api-token-auth/` med brukernavn og passord.

## Mobile applikasjoner

I tillegg til webapplikasjonen, kan systemet enkelt utvides med:

1. **React Native mobilapp for teknikere**
   - Tilgang til dagsplan og oppdrag
   - Offline-modus for arbeid i områder uten nettdekning
   - Mulighet for å ta bilder og registrere timer

2. **Flutter tablett-app for installatører**
   - Detaljerte installasjonsanvisninger
   - Sjekklister for installasjon og service
   - Direkte tilgang til dokumentasjon og manualer 