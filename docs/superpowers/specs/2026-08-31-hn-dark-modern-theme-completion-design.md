# Design Spec: Hacker News (`news.ycombinator.com/dark-modern`) Theme Completion

**Status:** APPROVED
**Target Theme Directory:** `/home/watashi/Projects/spm-websites/news.ycombinator.com/dark-modern`
**Target Repositories:** `spm-websites`

---

## 1. Overview & Objectives

Upgrade the existing `news.ycombinator.com/dark-modern` theme in `spm-websites` from a basic draft into a 100% complete, production-grade Veneer Spec (`.vnr`) modernization.

This theme will serve as the reference standard for the 29 SPM React components, utilizing `UiNavHeader`, `UiTableListPage`, `UiCommentListPage` (with DOMPurify rich text rendering), and `UiSearchBar`.

---

## 2. Architecture & File Structure

The theme files are located in `/home/watashi/Projects/spm-websites/news.ycombinator.com/dark-modern/`:

```
news.ycombinator.com/dark-modern/
├── manifest.json                  # Output JSON compiled by spm-cli
└── vnr_project/
    ├── classes.vnr                # Blueprint models (HNStoryItem, HNCommentItem)
    ├── navigation.vnr             # Header & Nav reconstruction (UiNavHeader)
    ├── pages.vnr                  # Page layouts (UiTableListPage, UiCommentListPage, UiSearchBar)
    └── theme.vnr                  # Design tokens & global CSS overrides
```

---

## 3. Detailed Component Mappings

### A. Navigation Header (`navigation.vnr`)
- **Container Selector**: `tr:has(td[bgcolor="#ff6600"])` / `.hnmain > tbody > tr:first-child`
- **Target Component**: `UiNavHeader`
- **Properties**:
  - `siteName`: `"Hacker News"`
  - `logoUrl`: `"https://news.ycombinator.com/y18.svg"`
  - `logoHref`: `"/"`
  - `sticky`: `true`
  - `primaryLinks`:
    - `{ label: "new", url: "/newest" }`
    - `{ label: "past", url: "/front" }`
    - `{ label: "comments", url: "/newcomments" }`
    - `{ label: "ask", url: "/ask" }`
    - `{ label: "show", url: "/show" }`
    - `{ label: "jobs", url: "/jobs" }`
    - `{ label: "submit", url: "/submit" }`
  - `secondaryLinks`:
    - `{ label: "login", url: "/login" }`

### B. Story Feed (`classes.vnr` & `pages.vnr`)
- **Class Model (`HNStoryItem`)**:
  - `rank`: `"td.title .rank | text"`
  - `title`: `"td.title .titleline > a | text"`
  - `url`: `"td.title .titleline > a | attr:href"`
  - `domain`: `"td.title .titleline .sitestr | text"`
  - `points`: `"following-sibling::tr/td.subtext .score | text"`
  - `author`: `"following-sibling::tr/td.subtext a.hnuser | text"`
  - `timeAgo`: `"following-sibling::tr/td.subtext span.age | text"`
  - `commentsCount`: `"following-sibling::tr/td.subtext a:last-child | text"`
- **Container Selector**: `table.itemlist` / `#hnmain`
- **Target Component**: `UiTableListPage`
- **Properties**:
  - `pageTitle`: `"Hacker News — Top Stories"`
  - `child tableRows extends HNStoryItem` with `selector: "tr.athing"`

### C. Comment Threads (`classes.vnr` & `pages.vnr`)
- **Container Selector**: `table.comment-tree`
- **Target Component**: `UiCommentListPage`
- **Properties**:
  - `pageTitle`: `"Discussion Thread"`
  - `child comments` with:
    - `author`: `"a.hnuser | text"`
    - `date`: `"span.age | text"`
    - `body`: `"div.comment span.commtext | html"`
    - `isHtml`: `true`

---

## 4. Verification & Testing Strategy

1. **Compilation**: Compile `vnr_project/` using `./build/spm compile` without warnings or errors.
2. **Dev Server Watcher**: Run `spm dev /home/watashi/Projects/spm-websites/news.ycombinator.com/dark-modern` and verify hot-reload.
