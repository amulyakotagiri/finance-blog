# How to add & schedule articles

Articles are Markdown files in `content/articles/`.

- **Live site** only shows `status: published`
- **Drafts** stay invisible until published (manually or by the scheduler)

---

## Add a draft (recommended workflow)

1. Create `content/articles/my-post.md`:

```markdown
---
title: "Your article title"
slug: "my-post"
excerpt: "Short summary for the blog list."
category: "Budgeting"
author: "Your Name"
date: "2026-10-06"
status: draft
publishOn: "2026-10-10"
sources:
  - title: "Optional source"
    url: "https://example.com"
---

## First section

Write your article here...
```

2. Keep `status: draft` while you edit. Visitors never see it.
3. Optionally set `publishOn: "YYYY-MM-DD"` for the first day it is allowed to go live.

---

## Automatic publish (Tuesday & Friday)

A GitHub Action runs **every Tuesday and Friday at 09:00 UTC**.

### Default mode: `scheduled`

Any draft with:

```yaml
status: draft
publishOn: "2026-10-10"
```

is published when the job runs **on or after** that date.

After publish, the script sets `status: published`, sets `updated`, and removes `publishOn`.

### Queue mode (optional)

In GitHub → **Settings → Secrets and variables → Actions → Variables**:

| Variable        | Value     | Meaning                                      |
|-----------------|-----------|----------------------------------------------|
| `PUBLISH_MODE`  | `queue`   | Also publish unscheduled drafts              |
| `PUBLISH_LIMIT` | `1`       | Max number of queue drafts per run (default) |

With `queue`, each Tue/Fri the next oldest draft (even without `publishOn`) is published, up to the limit.

### Requirements for automation

1. Project is in a **GitHub** repository  
2. **Settings → Actions → General → Workflow permissions** → “Read and write permissions”  
3. Hosting (e.g. **Vercel**) connected to the repo so the bot’s push triggers a production deploy  

You can also click **Actions → Scheduled article publish → Run workflow** to publish due drafts immediately.

---

## Manual publish (anytime)

Change frontmatter:

```yaml
status: published
```

Save, commit, push → deploy. No need to wait for Tue/Fri.

---

## Local test of the scheduler

```bash
npm run publish:scheduled
```

Or force queue mode:

```bash
# Windows PowerShell
$env:PUBLISH_MODE="queue"; $env:PUBLISH_LIMIT="1"; npm run publish:scheduled
```

This only changes files on disk. Commit them if you want the change on the live site.

---

## Unpublish

Set `status: draft` again and deploy. The post disappears from the public site.

---

## Field reference

| Field        | Required | Notes |
|--------------|----------|--------|
| title        | yes      | H1 + list title |
| slug         | yes      | `/blog/your-slug` (kebab-case) |
| excerpt      | yes      | List summary |
| category     | yes      | e.g. Budgeting, Saving, Investing |
| author       | yes      | Display name |
| date         | yes      | `YYYY-MM-DD` |
| status       | yes      | `draft` or `published` |
| publishOn    | no       | Earliest auto-publish date `YYYY-MM-DD` |
| updated      | no       | Set automatically on auto-publish |
| sources      | no       | List of `{ title, url }` |
| metaTitle / metaDescription | no | SEO overrides |

Reading time is calculated from the body automatically.

Files starting with `_` (e.g. `_example-draft.md`) are ignored by the site and the scheduler.
