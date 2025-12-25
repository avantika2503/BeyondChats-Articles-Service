# BeyondChats Articles Service

## Overview

This repository implements the BeyondChats assignment across phases.

The system:

- Scrapes the **oldest blog articles** from the BeyondChats website  
- Extracts their **full content**  
- Stores them in a MySQL database  
- Exposes REST APIs via Laravel  
- Enhances existing articles using an LLM pipeline (Phase 2)  
- Provides a React frontend to view **original vs enhanced** articles (Phase 3)

The implementation focuses on correctness, robustness, and real-world constraints rather than hardcoded assumptions.

---

## Tech Stack

### Backend
- Laravel (PHP)
- MySQL
- Laravel HTTP Client (Guzzle)
- Laravel Artisan Commands

### Phase 2 – Article Enhancement
- Node.js
- mysql2 (promise)
- LLM via **Groq** (OpenAI-compatible chat completions)
- Model: **llama-3.1-8b-instant**

### Frontend
- ReactJS
- react-markdown

### Version Control
- Git + GitHub

---

## High-Level Architecture
```
BeyondChats Blog Website  
↓  
Laravel Scraper Command (Phase 1)  
↓  
MySQL Database (`articles` table)  
↓  
Node Enhancement Script (Phase 2)  
↓  
Laravel REST APIs  
↓  
React Frontend (Phase 3)
```
---

## Phase 1 – Blog Scraping and Storage

### 1. Dynamic Blog Discovery

Instead of hardcoding page numbers, the scraper:

- Starts from `https://beyondchats.com/blogs/`
- Detects pagination links dynamically
- Identifies the last page (oldest articles)

This keeps the solution valid even when new blogs are added.

### 2. Correct Oldest-First Traversal

To fetch the oldest 5 articles globally, the scraper:

- Traverses pages backwards (last page → previous pages)
- Iterates articles from bottom to top within each page
- Stops as soon as 5 unique article URLs are collected

This prevents accidentally selecting newer posts.

### 3. Accurate DOM Targeting

To avoid featured posts, tags, or sidebar content:

- Article URLs are extracted only from `article h2 a`
- Content is extracted strictly from the `.post-content` container

This ensures only real blog content is stored.

### 4. Full Content Extraction

For each selected article:

- Page is fetched individually
- Title is extracted from `<h1>`
- Body content is extracted from `.post-content`
- Only readable elements (`p`, `h2`, `h3`, `ul`, `ol`) are stored
- Content is stored as plain text for backend processing

### 5. Database Design

`articles` table schema:

| Column | Type | Description |
|------|------|------------|
| id | bigint | Primary key |
| title | string | Article title |
| content | longText | Full article content |
| source_url | string | Unique article URL |
| is_generated | boolean | Original vs enhanced flag |
| created_at | timestamp | Record creation |
| updated_at | timestamp | Record update |

Notes:
- `source_url` is unique to avoid duplicates
- Scraper execution is idempotent

### 6. Scraper Execution

Run using:
```
php artisan app:scrape-beyond-chats-old-blogs
```

Behavior:
- Safe to run multiple times
- Inserts missing articles
- Prevents duplicates automatically

### 7. API Endpoints

Fetch stored articles:
```
GET /api/articles
```

Returns:
- All stored articles
- Includes original and enhanced versions
- Includes `is_generated` flag

---

## Phase 2 – Article Enhancement Using LLM

### Goal

Enhance existing articles by rewriting them in a more modern, structured, and readable format while preserving meaning.

### Why Google Scraping Was Skipped

Fetching real Google ranking articles requires paid or rate-limited APIs (SerpAPI, Google Custom Search, etc).  
To keep the project fully runnable without external paid dependencies, Google scraping was intentionally skipped.

Instead, the enhancement relies on a strong LLM prompt that enforces:

- Better structure and formatting
- Clear headings and logical flow
- Modern professional tone
- Original phrasing (no copying)

### Enhancement Flow

- Fetch one original article (`is_generated = 0`)
- Ensure no enhanced version already exists for that article
- Send content to the LLM for enhancement
- Store enhanced version as a new row with:
  - Same title
  - `is_generated = 1`
- Re-run script until all articles are enhanced

### LLM Provider and Model

- Provider: **Groq**
- Model: **llama-3.1-8b-instant**

If the LLM call fails, the pipeline falls back to a structured enhancement output to ensure robustness.

---

## Phase 3 – React Frontend

### Goal

Provide a clean UI to view original and enhanced articles.

### Features

- Fetches articles from `GET /api/articles`
- Displays articles in responsive cards
- Supports:
  - Read more / View less
  - Toggle between original and enhanced versions
- Enhanced content renders correctly using Markdown via `react-markdown`

### Deployment

- The frontend is deployed independently (Vercel)
- Backend runs locally for API access

---

## How to Run Locally

### Backend Setup

```
git clone <repository-url>
cd backend
composer install
```

Configure `.env` with MySQL credentials.

Run migrations:
```
php artisan migrate
```

Run scraper:
```
php artisan app:scrape-beyond-chats-old-blogs
```

Run enhancement pipeline:
```
cd phase2
npm install
node enhanceArticle.js
```


Start server:
```
php artisan serve
```

API available at:
```
http://127.0.0.1:8000/api/articles
```

### Frontend Setup
```
cd frontend
npm install
npm run dev
```

---

## Status

- Phase 1 completed
- Phase 2 completed
- Phase 3 completed
