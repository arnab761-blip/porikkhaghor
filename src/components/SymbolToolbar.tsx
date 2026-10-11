import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Check, Sparkles, X } from 'lucide-react';

interface SymbolToolbarProps {
  onInsert: (symbol: string) => void;
  targetName?: string;
}

interface SymbolCategory {
  id: string;
  name: string;
  symbols: { char: string; name: string; tag?: string }[];
}

const FREQUENT_SYMBOLS = [
  'α', 'β', 'γ', 'θ', 'λ', 'π', 'ω', 'Δ', '°', '℃', 
  '²', '³', '⁻¹', '⁻²', '√', '±', '×', '÷', 'Ω', 'μ', 
  '→', '⇌', '½', '≠', '≤', '≥', '∞', '∑', '∫'
];

const CATEGORIES: SymbolCategory[] = [
  {
    id: 'math',
    name: 'গণিত ও অপারেটর',
    symbols: [
      { char: '+', name: 'Plus' },
      { char: '−', name: 'Minus' },
      { char: '×', name: 'Multiplication / গুণ' },
      { char: '÷', name: 'Division / ভাগ' },
      { char: '±', name: 'Plus-Minus' },
      { char: '∓', name: 'Minus-Plus' },
      { char: '=', name: 'Equals / সমান' },
      { char: '≠', name: 'Not Equal / অসমান' },
      { char: '≈', name: 'Approximately / প্রায়' },
      { char: '≡', name: 'Equivalent' },
      { char: '∝', name: 'Proportional / সমানুপাতিক' },
      { char: '<', name: 'Less than' },
      { char: '>', name: 'Greater than' },
      { char: '≤', name: 'Less than or equal' },
      { char: '≥', name: 'Greater than or equal' },
      { char: '√', name: 'Square Root / বর্গমূল' },
      { char: '∛', name: 'Cube Root / ঘনমূল' },
      { char: '∜', name: 'Fourth Root' },
      { char: '½', name: 'Half / অর্ধেক' },
      { char: '⅓', name: 'One Third' },
      { char: '⅔', name: 'Two Thirds' },
      { char: '¼', name: 'One Fourth' },
      { char: '¾', name: 'Three Fourths' },
      { char: '∞', name: 'Infinity / অসীম' },
      { char: '%', name: 'Percent / শতকরা' },
      { char: '‰', name: 'Per Mille' },
    ]
  },
  {
    id: 'powers',
    name: 'পাওয়ার ও সাবস্ক্রিপ্ট',
    symbols: [
      { char: '⁰', name: 'Power 0' },
      { char: '¹', name: 'Power 1' },
      { char: '²', name: 'Power 2 / স্কয়ার' },
      { char: '³', name: 'Power 3 / কিউব' },
      { char: '⁴', name: 'Power 4' },
      { char: '⁵', name: 'Power 5' },
      { char: '⁶', name: 'Power 6' },
      { char: '⁷', name: 'Power 7' },
      { char: '⁸', name: 'Power 8' },
      { char: '⁹', name: 'Power 9' },
      { char: '⁺', name: 'Superscript Plus' },
      { char: '⁻', name: 'Superscript Minus' },
      { char: '⁻¹', name: 'Power -1 (ms⁻¹)' },
      { char: '⁻²', name: 'Power -2 (ms⁻², Nm⁻²)' },
      { char: '⁻³', name: 'Power -3' },
      { char: 'ⁿ', name: 'Power n' },
      { char: 'ˣ', name: 'Power x' },
      { char: 'ʸ', name: 'Power y' },
      { char: '₀', name: 'Subscript 0' },
      { char: '₁', name: 'Subscript 1' },
      { char: '₂', name: 'Subscript 2' },
      { char: '₃', name: 'Subscript 3' },
      { char: '₄', name: 'Subscript 4' },
      { char: '₅', name: 'Subscript 5' },
      { char: '₆', name: 'Subscript 6' },
      { char: '₇', name: 'Subscript 7' },
      { char: '₈', name: 'Subscript 8' },
      { char: '₉', name: 'Subscript 9' },
      { char: '₊', name: 'Subscript Plus' },
      { char: '₋', name: 'Subscript Minus' },
      { char: 'ₐ', name: 'Subscript a' },
      { char: 'ₑ', name: 'Subscript e' },
      { char: 'ₒ', name: 'Subscript o' },
      { char: 'ₓ', name: 'Subscript x' },
    ]
  },
  {
    id: 'greek_small',
    name: 'গ্রিক বর্ণমালা (ছোট)',
    symbols: [
      { char: 'α', name: 'Alpha (আলফা)' },
      { char: 'β', name: 'Beta (বিটা)' },
      { char: 'γ', name: 'Gamma (গামা)' },
      { char: 'δ', name: 'Delta (ডেল্টা)' },
      { char: 'ε', name: 'Epsilon (এপসিলন)' },
      { char: 'ζ', name: 'Zeta (জেটা)' },
      { char: 'η', name: 'Eta (ইটা)' },
      { char: 'θ', name: 'Theta (থিটা)' },
      { char: 'ι', name: 'Iota' },
      { char: 'κ', name: 'Kappa' },
      { char: 'λ', name: 'Lambda (ল্যামডা)' },
      { char: 'μ', name: 'Mu / Micro (মিউ)' },
      { char: 'ν', name: 'Nu (নিউ / কম্পাঙ্ক)' },
      { char: 'ξ', name: 'Xi' },
      { char: 'π', name: 'Pi (পাই)' },
      { char: 'ρ', name: 'Rho (রো / ঘনত্ব)' },
      { char: 'σ', name: 'Sigma (সিগমা)' },
      { char: 'τ', name: 'Tau (টাও / টর্ক)' },
      { char: 'υ', name: 'Upsilon' },
      { char: 'φ', name: 'Phi (ফাই)' },
      { char: 'χ', name: 'Chi' },
      { char: 'ψ', name: 'Psi (সাই)' },
      { char: 'ω', name: 'Omega (ওমেগা / কৌণিক বেগ)' },
    ]
  },
  {
    id: 'greek_caps',
    name: 'গ্রিক বর্ণমালা (বড়)',
    symbols: [
      { char: 'Δ', name: 'Delta (ক্যাপিটাল ডেল্টা / পরিবর্তন)' },
      { char: 'Ω', name: 'Omega / Ohm (ওহম রোধ)' },
      { char: 'Γ', name: 'Gamma' },
      { char: 'Θ', name: 'Theta' },
      { char: 'Λ', name: 'Lambda' },
      { char: 'Ξ', name: 'Xi' },
      { char: 'Π', name: 'Pi / Product' },
      { char: 'Σ', name: 'Sigma / Summation' },
      { char: 'Φ', name: 'Phi / ফ্লাক্স' },
      { char: 'Ψ', name: 'Psi' },
      { char: 'Α', name: 'Alpha' },
      { char: 'Β', name: 'Beta' },
    ]
  },
  {
    id: 'physics_chemistry',
    name: 'পদার্থ ও রসায়ন',
    symbols: [
      { char: '°', name: 'Degree (ডিগ্রি)' },
      { char: '℃', name: 'Degree Celsius (ডিগ্রি সেলসিয়াস)' },
      { char: '℉', name: 'Degree Fahrenheit (ডিগ্রি ফারেনহাইট)' },
      { char: 'K', name: 'Kelvin (কেলভিন)' },
      { char: 'Å', name: 'Angstrom (অ্যাংস্ট্রম)' },
      { char: 'Ω', name: 'Ohm (ওহম)' },
      { char: 'µ', name: 'Micro (মাইক্রো)' },
      { char: 'ℏ', name: 'Reduced Planck Constant (hbar)' },
      { char: '→', name: 'Right Arrow / বিক্রিয়া তীর' },
      { char: '←', name: 'Left Arrow' },
      { char: '⇌', name: 'Equilibrium / উভমুখী বিক্রিয়া' },
      { char: '⇄', name: 'Reversible Arrow' },
      { char: '↑', name: 'Gas Evolution / গ্যাস নিঃসরণ' },
      { char: '↓', name: 'Precipitate / অধঃক্ষেপ' },
      { char: '⇒', name: 'Implies' },
      { char: '⇔', name: 'If and only if' },
      { char: 'e⁻', name: 'Electron (ইলেকট্রন)' },
      { char: 'p⁺', name: 'Proton (প্রোটন)' },
      { char: 'n⁰', name: 'Neutron (নিউট্রন)' },
      { char: 'H⁺', name: 'Hydrogen Ion' },
      { char: 'OH⁻', name: 'Hydroxide Ion' },
    ]
  },
  {
    id: 'calculus_vector',
    name: 'ক্যালকুলাস ও ভেক্টর',
    symbols: [
      { char: '∫', name: 'Integral (যোজিত ফল)' },
      { char: '∬', name: 'Double Integral' },
      { char: '∭', name: 'Triple Integral' },
      { char: '∮', name: 'Contour Integral' },
      { char: '∂', name: 'Partial Derivative (আংশিক অন্তরক)' },
      { char: '∇', name: 'Nabla / Del (ডেল ভেক্টর)' },
      { char: '∑', name: 'Summation (সমষ্টি)' },
      { char: '∏', name: 'Product' },
      { char: 'lim', name: 'Limit' },
      { char: 'dx', name: 'dx' },
      { char: 'dt', name: 'dt' },
      { char: 'î', name: 'i-hat (একক ভেক্টর)' },
      { char: 'ĵ', name: 'j-hat' },
      { char: 'k̂', name: 'k-hat' },
      { char: 'r⃗', name: 'Position Vector' },
      { char: 'v⃗', name: 'Velocity Vector' },
      { char: 'a⃗', name: 'Acceleration Vector' },
      { char: 'F⃗', name: 'Force Vector' },
    ]
  },
  {
    id: 'geometry_sets',
    name: 'জ্যামিতি, সেট ও লজিক',
    symbols: [
      { char: '∠', name: 'Angle / কোণ' },
      { char: '⊥', name: 'Perpendicular / লম্ব' },
      { char: '∥', name: 'Parallel / সমান্তরাল' },
      { char: '△', name: 'Triangle / ত্রিভুজ' },
      { char: '○', name: 'Circle / বৃত্ত' },
      { char: '∈', name: 'Element of / অন্তর্ভুক্ত' },
      { char: '∉', name: 'Not element of' },
      { char: '⊂', name: 'Subset / উপসেট' },
      { char: '⊃', name: 'Superset' },
      { char: '∪', name: 'Union / সংযোগ সেট' },
      { char: '∩', name: 'Intersection / ছেদ সেট' },
      { char: '∅', name: 'Null set / ফাঁকা সেট' },
      { char: '∀', name: 'For all' },
      { char: '∃', name: 'There exists' },
      { char: '∴', name: 'Therefore / অতএব' },
      { char: '∵', name: 'Because / কারণ' },
    ]
  },
  {
    id: 'templates',
    name: 'ল্যাটেক্স ফর্মুলা টেমপ্লেট',
    symbols: [
      { char: '$\\frac{a}{b}$', name: 'ভগ্নাংশ (Fraction)' },
      { char: '$\\sqrt{x}$', name: 'বর্গমূল (Square Root)' },
      { char: '$\\sqrt[n]{x}$', name: 'n-তম মূল' },
      { char: '$x^2$', name: 'পাওয়ার / স্কয়ার' },
      { char: '$x_0$', name: 'সাবস্ক্রিপ্ট' },
      { char: '$10^{-3}$', name: '১০ এর সূচক' },
      { char: '$\\times 10^8\\text{ ms}^{-1}$', name: 'আলোর বেগ একক' },
      { char: '$\\text{Nm}^{-2}$', name: 'চাপ বা পীড়ন একক' },
      { char: '$\\text{kg m s}^{-1}$', name: 'ভরবেগ একক' },
      { char: '$\\Delta T$', name: 'তাপমাত্রার পরিবর্তন' },
      { char: '$\\int_a^b f(x)dx$', name: 'নির্দিষ্ট ইন্টিগ্রাল' },
      { char: '$\\lim_{x \\to 0}$', name: 'লিমিট টেমপ্লেট' },
      { char: '$\\theta = 30^\\circ$', name: 'কোণের মান' },
    ]
  }
];

