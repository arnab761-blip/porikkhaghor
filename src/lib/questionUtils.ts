/**
 * Robust utility to resolve the 0-based correct answer index for any question.
 * Handles:
 * - 0-based numbers (0, 1, 2, 3)
 * - 1-based numbers (1, 2, 3, 4)
 * - String numbers ("0", "1", "2", "3", "4", "১", "২", "৩", "৪")
 * - Option letters/labels (A/B/C/D, a/b/c/d, ক/খ/গ/ঘ, (ক)/(খ)/(গ)/(ঘ), Option 1, Ans: C, etc.)
 * - Direct or partial option text matches
 * - Embedded option prefixes in option text
 * - Fallback to explicit or contextual mentions in the question explanation
 */

export function getCorrectAnswerIndex(q: {
  correctAnswer?: any;
  options?: string[];
  explanation?: string;
  text?: string;
}): number {
  if (!q || !Array.isArray(q.options) || q.options.length === 0) {
    return 0;
  }
  const opts = q.options;
  const numOptions = opts.length;
  const rawAns = q.correctAnswer;

  // 1. Direct valid 0-based or 1-based integer
  if (typeof rawAns === 'number' && Number.isInteger(rawAns)) {
    // Standard 0-based index: 0 <= rawAns < numOptions
    if (rawAns >= 0 && rawAns < numOptions) {
      return rawAns;
    }
    // 1-based index (e.g., 1..numOptions, such as 4 for 4 options)
    if (rawAns >= 1 && rawAns <= numOptions) {
      return rawAns - 1;
    }
  }

  // Helper to normalize text (strip LaTeX symbols, punctuation, spaces, option labels)
  const normalize = (txt: string) => txt
    .replace(/^(?:\([কখগঘঙচabcdABCD1-6]\)|[কখগঘঙচabcdABCD1-6]\))\s*/, '')
    .replace(/[\$\s\\\{\}\(\)\[\]\_\^\,\.\:\-\=\+]/g, '')
    .toLowerCase();

  // 2. If rawAns is string or can be converted to string
  if (rawAns !== undefined && rawAns !== null && String(rawAns).trim() !== '') {
    const rawStr = String(rawAns).trim();

    // 2a. Direct exact match with options text
    const directIdx = opts.findIndex(opt => opt.trim().toLowerCase() === rawStr.toLowerCase());
    if (directIdx !== -1) return directIdx;

    // 2b. Clean string (strip prefixes like Option, Ans, brackets, spaces, colons)
    const clean = rawStr
      .replace(/^(option|opt|অপশন|answer|ans|উত্তর|সঠিক উত্তর|সঠিক অপশন|সঠিক)\s*[\:\-\.]?\s*/i, '')
      .replace(/^[\(\[\{]/, '')
      .replace(/[\)\]\}\.\:\#\s]/g, '')
      .trim()
      .toLowerCase();

    // Standard Bangladeshi / English MCQ option mapping:
    // Option 1 (index 0)
    if (clean === '1' || clean === '১' || clean === 'a' || clean === 'এ' || clean === 'ক' || clean === 'i' || clean === 'first' || clean === 'এক' || clean === 'প্রথম') return 0;
    // Option 2 (index 1)
    if (clean === '2' || clean === '২' || clean === 'b' || clean === 'বি' || clean === 'খ' || clean === 'ii' || clean === 'second' || clean === 'দুই' || clean === 'দ্বিতীয়') return 1;
    // Option 3 (index 2)
    if (clean === '3' || clean === '৩' || clean === 'c' || clean === 'সি' || clean === 'গ' || clean === 'iii' || clean === 'third' || clean === 'তিন' || clean === 'তৃতীয়') return 2;
    // Option 4 (index 3)
    if (clean === '4' || clean === '৪' || clean === 'd' || clean === 'ডি' || clean === 'ঘ' || clean === 'iv' || clean === 'fourth' || clean === 'চার' || clean === 'চতুর্থ') return 3;
    // Option 5 (index 4)
    if (clean === '5' || clean === '৫' || clean === 'e' || clean === 'ই' || clean === 'ঙ' || clean === 'v' || clean === 'fifth' || clean === 'পাঁচ' || clean === 'পঞ্চম') return 4;
    // Option 6 (index 5)
    if (clean === '6' || clean === '৬' || clean === 'f' || clean === 'এফ' || clean === 'চ' || clean === 'vi' || clean === 'sixth' || clean === 'ছয়' || clean === 'ষষ্ঠ') return 5;

    // Bengali & English numbers fallback
    const bnToEnMap: Record<string, string> = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6' };
    const converted = clean.replace(/[০১২৩৪৫৬]/g, d => bnToEnMap[d] || d);
    const parsed = parseInt(converted, 10);
    if (!isNaN(parsed)) {
      if (parsed === 0) return 0;
      if (parsed >= 1 && parsed <= numOptions) return parsed - 1;
      if (parsed >= 0 && parsed < numOptions) return parsed;
    }

    // 2c. Check if clean matches an option text without symbols
    const cleanNorm = normalize(rawStr);
    if (cleanNorm) {
      const matchIdx = opts.findIndex(opt => {
        const optNorm = normalize(opt);
        return optNorm === cleanNorm || (optNorm.length > 2 && optNorm.includes(cleanNorm)) || (cleanNorm.length > 2 && cleanNorm.includes(optNorm));
      });
      if (matchIdx !== -1) return matchIdx;
    }
  }

  // 3. Check if options start with (ক), (খ), (গ), (ঘ) and rawAns is or contains corresponding letter
  if (rawAns !== undefined && rawAns !== null) {
    const rawLower = String(rawAns).toLowerCase().trim();
    const letters = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
    const engLetters = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (let i = 0; i < opts.length; i++) {
      const optClean = opts[i].trim().toLowerCase();
      if (optClean.startsWith(`(${letters[i]})`) || optClean.startsWith(`${letters[i]})`) || optClean.startsWith(`(${engLetters[i]})`) || optClean.startsWith(`${engLetters[i]})`)) {
        if (rawLower.includes(letters[i]) || rawLower.includes(engLetters[i])) {
          return i;
        }
      }
    }
  }

  // 4. Fallback to explanation if rawAns was undefined/null/unresolvable
  if (q.explanation && typeof q.explanation === 'string' && q.explanation.trim()) {
    const exp = q.explanation;
    // Look for explicit pattern: সঠিক উত্তর: (গ) or উত্তর: খ or Ans: C
    const ansMatch = exp.match(/(?:সঠিক\s*উত্তর|উত্তর|Ans|Answer)\s*[\:\-\.]?\s*[\(\[\{]?\s*([কখগঘঙচabcdABCD1234১-৪])/i);
    if (ansMatch) {
      const char = ansMatch[1].toLowerCase();
      if (char === 'ক' || char === 'a' || char === '1' || char === '১') return 0;
      if (char === 'খ' || char === 'b' || char === '2' || char === '২') return 1;
      if (char === 'গ' || char === 'c' || char === '3' || char === '৩') return 2;
      if (char === 'ঘ' || char === 'd' || char === '4' || char === '৪') return 3;
      if (char === 'ঙ' || char === 'e') return 4;
      if (char === 'চ' || char === 'f') return 5;
    }

    // Try matching option texts or parts in explanation
    const expNorm = normalize(exp);
    let bestOptIdx = -1;
    let maxScore = 0;

    opts.forEach((opt, idx) => {
      const optNorm = normalize(opt);
      if (optNorm.length > 2 && expNorm.includes(optNorm)) {
        if (optNorm.length > maxScore) {
          maxScore = optNorm.length;
          bestOptIdx = idx;
        }
      } else {
        // Multi-part match: split by comma / semicolon / "এবং"
        const parts = opt
          .replace(/^(?:\([কখগঘঙচabcdABCD1-6]\)|[কখগঘঙচabcdABCD1-6]\))\s*/, '')
          .split(/[\,\;\–\—\+]|এবং|\band\b/)
          .map(p => normalize(p))
          .filter(p => p.length >= 3);
        
        if (parts.length > 0) {
          const matchedCount = parts.filter(p => expNorm.includes(p)).length;
          if (matchedCount === parts.length) {
            const score = parts.reduce((acc, p) => acc + p.length, 0);
            if (score > maxScore) {
              maxScore = score;
              bestOptIdx = idx;
            }
          }
        }
      }
    });

    if (bestOptIdx !== -1) {
      return bestOptIdx;
    }
  }

  // Default fallback
  return 0;
}
