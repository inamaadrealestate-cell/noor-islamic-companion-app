export interface DhikrItem {
  id: string;
  order: number;
  arabic: string;
  transliteration: string;
  translation: string;
  repetitions: number;
  source?: string;
  virtue?: string | null;
}

export interface DhikrCategory {
  id: string;
  name: string;
  arabic_name: string;
  description: string;
  icon: string;
  items: DhikrItem[];
}

export interface DuaItem {
  id: string;
  category: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  source?: string;
  icon: string;
}

export const ADHKAR_CATEGORIES: DhikrCategory[] = [
  {
    id: "morning",
    name: "Morning Adhkar",
    arabic_name: "أذكار الصباح",
    description: "Recommended remembrance after Fajr until sunrise",
    icon: "sunrise",
    items: [
      {
        id: "morning_001",
        order: 1,
        arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
        transliteration: "Asbahna wa asbahal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah",
        translation: "We have entered a new morning and with it all dominion belongs to Allah. Praise is to Allah. None has the right to be worshipped except Allah alone, without partner.",
        repetitions: 1,
        source: "Muslim 4/2088",
        virtue: "Recited once in the morning"
      },
      {
        id: "morning_002",
        order: 2,
        arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُور",
        transliteration: "Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu wa ilaykan-nushur",
        translation: "O Allah, by Your leave we have reached the morning and by Your leave we reach the evening, by Your leave we live and die and unto You is our resurrection.",
        repetitions: 1,
        source: "Tirmidhi 5/466",
        virtue: null
      },
      {
        id: "morning_003",
        order: 3,
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        transliteration: "SubhanAllahi wa bihamdih",
        translation: "Glory is to Allah and praise is to Him.",
        repetitions: 100,
        source: "Muslim 4/2071",
        virtue: "Whoever says this 100 times a day, will have his sins forgiven even if they were like the foam of the sea"
      },
      {
        id: "morning_004",
        order: 4,
        arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
        transliteration: "Ya Hayyu Ya Qayyumu birahmatika astagheeth, aslih li sha'ni kullahu wa la takilni ila nafsi tarfata 'ayn",
        translation: "O Living, O Self-Sustaining Sustainer! In Your Mercy do I seek relief: correct for me all my affairs and do not leave me to myself even for the blink of an eye.",
        repetitions: 3,
        source: "Hakim 1/545",
        virtue: "Exemplary supplication for relief from distress"
      }
    ]
  },
  {
    id: "evening",
    name: "Evening Adhkar",
    arabic_name: "أذكار المساء",
    description: "Recommended remembrance after Asr until Maghrib",
    icon: "sunset",
    items: [
      {
        id: "evening_001",
        order: 1,
        arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
        transliteration: "Amsayna wa amsal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah",
        translation: "We have entered the evening and with it all dominion belongs to Allah. Praise is to Allah. None has the right to be worshipped except Allah alone, without partner.",
        repetitions: 1,
        source: "Muslim 4/2088",
        virtue: null
      },
      {
        id: "evening_002",
        order: 2,
        arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ",
        transliteration: "Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu wa ilaykal-maseer",
        translation: "O Allah, by Your leave we have reached the evening and by Your leave we reach the morning, by Your leave we live and die and unto You is our return.",
        repetitions: 1,
        source: "Tirmidhi 5/466",
        virtue: null
      },
      {
        id: "evening_003",
        order: 3,
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        transliteration: "SubhanAllahi wa bihamdih",
        translation: "Glory is to Allah and praise is to Him.",
        repetitions: 100,
        source: "Muslim 4/2071",
        virtue: "Purifies from daily sins and elevates rank"
      }
    ]
  },
  {
    id: "after_prayer",
    name: "After Prayer Adhkar",
    arabic_name: "أذكار بعد الصلاة",
    description: "Recited after completing each of the 5 daily prayers",
    icon: "check-circle",
    items: [
      {
        id: "after_prayer_001",
        order: 1,
        arabic: "أَسْتَغْفِرُ اللَّهَ",
        transliteration: "Astaghfirullah",
        translation: "I seek forgiveness from Allah.",
        repetitions: 3,
        source: "Muslim 591",
        virtue: null
      },
      {
        id: "after_prayer_002",
        order: 2,
        arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
        transliteration: "Allahumma antas-salam wa minkas-salam, tabarakta ya dhal-jalali wal-ikram",
        translation: "O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of glory and honor.",
        repetitions: 1,
        source: "Muslim 591",
        virtue: null
      },
      {
        id: "after_prayer_003",
        order: 3,
        arabic: "سُبْحَانَ اللَّهِ",
        transliteration: "SubhanAllah",
        translation: "Glory be to Allah",
        repetitions: 33,
        source: "Bukhari 843",
        virtue: null
      },
      {
        id: "after_prayer_004",
        order: 4,
        arabic: "الْحَمْدُ لِلَّهِ",
        transliteration: "Alhamdulillah",
        translation: "Praise be to Allah",
        repetitions: 33,
        source: "Bukhari 843",
        virtue: null
      },
      {
        id: "after_prayer_005",
        order: 5,
        arabic: "اللَّهُ أَكْبَرُ",
        transliteration: "Allahu Akbar",
        translation: "Allah is the Greatest",
        repetitions: 34,
        source: "Bukhari 843",
        virtue: "Completes the 100 — whoever does this after every prayer, their sins are forgiven even if like the foam of the sea"
      }
    ]
  },
  {
    id: "sleep",
    name: "Before Sleeping",
    arabic_name: "أذكار النوم",
    description: "Recited before going to sleep",
    icon: "moon",
    items: [
      {
        id: "sleep_001",
        order: 1,
        arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
        transliteration: "Bismika Allahumma amutu wa ahya",
        translation: "In Your name, O Allah, I die and I live.",
        repetitions: 1,
        source: "Bukhari 6324",
        virtue: null
      },
      {
        id: "sleep_002",
        order: 2,
        arabic: "آيَةُ الْكُرْسِيِّ",
        transliteration: "Ayatul Kursi",
        translation: "The Throne Verse (Quran 2:255) — recite in full before sleeping",
        repetitions: 1,
        source: "Bukhari 2311",
        virtue: "Whoever recites it before sleeping, Allah will appoint a guardian who will protect him until morning, and Shaytan will not come near him"
      }
    ]
  },
  {
    id: "waking",
    name: "Upon Waking Up",
    arabic_name: "أذكار الاستيقاظ",
    description: "Recited immediately upon waking",
    icon: "sun",
    items: [
      {
        id: "waking_001",
        order: 1,
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
        transliteration: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
        translation: "Praise is to Allah Who gives us life after He has caused us to die and unto Him is the resurrection.",
        repetitions: 1,
        source: "Bukhari 6312",
        virtue: null
      }
    ]
  }
];

