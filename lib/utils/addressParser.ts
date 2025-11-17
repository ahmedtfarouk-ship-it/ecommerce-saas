// lib/utils/addressParser.ts

import { AddressAnalysis } from '@/types';

const EGYPT_GOVERNORATES = [
  { governorate: 'القاهرة', cities: ['مدينة نصر', 'المعادي', 'حلوان', 'مصر الجديدة', 'الزمالك', 'المهندسين', 'شبرا', 'الموسكي'] },
  { governorate: 'الجيزة', cities: ['الهرم', 'فيصل', 'الدقي', 'المهندسين', 'العجوزة', '6 أكتوبر', 'الشيخ زايد', 'المنيب'] },
  { governorate: 'الإسكندرية', cities: ['سموحة', 'سيدي جابر', 'المنتزه', 'الدخيلة', 'العجمي', 'المنشية', 'محرم بك'] },
  { governorate: 'الدقهلية', cities: ['المنصورة', 'طلخا', 'ميت غمر', 'دكرنس', 'أجا'] },
  { governorate: 'الشرقية', cities: ['الزقازيق', 'بلبيس', 'العاشر من رمضان', 'فاقوس', 'مشتول السوق'] },
  { governorate: 'القليوبية', cities: ['بنها', 'شبرا الخيمة', 'القناطر الخيرية', 'الخانكة', 'قليوب'] },
  { governorate: 'الغربية', cities: ['طنطا', 'المحلة الكبرى', 'كفر الزيات', 'زفتى', 'السنطة'] },
  { governorate: 'المنوفية', cities: ['شبين الكوم', 'منوف', 'أشمون', 'الباجور', 'قويسنا'] },
  { governorate: 'البحيرة', cities: ['دمنهور', 'كفر الدوار', 'رشيد', 'إدكو', 'أبو المطامير'] },
  { governorate: 'أسيوط', cities: ['أسيوط', 'ديروط', 'القوصية', 'منفلوط', 'أبنوب'] }
];

function normalizeArabicText(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ىي]/g, 'ى')
    .replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .trim()
    .toLowerCase();
}

export function parseAddress(address: string): AddressAnalysis {
  if (!address) {
    return { governorate: '', city: '', district: undefined, confidence: 0 };
  }

  const normalizedAddress = normalizeArabicText(address);
  let bestMatch: AddressAnalysis = {
    governorate: '',
    city: '',
    district: undefined,
    confidence: 0
  };

  for (const gov of EGYPT_GOVERNORATES) {
    const normalizedGov = normalizeArabicText(gov.governorate);
    
    if (normalizedAddress.includes(normalizedGov)) {
      let foundCity = '';
      let cityConfidence = 0;

      for (const city of gov.cities) {
        const normalizedCity = normalizeArabicText(city);
        if (normalizedAddress.includes(normalizedCity)) {
          const confidence = normalizedCity.length / normalizedAddress.length;
          if (confidence > cityConfidence) {
            cityConfidence = confidence;
            foundCity = city;
          }
        }
      }

      const totalConfidence = foundCity ? 0.9 : 0.6;

      if (totalConfidence > bestMatch.confidence) {
        bestMatch = {
          governorate: gov.governorate,
          city: foundCity || gov.cities[0],
          district: undefined,
          confidence: totalConfidence
        };
      }
    }
  }

  if (bestMatch.governorate) {
    const words = address.split(/[\s,،]+/).filter(w => w.length > 2);
    if (words.length > 0) {
      bestMatch.district = words.slice(0, 3).join(' ');
    }
  }

  return bestMatch;
}