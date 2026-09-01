# Design Spec: Hacker News Forms Modernization (`/login` & `/submit`)

## Overview
This specification details the Veneer DSL (`.vnr`) modernization of legacy Hacker News forms (`https://news.ycombinator.com/login` and `https://news.ycombinator.com/submit`) using the agnostic `UiFormContainer` component.

## Component Reconstruction Mapping

### 1. Login Page (`news.ycombinator.com/login`)

#### A. Login Form
- **Container Selector**: `form[action='login']:first-of-type`
- **Url Pattern**: `R"(news\.ycombinator\.com\/login)"`
- **Layout Component**: `UiFormContainer`
- **Props**:
  - `title`: `"Login no Hacker News"`
  - `subTitle`: `"Entre com suas credenciais"`
  - `actionUrl`: `"login"`
  - `method`: `"post"`
  - `submitLabel`: `"Entrar"`
- **Child Fields**:
  - `acct`: Username text input (`input[name='acct']`)
  - `pw`: Password input (`input[name='pw']`)

#### B. Create Account Form
- **Container Selector**: `form[action='login']:last-of-type`
- **Url Pattern**: `R"(news\.ycombinator\.com\/login)"`
- **Layout Component**: `UiFormContainer`
- **Props**:
  - `title`: `"Criar Nova Conta"`
  - `subTitle`: `"Cadastre seu usuário para enviar histórias"`
  - `actionUrl`: `"login"`
  - `method`: `"post"`
  - `submitLabel`: `"Criar Conta"`
- **Child Fields**:
  - `acct`: Username text input (`input[name='acct']`)
  - `pw`: Password input (`input[name='pw']`)

---

### 2. Submit Story Page (`news.ycombinator.com/submit`)

#### A. Submit Form
- **Container Selector**: `form[action='r']`
- **Url Pattern**: `R"(news\.ycombinator\.com\/submit)"`
- **Layout Component**: `UiFormContainer`
- **Props**:
  - `title`: `"Enviar História para o Hacker News"`
  - `subTitle`: `"Insira uma URL para compartilhar um link ou preencha o texto para Ask/Show HN"`
  - `actionUrl`: `"r"`
  - `method`: `"post"`
  - `submitLabel`: `"Publicar História"`
- **Child Fields**:
  - `title`: Story title text input (`input[name='title']`)
  - `url`: Link URL input (`input[name='url']`)
  - `text`: Textarea input (`textarea[name='text']`)

---

## Verification Plan
1. Compile `vnr_project` using `spm compile ... --strict`.
2. Verify zero warnings or errors.
3. Test locally in browser with `spm dev`.
4. Keep `spm-websites` changes strictly local (do NOT push to remote).