export const DUAS_LIST: DuaItem[] = [
  {
    id: "dua_eating_before",
    category: "eating",
    title: "Before Eating",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah",
    translation: "In the name of Allah",
    source: "Abu Dawud 3767",
    icon: "utensils"
  },
  {
    id: "dua_eating_after",
    category: "eating",
    title: "After Eating",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
    transliteration: "Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
    translation: "Praise is to Allah Who has fed me this and provided it for me without any might or power on my part.",
    source: "Tirmidhi 3458",
    icon: "utensils"
  },
  {
    id: "dua_travel",
    category: "travel",
    title: "Travel Dua",
    arabic: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى",
    transliteration: "Allahumma inna nas'aluka fi safarina hadhal-birra wat-taqwa",
    translation: "O Allah, we ask You for righteousness and piety in this journey of ours.",
    source: "Muslim 1342",
    icon: "plane"
  },
  {
    id: "dua_entering_home",
    category: "home",
    title: "Entering the Home",
    arabic: "بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
    transliteration: "Bismillahi walajna, wa bismillahi kharajna, wa 'ala Allahi rabbina tawakkalna",
    translation: "In the name of Allah we enter, and in the name of Allah we leave, and upon our Lord we place our trust.",
    source: "Abu Dawud 5096",
    icon: "home"
  },
  {
    id: "dua_entering_masjid",
    category: "masjid",
    title: "Entering the Masjid",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Allahummaf-tahli abwaba rahmatik",
    translation: "O Allah, open the gates of Your mercy for me.",
    source: "Muslim 713",
    icon: "building"
  },
  {
    id: "dua_distress",
    category: "distress",
    title: "In Times of Distress & Anxiety",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration: "La ilaha illallahul-'Adhimul-Halim, la ilaha illallahu rabbul-'arshil-'adhim",
    translation: "None has the right to be worshipped except Allah, the Mighty, the Forbearing. None has the right to be worshipped except Allah, Lord of the Magnificent Throne.",
    source: "Bukhari 6346",
    icon: "alert-circle"
  },
  {
    id: "dua_gratitude",
    category: "gratitude",
    title: "Expressing Gratitude",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ",
    transliteration: "Alhamdu lillahil-ladhi bini'matihi tatimmus-salihat",
    translation: "Praise is to Allah by Whose grace good deeds are completed.",
    source: "Ibn Majah",
    icon: "heart"
  },
  {
    id: "dua_forgiveness",
    category: "forgiveness",
    title: "Master Supplication for Forgiveness (Sayyid al-Istighfar)",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلا أَنْتَ ، خَلَقْتَنِي وَأَنَا عَبْدُكَ ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ",
    transliteration: "Allahumma anta rabbi la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu",
    translation: "O Allah, You are my Lord, there is none worthy of worship but You. You created me and I am Your slave. I keep Your covenant and my pledge to You so far as I am able.",
    source: "Bukhari 6306",
    icon: "shield"
  },
  {
    id: "dua_parents",
    category: "parents",
    title: "Dua for Parents (Quranic)",
    arabic: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    transliteration: "Rabbi irhamhuma kama rabbayani sagheera",
    translation: "My Lord, have mercy upon them [my parents] as they brought me up [when I was] small.",
    source: "Quran 17:24",
    icon: "users"
  },
  {
    id: "dua_rizq",
    category: "rizq",
    title: "Dua for Halal Sustenance (Rizq)",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا",
    transliteration: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan",
    translation: "O Allah, I ask You for knowledge that is of benefit, a good provision, and deeds that will be accepted.",
    source: "Ibn Majah 925",
    icon: "sun"
  }
];
