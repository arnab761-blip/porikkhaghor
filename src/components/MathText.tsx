import React, { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  text?: string | number | null;
  className?: string;
  inline?: boolean;
}

// Regex matching math delimiters:
// 1. $$...$$ (display math)
// 2. \[...\] (display math)
// 3. $...$ (inline math)
// 4. \(...\) (inline math)
const DELIMITER_REGEX = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?:\\.|[^\$\\])+\$|\\\([\s\S]*?\\\))/g;

// Regex detecting standalone LaTeX command without delimiters
const LATEX_COMMAND_REGEX = /\\(?:frac|sqrt|alpha|beta|gamma|delta|theta|lambda|mu|pi|rho|sigma|tau|phi|omega|Delta|Omega|times|div|pm|ne|le|ge|leq|geq|neq|approx|infty|degree|text|mathbf|mathrm|mathit|vec|hat|bar|sum|int|lim|to|rightarrow|leftarrow|partial)\b/;

function renderKatex(math: string, displayMode: boolean): string {
  try {
    return katex.renderToString(math, {
      throwOnError: false,
      displayMode,
      trust: false,
      output: 'htmlAndMathml'
    });
  } catch (err) {
    console.warn('KaTeX render error:', err);
    return `<span class="katex-error">${escapeHtml(math)}</span>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '', inline = false }) => {
  const renderedContent = useMemo(() => {
    if (text === null || text === undefined) return null;
    const str = String(text);
    if (!str.trim()) return str;

    const hasDelimiters = str.includes('$') || str.includes('\\(') || str.includes('\\[');

    // Case 1: Text contains explicit math delimiters ($ or $$ or \( or \[)
    if (hasDelimiters) {
      const parts = str.split(DELIMITER_REGEX);
      
      return parts.map((part, index) => {
        if (!part) return null;

        // Check delimiter type
        if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
          const math = part.slice(2, -2).trim();
          const html = renderKatex(math, true);
          return (
            <span
              key={index}
              className="katex-block my-2 block overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        if (part.startsWith('\\[') && part.endsWith('\\]') && part.length >= 4) {
          const math = part.slice(2, -2).trim();
          const html = renderKatex(math, true);
          return (
            <span
              key={index}
              className="katex-block my-2 block overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        if (part.startsWith('\\(') && part.endsWith('\\)') && part.length >= 4) {
          const math = part.slice(2, -2).trim();
          const html = renderKatex(math, false);
          return (
            <span
              key={index}
              className="katex-inline inline-block align-middle px-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
          const math = part.slice(1, -1).trim();
          const html = renderKatex(math, false);
          return (
            <span
              key={index}
              className="katex-inline inline-block align-middle px-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        // Plain text segment: preserve newlines
        return renderPlainTextWithNewlines(part, index);
      });
    }

    // Case 2: Standalone LaTeX formula without delimiters (e.g. \frac{1}{2} or \alpha)
    if (str.includes('\\') && (LATEX_COMMAND_REGEX.test(str) || str.trim().startsWith('\\'))) {
      try {
        const html = katex.renderToString(str.trim(), {
          throwOnError: true,
          displayMode: false,
          output: 'htmlAndMathml'
        });
        return (
          <span
            className="katex-inline inline-block align-middle px-0.5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch {
        // Fall back to plain text if not valid standalone LaTeX
      }
    }

    // Case 3: Regular text (handles newlines)
    return renderPlainTextWithNewlines(str, 0);
  }, [text]);

  if (renderedContent === null) return null;

  const Wrapper = inline ? 'span' : 'span';

  return <Wrapper className={`math-content ${className}`}>{renderedContent}</Wrapper>;
};

function renderPlainTextWithNewlines(text: string, keyPrefix: number | string) {
  if (!text.includes('\n')) {
    return <React.Fragment key={keyPrefix}>{text}</React.Fragment>;
  }

  const lines = text.split('\n');
  return (
    <React.Fragment key={keyPrefix}>
      {lines.map((line, idx) => (
        <React.Fragment key={`${keyPrefix}-line-${idx}`}>
          {idx > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}

export default MathText;
