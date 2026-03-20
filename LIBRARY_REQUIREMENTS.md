# Library management — requirements research (MVP)

This document summarizes common **integrated library system (ILS)** expectations and how this demo app maps to them.

## Industry / standards (high level)

| Area | Typical expectations | This app |
|------|---------------------|----------|
| **Catalog (OPAC)** | Search by title, author, subject; item details (ISBN, publisher, year); holdings (copies, availability) | ✅ Search includes description; sort by title, author, year, date added; book detail page |
| **Circulation** | Loan period, due dates, renewals (limited), returns, active loan cap | ✅ 14-day loan, max **10** active loans, **2 renewals** × **14 days**, return |
| **Inventory** | Multiple copies per title, shelf / call number | ✅ `total_copies` / `available_copies`, `shelf_location` |
| **Metadata** | MARC is the library standard; for apps, flat fields often suffice | ✅ Title, author, ISBN, category, description, publisher, year, language |
| **Access** | Public browse vs authenticated borrow | ✅ Public `/books` + auth dashboard |
| **Reporting** | Loans overdue, popular titles | ⚠️ Partial (due badges, history); full reports out of scope for MVP |

## Out of scope for this template (future)

- MARC import/export, authority records, serials
- Holds / reservations queue when all copies out
- Fines and payments
- Multi-branch transfers
- Z39.50 / SRU discovery
- Patron roles (librarian vs reader) with separate admin UI

## Demo data

- `db/migrations/004_seed_demo_books.sql` — ~45 titles across **Fiction, SF, Mystery, Science, History, Tech, Children’s**, etc., with ISBNs and shelf labels. Safe to re-run (`ON CONFLICT (isbn) DO NOTHING`).

## Scripts

```powershell
node db/run-all-migrations.js
```

After schema changes, redeploy **Render** (backend) so FastAPI matches the DB.
