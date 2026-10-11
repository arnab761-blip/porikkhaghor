export interface AdmissionPreset {
  id: string;
  name: string;
  group: 'science' | 'engineering' | 'medical' | 'general';
  description: string;
  compulsorySubjects: string[];
  compulsoryDisplay: string[];
  optionalSubjects?: string[];
  optionalDisplay?: string[];
  sustWarning?: boolean;
}

export const ADMISSION_PRESETS: AdmissionPreset[] = [
  {
    id: 'custom',
    name: 'কাস্টম নিয়ম (Custom Rules - যেকোনো বিভাগ বা সাধারণ পরীক্ষা)',
    group: 'general',
    description: 'শিক্ষক নিজের ইচ্ছামতো বাধ্যতামূলক এবং ঐচ্ছিক বিষয় নিজে সিলেক্ট ও কনফিগার করতে পারবেন। মানবিক বা ব্যবসায় শিক্ষার পরীক্ষার জন্যও এটি প্রযোজ্য।',
    compulsorySubjects: [],
    compulsoryDisplay: ['শিক্ষক নির্ধারিত বিষয়সমূহ']
  },
  {
    id: 'du_a',
    name: '১. ঢাকা বিশ্ববিদ্যালয় (ক ইউনিট) ও ৭ কলেজ (বিজ্ঞান)',
    group: 'science',
    description: 'মোট ৪টি বিষয়ের উত্তর করতে হবে। পদার্থ ও রসায়ন বাধ্যতামূলক। গণিত ও জীববিজ্ঞানের মধ্যে ৪র্থ বিষয়ের পরিবর্তে বাংলা অথবা ইংরেজি যেকোনো একটি নির্বাচন করা যাবে।',
    compulsorySubjects: ['physics', 'chemistry'],
    compulsoryDisplay: ['পদার্থবিজ্ঞান (Physics)', 'রসায়ন (Chemistry)'],
    optionalSubjects: ['math', 'biology', 'bangla', 'english'],
    optionalDisplay: ['উচ্চতর গণিত', 'জীববিজ্ঞান', 'বাংলা (বিকল্প)', 'ইংরেজি (বিকল্প)']
  },
  {
    id: 'gst_a',
    name: '২. গুচ্ছ বিজ্ঞান (GST - এ ইউনিট)',
    group: 'science',
    description: 'পদার্থ ও রসায়ন বাধ্যতামূলক। ৪র্থ বিষয়ের পরিবর্তে বাংলা বা ইংরেজি নির্বাচন করা যাবে। সাথে সাস্টের বিশেষ সতর্কবার্তা প্রদর্শিত হবে।',
    compulsorySubjects: ['physics', 'chemistry'],
    compulsoryDisplay: ['পদার্থবিজ্ঞান (Physics)', 'রসায়ন (Chemistry)'],
    optionalSubjects: ['math', 'biology', 'bangla', 'english'],
    optionalDisplay: ['উচ্চতর গণিত', 'জীববিজ্ঞান', 'বাংলা (বিকল্প)', 'ইংরেজি (বিকল্প)'],
    sustWarning: true
  },
  {
    id: 'ru_c',
    name: '৩. রাজশাহী বিশ্ববিদ্যালয় (সি ইউনিট - বিজ্ঞান)',
    group: 'science',
    description: 'পদার্থবিজ্ঞান, রসায়ন এবং আইসিটি বাধ্যতামূলক। ঐচ্ছিক ৩টি ব্লকের যেকোনো ১টি রেডিও বাটন সিলেক্ট করতে হবে (১. শুধুমাত্র গণিত, ২. শুধুমাত্র জীববিজ্ঞান, ৩. গণিত + জীববিজ্ঞান)। কোনো ভাষা বিকল্প থাকবে না।',
    compulsorySubjects: ['physics', 'chemistry', 'ict'],
    compulsoryDisplay: ['পদার্থবিজ্ঞান', 'রসায়ন', 'আইসিটি (ICT)'],
    optionalSubjects: ['math', 'biology'],
    optionalDisplay: ['শুধুমাত্র গণিত', 'শুধুমাত্র জীববিজ্ঞান', 'গণিত + জীববিজ্ঞান']
  },
  {
    id: 'cu_a',
    name: '৪. চট্টগ্রাম বিশ্ববিদ্যালয় (এ ইউনিট)',
    group: 'science',
    description: 'ইংরেজি বাধ্যতামূলক। বাকি ৪টি ঐচ্ছিক বিষয় (পদার্থবিজ্ঞান, রসায়ন, গণিত, জীববিজ্ঞান) থেকে চেকবক্সের মাধ্যমে যেকোনো ৩টি বিষয় নির্বাচন করতে হবে।',
    compulsorySubjects: ['english'],
    compulsoryDisplay: ['ইংরেজি (English)'],
    optionalSubjects: ['physics', 'chemistry', 'math', 'biology'],
    optionalDisplay: ['পদার্থবিজ্ঞান', 'রসায়ন', 'গণিত', 'জীববিজ্ঞান']
  },
  {
    id: 'ju_a',
    name: '৫. জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (এ ইউনিট - গাণিতিক ও পদার্থবিষয়ক)',
    group: 'science',
    description: 'গণিত, পদার্থবিজ্ঞান, রসায়ন, আইসিটি, বাংলা এবং ইংরেজি—সবগুলো বিষয়ই বাধ্যতামূলক। কোনো ঐচ্ছিক বিষয় থাকবে না।',
    compulsorySubjects: ['math', 'physics', 'chemistry', 'ict', 'bangla', 'english'],
    compulsoryDisplay: ['গণিত', 'পদার্থবিজ্ঞান', 'রসায়ন', 'আইসিটি', 'বাংলা', 'ইংরেজি']
  },
  {
    id: 'ju_d',
    name: '৫. জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (ডি ইউনিট - জীববিজ্ঞান অনুষদ)',
    group: 'science',
    description: 'জীববিজ্ঞান, রসায়ন, বাংলা, ইংরেজি এবং বুদ্ধিমত্তা (IQ)—সবগুলো বিষয় বাধ্যতামূলক। কোনো ঐচ্ছিক বিষয় থাকবে না।',
    compulsorySubjects: ['biology', 'chemistry', 'bangla', 'english', 'iq'],
    compulsoryDisplay: ['জীববিজ্ঞান', 'রসায়ন', 'বাংলা', 'ইংরেজি', 'বুদ্ধিমত্তা (IQ)']
  },
  {
    id: 'buet',
    name: '৬. বুয়েট (BUET)',
    group: 'engineering',
    description: 'গণিত, পদার্থবিজ্ঞান এবং রসায়ন—৩টি বিষয়ই বাধ্যতামূলক। কোনো ঐচ্ছিক বা বিকল্প বিষয় নেই।',
    compulsorySubjects: ['math', 'physics', 'chemistry'],
    compulsoryDisplay: ['গণিত', 'পদার্থবিজ্ঞান', 'রসায়ন']
  },
  {
    id: 'ckruet',
    name: '৬. প্রকৌশল গুচ্ছ (CKRUET - চুয়েট, কুয়েট, রুয়েট)',
    group: 'engineering',
    description: 'গণিত, পদার্থবিজ্ঞান, রসায়ন এবং ইংরেজি—৪টি বিষয়ই বাধ্যতামূলক। কোনো বিকল্প বিষয় থাকবে না।',
    compulsorySubjects: ['math', 'physics', 'chemistry', 'english'],
    compulsoryDisplay: ['গণিত', 'পদার্থবিজ্ঞান', 'রসায়ন', 'ইংরেজি']
  },
  {
    id: 'butex',
    name: '৭. বাংলাদেশ টেক্সটাইল বিশ্ববিদ্যালয় (BUTEX)',
    group: 'engineering',
    description: 'গণিত, পদার্থবিজ্ঞান, রসায়ন এবং ইংরেজি—সবগুলো বিষয় বাধ্যতামূলক। কোনো ঐচ্ছিক বিষয় নেই।',
    compulsorySubjects: ['math', 'physics', 'chemistry', 'english'],
    compulsoryDisplay: ['গণিত', 'পদার্থবিজ্ঞান', 'রসায়ন', 'ইংরেজি']
  },
  {
    id: 'medical',
    name: '৮. মেডিকেল ও ডেন্টাল ভর্তি পরীক্ষা (MBBS / BDS)',
    group: 'medical',
    description: 'জীববিজ্ঞান, রসায়ন, পদার্থবিজ্ঞান, ইংরেজি এবং সাধারণ জ্ঞান—সবগুলো বিষয় বাধ্যতামূলক। কোনো ঐচ্ছিক বিষয় নেই।',
    compulsorySubjects: ['biology', 'chemistry', 'physics', 'english', 'gk'],
    compulsoryDisplay: ['জীববিজ্ঞান', 'রসায়ন', 'পদার্থবিজ্ঞান', 'ইংরেজি', 'সাধারণ জ্ঞান']
  },
  {
    id: 'agri_gst',
    name: '৯. কৃষি গুচ্ছ (Agri GST)',
    group: 'science',
    description: 'জীববিজ্ঞান, রসায়ন, পদার্থবিজ্ঞান, গণিত এবং ইংরেজি—৫টি বিষয়ই বাধ্যতামূলক। ৪র্থ বিষয়ের পরিবর্তে বাংলা বা ইংরেজি নির্বাচনের সুযোগ নেই।',
    compulsorySubjects: ['biology', 'chemistry', 'physics', 'math', 'english'],
    compulsoryDisplay: ['জীববিজ্ঞান', 'রসায়ন', 'পদার্থবিজ্ঞান', 'গণিত', 'ইংরেজি']
  }
];

