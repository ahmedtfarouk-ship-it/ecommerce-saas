// lib/data/egyptLocations.ts

export interface City {
  name: string;
  arabicName: string;
}

export interface Governorate {
  name: string;
  arabicName: string;
  cities: City[];
}

export const EGYPT_GOVERNORATES: Governorate[] = [
  {
    name: 'Cairo',
    arabicName: 'القاهرة',
    cities: [
      { name: 'Nasr City', arabicName: 'مدينة نصر' },
      { name: 'Heliopolis', arabicName: 'مصر الجديدة' },
      { name: 'Maadi', arabicName: 'المعادي' },
      { name: 'Helwan', arabicName: 'حلوان' },
      { name: 'Shubra', arabicName: 'شبرا' },
      { name: 'Ain Shams', arabicName: 'عين شمس' },
      { name: 'New Cairo', arabicName: 'القاهرة الجديدة' },
      { name: 'Zamalek', arabicName: 'الزمالك' },
      { name: 'Downtown', arabicName: 'وسط البلد' },
      { name: 'Masr El Gedida', arabicName: 'مصر الجديدة' },
    ]
  },
  {
    name: 'Giza',
    arabicName: 'الجيزة',
    cities: [
      { name: 'Dokki', arabicName: 'الدقي' },
      { name: 'Mohandessin', arabicName: 'المهندسين' },
      { name: 'Haram', arabicName: 'الهرم' },
      { name: '6th October', arabicName: '6 أكتوبر' },
      { name: 'Sheikh Zayed', arabicName: 'الشيخ زايد' },
      { name: 'Faisal', arabicName: 'فيصل' },
      { name: 'Imbaba', arabicName: 'إمبابة' },
      { name: 'Agouza', arabicName: 'العجوزة' },
    ]
  },
  {
    name: 'Alexandria',
    arabicName: 'الإسكندرية',
    cities: [
      { name: 'Miami', arabicName: 'ميامي' },
      { name: 'Smouha', arabicName: 'سموحة' },
      { name: 'Sidi Bishr', arabicName: 'سيدي بشر' },
      { name: 'Montaza', arabicName: 'المنتزه' },
      { name: 'Stanley', arabicName: 'ستانلي' },
      { name: 'Gleem', arabicName: 'جليم' },
      { name: 'San Stefano', arabicName: 'سان ستيفانو' },
      { name: 'Downtown', arabicName: 'وسط البلد' },
      { name: 'Borg El Arab', arabicName: 'برج العرب' },
    ]
  },
  {
    name: 'Dakahlia',
    arabicName: 'الدقهلية',
    cities: [
      { name: 'Mansoura', arabicName: 'المنصورة' },
      { name: 'Mit Ghamr', arabicName: 'ميت غمر' },
      { name: 'Talkha', arabicName: 'طلخا' },
      { name: 'Dekernes', arabicName: 'دكرنس' },
      { name: 'Aga', arabicName: 'أجا' },
      { name: 'Manzala', arabicName: 'المنزلة' },
    ]
  },
  {
    name: 'Sharqia',
    arabicName: 'الشرقية',
    cities: [
      { name: 'Zagazig', arabicName: 'الزقازيق' },
      { name: '10th of Ramadan', arabicName: '10 رمضان' },
      { name: 'Belbeis', arabicName: 'بلبيس' },
      { name: 'Minya El Qamh', arabicName: 'منيا القمح' },
      { name: 'Abu Hammad', arabicName: 'أبو حماد' },
      { name: 'Faqous', arabicName: 'فاقوس' },
    ]
  },
  {
    name: 'Qalyubia',
    arabicName: 'القليوبية',
    cities: [
      { name: 'Benha', arabicName: 'بنها' },
      { name: 'Shubra El Kheima', arabicName: 'شبرا الخيمة' },
      { name: 'Qalyub', arabicName: 'قليوب' },
      { name: 'Khanka', arabicName: 'الخانكة' },
      { name: 'Obour', arabicName: 'العبور' },
    ]
  },
  {
    name: 'Gharbia',
    arabicName: 'الغربية',
    cities: [
      { name: 'Tanta', arabicName: 'طنطا' },
      { name: 'Mahalla', arabicName: 'المحلة الكبرى' },
      { name: 'Kafr El Zayat', arabicName: 'كفر الزيات' },
      { name: 'Zifta', arabicName: 'زفتى' },
      { name: 'Samannoud', arabicName: 'سمنود' },
    ]
  },
  {
    name: 'Monufia',
    arabicName: 'المنوفية',
    cities: [
      { name: 'Shebin El Kom', arabicName: 'شبين الكوم' },
      { name: 'Menouf', arabicName: 'منوف' },
      { name: 'Ashmoun', arabicName: 'أشمون' },
      { name: 'Quesna', arabicName: 'قويسنا' },
      { name: 'Berket El Saba', arabicName: 'بركة السبع' },
    ]
  },
  {
    name: 'Beheira',
    arabicName: 'البحيرة',
    cities: [
      { name: 'Damanhour', arabicName: 'دمنهور' },
      { name: 'Kafr El Dawar', arabicName: 'كفر الدوار' },
      { name: 'Rashid', arabicName: 'رشيد' },
      { name: 'Edku', arabicName: 'إدكو' },
      { name: 'Abu Hummus', arabicName: 'أبو حمص' },
    ]
  },
  {
    name: 'Port Said',
    arabicName: 'بورسعيد',
    cities: [
      { name: 'Port Said', arabicName: 'بورسعيد' },
      { name: 'Port Fouad', arabicName: 'بور فؤاد' },
    ]
  },
  {
    name: 'Damietta',
    arabicName: 'دمياط',
    cities: [
      { name: 'Damietta', arabicName: 'دمياط' },
      { name: 'New Damietta', arabicName: 'دمياط الجديدة' },
      { name: 'Ras El Bar', arabicName: 'رأس البر' },
      { name: 'Faraskour', arabicName: 'فارسكور' },
    ]
  },
  {
    name: 'Ismailia',
    arabicName: 'الإسماعيلية',
    cities: [
      { name: 'Ismailia', arabicName: 'الإسماعيلية' },
      { name: 'Fayed', arabicName: 'فايد' },
      { name: 'Qantara', arabicName: 'القنطرة' },
    ]
  },
  {
    name: 'Suez',
    arabicName: 'السويس',
    cities: [
      { name: 'Suez', arabicName: 'السويس' },
      { name: 'Ain Sokhna', arabicName: 'العين السخنة' },
    ]
  },
  {
    name: 'North Sinai',
    arabicName: 'شمال سيناء',
    cities: [
      { name: 'Arish', arabicName: 'العريش' },
      { name: 'Sheikh Zuweid', arabicName: 'الشيخ زويد' },
      { name: 'Rafah', arabicName: 'رفح' },
    ]
  },
  {
    name: 'South Sinai',
    arabicName: 'جنوب سيناء',
    cities: [
      { name: 'Sharm El Sheikh', arabicName: 'شرم الشيخ' },
      { name: 'Dahab', arabicName: 'دهب' },
      { name: 'Nuweiba', arabicName: 'نويبع' },
      { name: 'Taba', arabicName: 'طابا' },
      { name: 'Saint Catherine', arabicName: 'سانت كاترين' },
    ]
  },
  {
    name: 'Red Sea',
    arabicName: 'البحر الأحمر',
    cities: [
      { name: 'Hurghada', arabicName: 'الغردقة' },
      { name: 'Safaga', arabicName: 'سفاجا' },
      { name: 'Marsa Alam', arabicName: 'مرسى علم' },
      { name: 'Qusair', arabicName: 'القصير' },
    ]
  },
  {
    name: 'Fayoum',
    arabicName: 'الفيوم',
    cities: [
      { name: 'Fayoum', arabicName: 'الفيوم' },
      { name: 'Tamiya', arabicName: 'طامية' },
      { name: 'Sinnuris', arabicName: 'سنورس' },
      { name: 'Ibsheway', arabicName: 'إبشواي' },
    ]
  },
  {
    name: 'Beni Suef',
    arabicName: 'بني سويف',
    cities: [
      { name: 'Beni Suef', arabicName: 'بني سويف' },
      { name: 'New Beni Suef', arabicName: 'بني سويف الجديدة' },
      { name: 'Nasser', arabicName: 'ناصر' },
      { name: 'Beba', arabicName: 'ببا' },
    ]
  },
  {
    name: 'Minya',
    arabicName: 'المنيا',
    cities: [
      { name: 'Minya', arabicName: 'المنيا' },
      { name: 'Mallawi', arabicName: 'ملوي' },
      { name: 'Samalut', arabicName: 'سمالوط' },
      { name: 'Matay', arabicName: 'مطاي' },
      { name: 'Beni Mazar', arabicName: 'بني مزار' },
    ]
  },
  {
    name: 'Asyut',
    arabicName: 'أسيوط',
    cities: [
      { name: 'Asyut', arabicName: 'أسيوط' },
      { name: 'New Asyut', arabicName: 'أسيوط الجديدة' },
      { name: 'Manfalut', arabicName: 'منفلوط' },
      { name: 'Abu Tig', arabicName: 'أبو تيج' },
    ]
  },
  {
    name: 'Sohag',
    arabicName: 'سوهاج',
    cities: [
      { name: 'Sohag', arabicName: 'سوهاج' },
      { name: 'Akhmim', arabicName: 'أخميم' },
      { name: 'Girga', arabicName: 'جرجا' },
      { name: 'Balyana', arabicName: 'البلينا' },
    ]
  },
  {
    name: 'Qena',
    arabicName: 'قنا',
    cities: [
      { name: 'Qena', arabicName: 'قنا' },
      { name: 'Nag Hammadi', arabicName: 'نجع حمادي' },
      { name: 'Qus', arabicName: 'قوص' },
      { name: 'Luxor', arabicName: 'الأقصر' },
    ]
  },
  {
    name: 'Luxor',
    arabicName: 'الأقصر',
    cities: [
      { name: 'Luxor', arabicName: 'الأقصر' },
      { name: 'Esna', arabicName: 'إسنا' },
      { name: 'Armant', arabicName: 'أرمنت' },
    ]
  },
  {
    name: 'Aswan',
    arabicName: 'أسوان',
    cities: [
      { name: 'Aswan', arabicName: 'أسوان' },
      { name: 'Kom Ombo', arabicName: 'كوم أمبو' },
      { name: 'Edfu', arabicName: 'إدفو' },
      { name: 'Daraw', arabicName: 'دراو' },
    ]
  },
  {
    name: 'Matrouh',
    arabicName: 'مطروح',
    cities: [
      { name: 'Marsa Matrouh', arabicName: 'مرسى مطروح' },
      { name: 'El Alamein', arabicName: 'العلمين' },
      { name: 'Sidi Abdel Rahman', arabicName: 'سيدي عبد الرحمن' },
    ]
  },
  {
    name: 'New Valley',
    arabicName: 'الوادي الجديد',
    cities: [
      { name: 'Kharga', arabicName: 'الخارجة' },
      { name: 'Dakhla', arabicName: 'الداخلة' },
      { name: 'Farafra', arabicName: 'الفرافرة' },
    ]
  },
];

// Helper functions
export function getGovernorateByName(name: string): Governorate | undefined {
  const normalized = name.toLowerCase().trim();
  return EGYPT_GOVERNORATES.find(
    gov => gov.name.toLowerCase() === normalized || 
           gov.arabicName.toLowerCase() === normalized
  );
}

export function getCitiesByGovernorate(governorateName: string): City[] {
  const gov = getGovernorateByName(governorateName);
  return gov?.cities || [];
}

export function findGovernorateByCity(cityName: string): Governorate | undefined {
  const normalized = cityName.toLowerCase().trim();
  return EGYPT_GOVERNORATES.find(gov =>
    gov.cities.some(
      city => city.name.toLowerCase() === normalized ||
              city.arabicName.toLowerCase() === normalized
    )
  );
}