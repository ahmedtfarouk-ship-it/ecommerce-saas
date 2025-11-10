// lib/utils/addressAnalyzer.ts

// Import the type
type AddressAnalysis = {
  governorate: string;
  city: string;
  district: string;
  confidence: 'high' | 'medium' | 'low';
  needsReview: boolean;
};

// Egyptian governorates with common variations
const GOVERNORATES: Record<string, string[]> = {
  'القاهرة': ['القاهره', 'قاهرة', 'cairo', 'cai'],
  'الجيزة': ['الجيزه', 'جيزة', 'giza'],
  'الإسكندرية': ['الاسكندريه', 'اسكندرية', 'alexandria', 'alex'],
  'الشرقية': ['الشرقيه', 'شرقية', 'sharqia', 'sharkia'],
  'الدقهلية': ['الدقهليه', 'دقهلية', 'dakahlia', 'dakahleya'],
  'البحيرة': ['البحيره', 'بحيرة', 'beheira'],
  'المنوفية': ['المنوفيه', 'منوفية', 'monufia', 'menofia'],
  'القليوبية': ['القليوبيه', 'قليوبية', 'qalyubia', 'kalyoubia'],
  'الغربية': ['الغربيه', 'غربية', 'gharbia'],
  'كفر الشيخ': ['كفر', 'كفرالشيخ', 'kafr el sheikh'],
  'دمياط': ['دمياط', 'damietta'],
  'بورسعيد': ['بورسعيد', 'port said'],
  'الإسماعيلية': ['الاسماعيليه', 'اسماعيلية', 'ismailia'],
  'السويس': ['السويس', 'suez'],
  'الفيوم': ['الفيوم', 'fayoum', 'faiyum'],
  'بني سويف': ['بنى سويف', 'بني', 'beni suef'],
  'المنيا': ['المنيا', 'minia', 'minya'],
  'أسيوط': ['اسيوط', 'assiut', 'asyut'],
  'سوهاج': ['سوهاج', 'sohag'],
  'قنا': ['قنا', 'qena'],
  'الأقصر': ['الاقصر', 'اقصر', 'luxor'],
  'أسوان': ['اسوان', 'aswan'],
  'البحر الأحمر': ['البحر الاحمر', 'بحر احمر', 'red sea', 'hurghada', 'الغردقة'],
  'الوادي الجديد': ['الوادي الجديد', 'وادي جديد', 'new valley'],
  'مطروح': ['مطروح', 'matrouh'],
  'شمال سيناء': ['شمال سيناء', 'north sinai', 'العريش'],
  'جنوب سيناء': ['جنوب سيناء', 'south sinai', 'شرم الشيخ', 'دهب'],
};

// Common cities for each governorate
const CITIES: Record<string, string[]> = {
  'القاهرة': ['مدينة نصر', 'مصر الجديدة', 'المعادي', 'حلوان', 'المعصرة', 'عين شمس', 'شبرا', 'الزمالك', 'المهندسين', 'الدقي', 'المقطم', 'التجمع', 'الرحاب'],
  'الجيزة': ['المهندسين', 'الدقي', 'الهرم', 'فيصل', 'العمرانية', 'البراجيل', 'أكتوبر', '6 أكتوبر', 'الشيخ زايد', 'حدائق الاهرام', 'المنيب'],
  'الإسكندرية': ['المنتزه', 'العطارين', 'سموحة', 'سيدي جابر', 'محرم بك', 'كامب شيزار', 'ميامي', 'سان ستيفانو', 'جليم', 'المنشية', 'العصافرة'],
  'الشرقية': ['الزقازيق', 'العاشر من رمضان', 'بلبيس', 'فاقوس', 'ههيا', 'أبو حماد', 'ديرب نجم', 'منيا القمح'],
  'الدقهلية': ['المنصورة', 'طلخا', 'ميت غمر', 'دكرنس', 'أجا', 'السنبلاوين', 'منية النصر', 'بلقاس'],
};

// Districts/Areas patterns
const DISTRICT_KEYWORDS = [
  'شارع',
  'ميدان',
  'حي',
  'منطقة',
  'عمارة',
  'برج',
  'كمبوند',
  'قرية',
  'عزبة',
  'كفر',
  'نجع',
];

/**
 * Analyze Egyptian address and extract governorate, city, and district
 */
