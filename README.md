# User CRUD Mock Backend (Bun)

Mock backend in **Bun** con API RESTful per la gestione utenti (CRUD), ideale per test di integrazione, simulazioni e test di app con GitHub.

## 🚀 Requisiti

- [Bun](https://bun.sh) v1.0+ (consigliato 1.4+)

## 🛠️ Avvio

Installa le dipendenze (se non già fatto):
```bash
bun install
```

Avvia il server in modalità sviluppo (con live reload):
```bash
bun run dev
```

Oppure in produzione:
```bash
bun run start
```

Il server sarà attivo su `http://localhost:3000` (o sulla porta specificata nella variabile d'ambiente `PORT`).

## 🧪 Test

Esegui la suite di test integrata:
```bash
bun test
```

Verifica il controllo dei tipi:
```bash
bun run typecheck
```

## 📡 API Endpoints

| Metodo | Endpoint | Descrizione |
|---|---|---|
| `GET` | `/` | Informazioni API ed elenco endpoint |
| `GET` | `/health` | Health check (`{ "status": "ok" }`) |
| `GET` | `/api/users` | Recupera tutti gli utenti |
| `GET` | `/api/users/:id` | Recupera un utente per ID |
| `POST` | `/api/users` | Crea un nuovo utente |
| `PUT` | `/api/users/:id` | Sostituisce/aggiorna un utente esistente |
| `PATCH` | `/api/users/:id` | Aggiorna parzialmente un utente |
| `DELETE` | `/api/users/:id` | Elimina un utente |

### Modello Utente

```json
{
  "id": "uuid-v4",
  "name": "Mario Rossi",
  "email": "mario.rossi@example.com",
  "role": "user",
  "createdAt": "2026-11-04T18:00:00.000Z",
  "updatedAt": "2026-11-04T18:00:00.000Z"
}
```

### Esempi cURL

#### 1. Creazione utente (`POST /api/users`)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Mario Rossi", "email": "mario@example.com", "role": "admin"}'
```

#### 2. Lista utenti (`GET /api/users`)
```bash
curl http://localhost:3000/api/users
```

#### 3. Dettaglio utente (`GET /api/users/:id`)
```bash
curl http://localhost:3000/api/users/<USER_ID>
```

#### 4. Aggiornamento completo utente (`PUT /api/users/:id`)
```bash
curl -X PUT http://localhost:3000/api/users/<USER_ID> \
  -H "Content-Type: application/json" \
  -d '{"name": "Mario Rossi Aggiornato", "email": "mario.new@example.com", "role": "user"}'
```

#### 5. Aggiornamento parziale utente (`PATCH /api/users/:id`)
```bash
curl -X PATCH http://localhost:3000/api/users/<USER_ID> \
  -H "Content-Type: application/json" \
  -d '{"role": "editor"}'
```

#### 6. Cancellazione utente (`DELETE /api/users/:id`)
```bash
curl -X DELETE http://localhost:3000/api/users/<USER_ID>
```
