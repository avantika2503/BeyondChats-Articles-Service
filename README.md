# BeyondChats Articles Service

## Overview

This service implements **Phase 1** of the BeyondChats assignment.

The goal of Phase 1 is to:

* Dynamically fetch the **5 oldest blog articles** from the BeyondChats website
* Extract their **full content**
* Store them in a MySQL database
* Expose APIs to retrieve the stored articles

The implementation focuses on correctness, robustness, and real‑world scraping constraints rather than hardcoded assumptions.

---

## Tech Stack

* **Backend Framework:** Laravel (PHP)
* **Database:** MySQL
* **HTTP Client:** Laravel HTTP Client (Guzzle)
* **HTML Parsing:** Symfony DomCrawler
* **Version Control:** Git + GitHub

---

## High‑Level Architecture

```
BeyondChats Blog Website
        ↓
Scraper Command (Laravel Artisan)
        ↓
Article Parsing Logic
        ↓
MySQL Database (articles table)
        ↓
REST API (/api/articles)
```

---

## Phase 1 – Functional Breakdown

### 1. Dynamic Blog Discovery

Instead of hardcoding page numbers, the scraper:

* Starts from `https://beyondchats.com/blogs/`
* Detects pagination links dynamically
* Identifies the **last page** (oldest articles)

This ensures the solution remains valid even when new blogs are added.

---

### 2. Correct Oldest‑First Traversal

To fetch the **oldest 5 articles globally**, the scraper:

* Traverses pages **backwards** (last page → previous pages)
* Within each page, iterates articles **from bottom to top**
* Stops as soon as 5 unique article URLs are collected

This avoids incorrectly picking newer articles from older pages.

---

### 3. Accurate DOM Targeting

The scraper avoids sidebar, featured posts, tags, and author links by:

* Selecting only `article h2 a` for article URLs
* Extracting article content strictly from the `.post-content` container

This ensures:

* No featured or related articles are accidentally included
* Only the actual blog body is stored

---

### 4. Full Content Extraction

For each selected article:

* The page is fetched individually
* The title is extracted from the `<h1>` tag
* The body content is extracted from `.post-content`
* Only readable elements (`p`, `h2`, `h3`, `ul`, `ol`) are stored

Content is stored as **plain text**, which is sufficient for backend processing and retrieval.

---

### 5. Database Design

The `articles` table schema:

| Column       | Type      | Description                    |
| ------------ | --------- | ------------------------------ |
| id           | bigint    | Primary key                    |
| title        | string    | Article title                  |
| content      | longText  | Full article content           |
| source_url   | string    | Unique article URL             |
| is_generated | boolean   | Future use (AI‑generated flag) |
| created_at   | timestamp | Record creation                |
| updated_at   | timestamp | Record update                  |

The `source_url` column is unique to ensure:

* No duplicate inserts
* Idempotent scraper execution

---

### 6. Scraper Execution

The scraper is implemented as a Laravel Artisan command:

```bash
php artisan app:scrape-beyond-chats-old-blogs
```

Behavior:

* Can be run multiple times safely
* Updates existing articles if already present
* Inserts missing articles

---

### 7. API Endpoints

#### Fetch Stored Articles

```
GET /api/articles
```

Returns:

* All stored articles
* Includes title, content, source URL, timestamps

This satisfies the Phase 1 API requirement.

---

## How to Run Locally

### 1. Clone Repository

```bash
git clone <repository-url>
cd backend
```

### 2. Install Dependencies

```bash
composer install
```

### 3. Configure Environment

* Create `.env`
* Configure MySQL credentials

```env
DB_DATABASE=your_db
DB_USERNAME=your_user
DB_PASSWORD=your_password
```

### 4. Run Migrations

```bash
php artisan migrate
```

### 5. Run Scraper

```bash
php artisan app:scrape-beyond-chats-old-blogs
```

### 6. Start Server

```bash
php artisan serve
```

Access API:

```
http://127.0.0.1:8000/api/articles
```

---

## Notes & Assumptions

* SSL verification is disabled **only for local development** (Windows environment issue)
* HTML structure is assumed stable based on current BeyondChats site
* Images and rich HTML formatting are intentionally excluded

---

## Phase 1 Status

✅ Phase 1 completed successfully

The system dynamically fetches and stores the 5 oldest BeyondChats blog articles with full content and exposes them via API.

---

## Next Steps (Phase 2)

* Integrate Node.js service
* Fetch latest articles from Google Search
* Generate AI‑based summaries using LLM
* Store generated articles alongside scraped content
