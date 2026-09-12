#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];

if (!filePath) {
  console.error('::error:: No CSS file path specified. Usage: node validate-css.js <path-to-content.css>');
  process.exit(1);
}

let content;
try {
  content = fs.readFileSync(filePath, 'utf8');
} catch (err) {
  console.error(`::error file=${filePath}:: File not found or unreadable: ${err.message}`);
  process.exit(1);
}

function reportError(msg, errLine, errCol) {
  console.error(`::error file=${filePath}:: ${msg} at line ${errLine}, column ${errCol}`);
  process.exit(1);
}

let line = 1;
let col = 1;
let inComment = false;
let commentStart = null;
let inString = null; // "'" or '"'
let stringStart = null;
let escape = false;

const braceStack = [];
const parenStack = [];
const bracketStack = [];

let currentStatement = '';
let statementStartLine = 1;
let statementStartCol = 1;

let totalDeclarations = 0;
let importantCount = 0;

for (let i = 0; i < content.length; i++) {
  const char = content[i];

  if (inComment) {
    if (char === '*' && content[i + 1] === '/') {
      inComment = false;
      i++;
      col++;
    }
  } else if (inString) {
    currentStatement += char;
    if (escape) {
      escape = false;
    } else if (char === '\\') {
      escape = true;
    } else if (char === '\n') {
      reportError(`Unclosed string literal`, stringStart.line, stringStart.col);
    } else if (char === inString) {
      inString = null;
    }
  } else {
    // Structural CSS syntax checking
    if (char === '/' && content[i + 1] === '*') {
      inComment = true;
      commentStart = { line, col };
      i++;
      col++;
    } else if (char === "'" || char === '"') {
      inString = char;
      stringStart = { line, col };
      escape = false;
      currentStatement += char;
    } else if (char === '(') {
      parenStack.push({ line, col });
      currentStatement += char;
    } else if (char === ')') {
      if (parenStack.length === 0) {
        reportError(`Unexpected closing parenthesis ')'`, line, col);
      }
      parenStack.pop();
      currentStatement += char;
    } else if (char === '[') {
      bracketStack.push({ line, col });
      currentStatement += char;
    } else if (char === ']') {
      if (bracketStack.length === 0) {
        reportError(`Unexpected closing bracket ']'`, line, col);
      }
      bracketStack.pop();
      currentStatement += char;
    } else if (char === '{') {
      if (parenStack.length > 0) {
        const top = parenStack[parenStack.length - 1];
        reportError(`Unclosed parenthesis '(' before '{'`, top.line, top.col);
      }
      if (bracketStack.length > 0) {
        const top = bracketStack[bracketStack.length - 1];
        reportError(`Unclosed bracket '[' before '{'`, top.line, top.col);
      }

      const rawSelector = currentStatement.trim();
      validateSelector(rawSelector, statementStartLine, statementStartCol);

      braceStack.push({ line, col });
      currentStatement = '';
      statementStartLine = line;
      statementStartCol = col + 1;
    } else if (char === '}') {
      if (braceStack.length === 0) {
        reportError(`Unexpected closing brace '}'`, line, col);
      }
      if (parenStack.length > 0) {
        const top = parenStack[parenStack.length - 1];
        reportError(`Unclosed parenthesis '(' before '}'`, top.line, top.col);
      }
      if (bracketStack.length > 0) {
        const top = bracketStack[bracketStack.length - 1];
        reportError(`Unclosed bracket '[' before '}'`, top.line, top.col);
      }

      if (currentStatement.trim().length > 0) {
        processStatement(currentStatement);
      }

      braceStack.pop();
      currentStatement = '';
      statementStartLine = line;
      statementStartCol = col + 1;
    } else if (char === ';') {
      if (currentStatement.trim().length > 0) {
        if (braceStack.length > 0) {
          processStatement(currentStatement);
        }
      }
      currentStatement = '';
      statementStartLine = line;
      statementStartCol = col + 1;
    } else {
      if (currentStatement === '') {
        statementStartLine = line;
        statementStartCol = col;
      }
      currentStatement += char;
    }
  }

  if (char === '\n') {
    line++;
    col = 1;
  } else {
    col++;
  }
}

// EOF validation checks
if (inComment) {
  reportError(`Unclosed comment starting`, commentStart.line, commentStart.col);
}
if (inString) {
  reportError(`Unclosed string literal starting`, stringStart.line, stringStart.col);
}
if (braceStack.length > 0) {
  const top = braceStack[braceStack.length - 1];
  reportError(`Unclosed brace '{' starting`, top.line, top.col);
}
if (parenStack.length > 0) {
  const top = parenStack[parenStack.length - 1];
  reportError(`Unclosed parenthesis '(' starting`, top.line, top.col);
}
if (bracketStack.length > 0) {
  const top = bracketStack[bracketStack.length - 1];
  reportError(`Unclosed bracket '[' starting`, top.line, top.col);
}

function validateSelector(selectorStr, errLine, errCol) {
  if (!selectorStr) {
    reportError(`Malformed selector: empty selector before '{'`, errLine, errCol);
  }
  if (selectorStr.startsWith('@')) {
    return;
  }

  let sanitized = selectorStr;
  while (/\([^()]+\)/.test(sanitized)) {
    sanitized = sanitized.replace(/\([^()]+\)/g, '()');
  }
  while (/\[[^[\]]+\]/.test(sanitized)) {
    sanitized = sanitized.replace(/\[[^[\]]+\]/g, '[]');
  }

  const parts = sanitized.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed === '') {
      reportError(`Malformed selector: invalid comma placement in '${selectorStr}'`, errLine, errCol);
    }
    if (/^\#\s*$/.test(trimmed) || /^\.\s*$/.test(trimmed) || /^::\s*$/.test(trimmed)) {
      reportError(`Malformed selector '${selectorStr}'`, errLine, errCol);
    }
    if (/[>+~]\s*$/.test(trimmed)) {
      reportError(`Malformed selector: trailing combinator in '${selectorStr}'`, errLine, errCol);
    }
  }
}

function processStatement(stmt) {
  const trimmed = stmt.trim();
  if (trimmed.startsWith('@')) return;

  const colonIdx = trimmed.indexOf(':');
  if (colonIdx > 0) {
    const prop = trimmed.slice(0, colonIdx).trim();
    const val = trimmed.slice(colonIdx + 1).trim();

    if (/^-{0,2}[a-zA-Z_][a-zA-Z0-9_-]*$/.test(prop)) {
      totalDeclarations++;
      if (/\!\s*important/i.test(val)) {
        importantCount++;
      }
    }
  }
}

if (totalDeclarations > 0) {
  const ratio = (importantCount / totalDeclarations) * 100;
  const ratioStr = ratio % 1 === 0 ? ratio.toFixed(0) : ratio.toFixed(1);
  if (ratio > 40) {
    console.log(`::warning file=${filePath}:: High !important ratio: ${ratioStr}% of CSS declarations use !important`);
  }
}

console.log(`✓ CSS validation passed for ${filePath} (${totalDeclarations} declarations, ${importantCount} !important)`);
process.exit(0);