// Helper to normalize any subject string in Bengali or English to canonical key
export const normalizeSubject = (s?: string): string => {
  if (!s) return '';
  const text = s.toLowerCase().trim();
  if (text.includes('physic') || text.includes('পদার্থ')) return 'physics';
  if (text.includes('chem') || text.includes('রসায়ন') || text.includes('রসায়ন')) return 'chemistry';
  if (text.includes('math') || text.includes('গণিত')) return 'math';
  if (text.includes('bio') || text.includes('জীব')) return 'biology';
  if (text.includes('bangla') || text.includes('বাংলা')) return 'bangla';
  if (text.includes('eng') || text.includes('ইংরেজি') || text.includes('ইংরেজী')) return 'english';
  if (text.includes('ict') || text.includes('আইসিটি') || text.includes('তথ্য')) return 'ict';
  if (text.includes('gk') || text.includes('জ্ঞান') || text.includes('সাধারণ')) return 'gk';
  if (text.includes('iq') || text.includes('বুদ্ধি')) return 'iq';
  return text;
};

// Check if a question's subject matches any allowed normalized subject keys
export const isSubjectAllowed = (questionSubject: string | undefined, allowedKeys: string[]): boolean => {
  if (!questionSubject || !questionSubject.trim()) return true;
  const normalized = normalizeSubject(questionSubject);
  return allowedKeys.includes(normalized) || allowedKeys.includes(questionSubject.toLowerCase().trim());
};
