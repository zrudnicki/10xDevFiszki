# 10xDevFiszki API Documentation

Dokumentacja API dla aplikacji 10xDevFiszki - systemu do AI-generowanego tworzenia fiszek do nauki.

## 📁 Struktura dokumentacji

- **[API.md](./API.md)** - Kompletna dokumentacja API endpoints
- **[10xDevFiszki-API.postman_collection.json](./10xDevFiszki-API.postman_collection.json)** - Kolekcja Postman do testowania

## 🚀 Szybki start

### 1. Import kolekcji Postman

1. Otwórz Postman
2. Kliknij `Import`
3. Wybierz plik `10xDevFiszki-API.postman_collection.json`
4. Kolekcja zostanie dodana z predefiniowanymi requestami

### 2. Testowanie API

#### Logowanie:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.pl", "password": "testtest"}' \
  -c cookies.txt
```

#### Generowanie fiszek:
```bash
curl -X POST http://localhost:3001/api/generate-flashcards \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "text": "JavaScript to język programowania stosowany głównie do tworzenia interaktywnych stron internetowych. Jest to język interpretowany, co oznacza, że kod jest wykonywany bezpośrednio przez przeglądarkę internetową bez konieczności wcześniejszej kompilacji. JavaScript umożliwia manipulację elementów DOM (Document Object Model), obsługę wydarzeń użytkownika oraz komunikację z serwerami poprzez AJAX. Język ten obsługuje programowanie obiektowe oraz funkcyjne. Zmienne w JavaScript mogą być deklarowane za pomocą słów kluczowych var, let i const.",
    "max_cards": 3
  }'
```

#### Recenzja i akceptacja fiszek:
```bash
curl -X POST http://localhost:3001/api/flashcards/review \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "collection_id": "12345678-1234-1234-1234-123456789abc",
    "category_id": "12345678-1234-1234-1234-123456789def",
    "flashcards": [
      {
        "front": "What is TypeScript?",
        "back": "Superset of JavaScript with static typing",
        "action": "accept_direct"
      },
      {
        "front": "What are React hooks?",
        "back": "Functions that let you use state and lifecycle in components",
        "action": "accept_edited"
      }
    ]
  }'
```

#### Wyświetlanie statystyk:
```bash
curl -X GET http://localhost:3001/api/stats/generation \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### 3. Zmienne środowiskowe

Postman automatycznie używa:
- `{{baseUrl}}` = `http://localhost:3001/api`

## 📊 Status API

- ✅ **Authentication** - `/auth/login`
- ✅ **AI Generation** - `/generate-flashcards`
- ✅ **Statistics** - `/stats/generation`
- ✅ **Rate Limiting** - 10 req/min per user
- ✅ **Error Handling** - Standardowe kody błędów

## 🛠️ Technologie

- **Backend**: Astro 5 + TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenRouter (Mistral 7B Instruct)
- **Validation**: Zod schemas
- **Auth**: Supabase Auth + session cookies

## 📈 Metryki wydajności

- **Czas odpowiedzi**: ~1-10s (zależnie od AI)
- **Rate limit**: 10 requestów/minutę/użytkownik
- **Maksymalny tekst**: 10,000 znaków
- **Maksymalne fiszki**: 15 na request

## 🔧 Rozwój

Dokumentacja jest automatycznie aktualizowana wraz z rozwojem API. 

### Dodawanie nowych endpointów:

1. Dodaj endpoint w `src/pages/api/`
2. Zaktualizuj `docs/API.md`
3. Dodaj request do kolekcji Postman
4. Przetestuj i udokumentuj

### 4. Categories Management

#### Get Categories List
```bash
curl -X GET "http://localhost:3001/api/categories?limit=20&sort=name&order=asc" \
  -b cookies.txt
```

#### Create Category
```bash
curl -X POST http://localhost:3001/api/categories \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "JavaScript"
  }'
```

#### Get Single Category
```bash
curl -X GET http://localhost:3001/api/categories/da640844-3465-4941-a6c9-f6acca3e7857 \
  -b cookies.txt
```

#### Update Category
```bash
curl -X PUT http://localhost:3001/api/categories/da640844-3465-4941-a6c9-f6acca3e7857 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "JavaScript & TypeScript"
  }'
```

#### Delete Category
```bash
curl -X DELETE http://localhost:3001/api/categories/da640844-3465-4941-a6c9-f6acca3e7857 \
  -b cookies.txt
```

### 5. Statistics

---

**Ostatnia aktualizacja**: 31.05.2025  
**Wersja API**: 1.0.0 