export const SymbolToolbar: React.FC<SymbolToolbarProps> = ({ onInsert, targetName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('math');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastInserted, setLastInserted] = useState<string | null>(null);

  const handleSymbolClick = (char: string) => {
    onInsert(char);
    setLastInserted(char);
    setTimeout(() => {
      setLastInserted(null);
    }, 1200);
  };

  // Filtered symbols based on search
  const filteredSymbols = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const results: { char: string; name: string }[] = [];
    CATEGORIES.forEach(cat => {
      cat.symbols.forEach(sym => {
        if (
          sym.char.toLowerCase().includes(q) ||
          sym.name.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q)
        ) {
          results.push(sym);
        }
      });
    });
    return results;
  }, [searchQuery]);

  return (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-800/80 dark:to-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 rounded-xl p-2.5 mb-3 shadow-sm transition-all">
      {/* Top Row: Quick Symbols + Expand Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1 shrink-0 bg-blue-100/70 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
            <Sparkles size={12} className="text-amber-500" />
            দ্রুত সিম্বল:
          </span>

          {FREQUENT_SYMBOLS.map((sym, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSymbolClick(sym)}
              title={`ইনসার্ট করুন: ${sym}`}
              className="min-w-[28px] h-7 px-1.5 flex items-center justify-center text-sm font-semibold bg-white dark:bg-gray-800 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {sym}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
            isOpen 
              ? 'bg-blue-600 text-white' 
              : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-gray-700'
          }`}
        >
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{isOpen ? 'বন্ধ করুন' : 'সব সিম্বল দেখুন'}</span>
        </button>
      </div>

      {/* Target notification if provided */}
      {targetName && (
        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-between">
          <span>ক্লিক করলে ইনসার্ট হবে: <strong className="text-blue-600 dark:text-blue-400">{targetName}</strong>-এ</span>
          {lastInserted && (
            <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1 animate-pulse">
              <Check size={12} /> '{lastInserted}' যোগ হয়েছে!
            </span>
          )}
        </div>
      )}

      {/* Expanded Comprehensive Drawer */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xs rounded-xl p-3 shadow-inner">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="সিম্বল খুঁজুন (যেমন: alpha, degree, ohm, root, power, ইত্যাদি)..."
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Results if any */}
          {filteredSymbols ? (
            <div>
              <div className="text-xs text-gray-500 mb-2 font-medium">
                ফলাফল ({filteredSymbols.length}টি পাওয়া গেছে):
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1">
                {filteredSymbols.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">কোনো সিম্বল পাওয়া যায়নি।</p>
                ) : (
                  filteredSymbols.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSymbolClick(item.char)}
                      title={item.name}
                      className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-blue-600 hover:text-white rounded-lg border border-gray-200 dark:border-gray-700 text-xs flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="font-bold text-sm">{item.char}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-white truncate max-w-[100px]">
                        {item.name}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Category Tabs */}
              <div className="flex gap-1 overflow-x-auto pb-2 border-b border-gray-100 dark:border-gray-800 mb-3 custom-scrollbar">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveTab(cat.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === cat.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Symbol Grid for Active Category */}
              <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                {CATEGORIES.find(c => c.id === activeTab)?.symbols.map((item, i) => {
                  const isTemplate = activeTab === 'templates';
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSymbolClick(item.char)}
                      title={item.name}
                      className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-blue-600 hover:text-white text-gray-800 dark:text-gray-200 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 flex items-center ${
                        isTemplate 
                          ? 'px-3 py-1.5 text-xs gap-2 font-mono' 
                          : 'min-w-[34px] h-8 px-2 justify-center text-sm font-semibold'
                      }`}
                    >
                      <span>{item.char}</span>
                      {isTemplate && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">({item.name})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 flex justify-between items-center">
            <span>💡 যেকোনো চিহ্নে ক্লিক করলেই তা লেখার নির্দিষ্ট স্থানে সরাসরি যুক্ত হয়ে যাবে।</span>
            <span className="text-[10px] text-blue-500 font-medium">১০০% ইউনিকোড ও ল্যাটেক্স সাপোর্টেড</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymbolToolbar;