export function analyzeAddress(address: string): AddressAnalysis {
  const normalizedAddress = normalizeArabicText(address.toLowerCase());
  
  let governorate = '';
  let city = '';
  let district = '';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // 1. Find Governorate
  for (const [gov, variations] of Object.entries(GOVERNORATES)) {
    if (variations.some(v => normalizedAddress.includes(v.toLowerCase()))) {
      governorate = gov;
      confidence = 'high';
      break;
    }
  }

  // 2. Find City (if governorate found)
  if (governorate && CITIES[governorate]) {
    for (const cityName of CITIES[governorate]) {
      if (normalizedAddress.includes(cityName.toLowerCase())) {
        city = cityName;
        break;
      }
    }
  }

  // 3. Extract District/Area
  district = extractDistrict(address, governorate, city);

  // 4. Adjust confidence
  if (!governorate) {
    confidence = 'low';
  } else if (governorate && !city) {
    confidence = 'medium';
  } else if (governorate && city && district) {
    confidence = 'high';
  }

  // 5. Fallback: Try to guess from address patterns
  if (!governorate) {
    governorate = guessGovernorateFromPatterns(normalizedAddress);
    if (governorate) {
      confidence = 'medium';
    }
  }

  return {
    governorate: governorate || 'غير محدد',
    city: city || 'غير محدد',
    district: district || 'غير محدد',
    confidence,
    needsReview: confidence === 'low' || !governorate,
  };
}

/**
 * Normalize Arabic text (remove diacritics, normalize characters)
 */
function normalizeArabicText(text: string): string {
  return text
    .replace(/[ًٌٍَُِّْ]/g, '') // Remove diacritics
    .replace(/[أإآ]/g, 'ا') // Normalize alef
    .replace(/ة/g, 'ه') // Normalize taa marbouta
    .replace(/ى/g, 'ي') // Normalize alef maksura
    .trim();
}

/**
 * Extract district/area from address
 */
function extractDistrict(address: string, governorate: string, city: string): string {
  // Remove governorate and city from address
  let remaining = address;
  if (governorate) {
    remaining = remaining.replace(new RegExp(governorate, 'gi'), '');
  }
  if (city) {
    remaining = remaining.replace(new RegExp(city, 'gi'), '');
  }

  // Look for district keywords
  for (const keyword of DISTRICT_KEYWORDS) {
    const regex = new RegExp(`${keyword}\\s+([^،,\\.]+)`, 'i');
    const match = remaining.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Extract first meaningful part (after commas/dashes)
  const parts = remaining.split(/[،,\-]/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length > 3 && !trimmed.match(/^\d+$/)) {
      return trimmed;
    }
  }

  return '';
}

/**
 * Guess governorate from common patterns
 */
function guessGovernorateFromPatterns(address: string): string {
  // Check for 6th of October / Sheikh Zayed
  if (address.includes('أكتوبر') || address.includes('اكتوبر') || address.includes('october') || address.includes('زايد') || address.includes('zayed')) {
    return 'الجيزة';
  }

  // Check for New Cairo / Rehab / Madinaty
  if (address.includes('التجمع') || address.includes('الرحاب') || address.includes('مدينتي') || address.includes('rehab') || address.includes('new cairo')) {
    return 'القاهرة';
  }

  // Check for 10th of Ramadan
  if (address.includes('العاشر') || address.includes('رمضان') || address.includes('10th')) {
    return 'الشرقية';
  }

  return '';
}

/**
 * Batch analyze multiple addresses
 */
export function batchAnalyzeAddresses(
  addresses: { id: string; address: string }[]
): Record<string, AddressAnalysis> {
  const results: Record<string, AddressAnalysis> = {};

  for (const item of addresses) {
    results[item.id] = analyzeAddress(item.address);
  }

  return results;
}

/**
 * Validate address analysis
 */
export function validateAddressAnalysis(analysis: AddressAnalysis): boolean {
  return (
    analysis.governorate !== 'غير محدد' &&
    analysis.confidence !== 'low'
  );
}

/**
 * Get all governorates list
 */
export function getAllGovernorates(): string[] {
  return Object.keys(GOVERNORATES);
}

/**
 * Get cities for a governorate
 */
export function getCitiesForGovernorate(governorate: string): string[] {
  return CITIES[governorate] || [];
}