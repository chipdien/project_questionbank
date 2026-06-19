---
name: db-migration-documentation
description: User requires DB schema changes to be clearly documented for traceability
metadata:
  type: feedback
---

When changing the database schema (prisma migrate), the user requires it to be clearly documented: which table, which columns added/changed, data types, defaults, and indexes — so DB changes can be traced later. Also prefers descriptive prisma migration names.

**Why:** The user manages the MySQL DB directly and needs an auditable record of every structural change.

**How to apply:** Record migrations in the feature's `data-model.md` (a "Migration log" section listing table/column/type/default/index) and use descriptive migration filenames. Separately, the user prefers NOT to migrate when a feature can be read-only (see the 010-page-list feature, which was explicitly read-only).
