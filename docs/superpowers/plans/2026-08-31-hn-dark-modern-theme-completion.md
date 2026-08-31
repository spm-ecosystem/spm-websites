# `news.ycombinator.com/dark-modern` Theme Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `news.ycombinator.com/dark-modern` in `spm-websites` to a 100% complete, production-grade Veneer Spec using `UiNavHeader`, `UiTableListPage`, `UiCommentListPage` (with DOMPurify rich text), and `UiSearchBar`.

**Architecture:** Modernize `vnr_project/classes.vnr`, `vnr_project/navigation.vnr`, `vnr_project/pages.vnr`, and `vnr_project/theme.vnr` using C++ Veneer Spec syntax and compile with `spm compile`.

**Tech Stack:** C++ Veneer Spec (`spm-cli`), React 18 (`spm-components`), JSON Manifests (`spm-websites`).

## Global Constraints

- **Compilability**: `vnr_project` must compile cleanly with `./build/spm compile` without warnings or syntax errors.
- **Design Tokens**: Theme must use standard `--spm-*` design token CSS variables (`--spm-bg-primary: #060606`, `--spm-accent: #ff6600`).
- **Clean Execution**: All 179 Vitest tests in `extension` must remain 100% passing.

---

### Task 1: Navigation Header & Blueprint Classes (`navigation.vnr` & `classes.vnr`)

**Files:**
- Create/Modify: `/home/watashi/Projects/spm-websites/news.ycombinator.com/dark-modern/vnr_project/classes.vnr`
- Create/Modify: `/home/watashi/Projects/spm-websites/news.ycombinator.com/dark-modern/vnr_project/navigation.vnr`

**Interfaces:**
- Consumes: `UiNavHeader` props (`siteName`, `logoUrl`, `logoHref`, `sticky`, `primaryLinks`, `secondaryLinks`) and `HNStoryItem` class blueprint.
- Produces: Compiled header reconstruct and story blueprint class AST nodes.

- [ ] **Step 1: Update `classes.vnr` with complete blueprint models**

Write to `/home/watashi/Projects/spm-websites/news.ycombinator.com/dark-modern/vnr_project/classes.vnr`:
```vnr
class HNStoryItem {
    bind rank: "td.title .rank | text";
    bind title: "td.title .titleline > a | text";
    bind url: "td.title .titleline > a | attr:href";
    bind domain: "td.title .titleline .sitestr | text";
    bind points: "following-sibling::tr/td.subtext .score | text";
    bind author: "following-sibling::tr/td.subtext a.hnuser | text";
    bind timeAgo: "following-sibling::tr/td.subtext span.age | text";
    bind commentsCount: "following-sibling::tr/td.subtext a:last-child | text";
}

class HNCommentItem {
    bind author: "a.hnuser | text";
    bind date: "span.age | text";
    bind body: "div.comment span.commtext | html";
}
```

- [ ] **Step 2: Update `navigation.vnr` with `UiNavHeader` reconstruct**

Write to `/home/watashi/Projects/spm-websites/news.ycombinator.com/dark-modern/vnr_project/navigation.vnr`:
```vnr
reconstruct ".hnmain > tbody > tr:first-child" -> UiNavHeader {
    siteName: "Hacker News";
    logoUrl: "https://news.ycombinator.com/y18.svg";
    logoHref: "/";
    sticky: "true";

    child primaryLinks {
        selector: "td:nth-child(2) span.pagetop a";
        bind label: "self | text";
        bind url: "self | attr:href";
    }

    child secondaryLinks {
        selector: "td:last-child span.pagetop a";
        bind label: "self | text";
        bind url: "self | attr:href";
    }
}
```

- [ ] **Step 3: Compile and verify header reconstruction**

Run: `/home/watashi/Projects/spm-cli/build/spm compile /home/watashi/Projects/spm-websites/news.ycombinator.com/dark-modern/vnr_project -o /home/watashi/Projects/spm-websites/news.ycombinator.com/dark-modern/manifest.json`
Expected: Output `[SPM] Successfully compiled ... -> manifest.json` with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add news.ycombinator.com/dark-modern/vnr_project/classes.vnr news.ycombinator.com/dark-modern/vnr_project/navigation.vnr news.ycombinator.com/dark-modern/manifest.json
git commit -m "feat(websites): reconstruct Hacker News header with UiNavHeader and add HNStoryItem blueprint"
```

---

### Task 2: Page Layouts & Search Reconstruction (`pages.vnr`)

**Files:**
- Modify: `/home/watashi/Projects/spm-websites/news.ycombinator.com/dark-modern/vnr_project/pages.vnr`

**Interfaces:**
- Consumes: `UiTableListPage`, `UiCommentListPage`, `UiSearchBar`, `HNStoryItem`, `HNCommentItem`.
- Produces: Complete page layout reconstructions for story feed and discussion threads.

- [ ] **Step 1: Update `pages.vnr` with structured reconstructions**

Write to `/home/watashi/Projects/spm-websites/news.ycombinator.com/dark-modern/vnr_project/pages.vnr`:
```vnr
targetUrl: "*://news.ycombinator.com/*";

reconstruct "table.itemlist" -> UiTableListPage {
    pageTitle: "Hacker News — Top Stories";

    child tableRows extends HNStoryItem {
        selector: "tr.athing";
    }

    child pageLinks {
        selector: "a.morelink";
        bind label: "self | text";
        bind url: "self | attr:href";
    }
}

reconstruct "table.comment-tree" -> UiCommentListPage {
    pageTitle: "Discussion Thread";

    child comments extends HNCommentItem {
        selector: "tr.athing.comtr";
    }
}

reconstruct "form[action*='search']" -> UiSearchBar {
    bind defaultValue: "input[name='q'] | attr:value";
    bind queryParamName: "q";
}
```

- [ ] **Step 2: Compile theme manifest**

Run: `/home/watashi/Projects/spm-cli/build/spm compile /home/watashi/Projects/spm-websites/news.ycombinator.com/dark-modern/vnr_project -o /home/watashi/Projects/spm-websites/news.ycombinator.com/dark-modern/manifest.json`
Expected: Output `[SPM] Successfully compiled ...` with zero warnings.

- [ ] **Step 3: Commit and push**

```bash
git add news.ycombinator.com/dark-modern/vnr_project/pages.vnr news.ycombinator.com/dark-modern/manifest.json
git commit -m "feat(websites): complete pages.vnr for Hacker News feed and comment threads using UiTableListPage and UiCommentListPage"
git push origin main
```
