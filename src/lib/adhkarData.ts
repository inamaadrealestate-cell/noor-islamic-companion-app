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
    "id": "morning",
    "name": "Morning Adhkar",
    "arabic_name": "أذكار الصباح",
    "description": "Recommended remembrance after Fajr until sunrise",
    "icon": "sunrise",
    "items": [
      {
        "id": "morning_001",
        "order": 1,
        "arabic": "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        "transliteration": "Asbahna wa asbahal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ala kulli shay'in qadir",
        "translation": "We have entered the morning and the kingdom belongs to Allah. Praise is to Allah. None has the right to be worshipped except Allah alone, without partner. His is the dominion and His is the praise, and He is able to do all things.",
        "repetitions": 1,
        "source": "Muslim 2723",
        "virtue": "Morning remembrance of tawhid and gratitude"
      },
      {
        "id": "morning_002",
        "order": 2,
        "arabic": "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
        "transliteration": "Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu wa ilaykan-nushur",
        "translation": "O Allah, by You we enter the morning, by You we enter the evening, by You we live, by You we die, and to You is the resurrection.",
        "repetitions": 1,
        "source": "Tirmidhi 3391",
        "virtue": null
      },
      {
        "id": "morning_003",
        "order": 3,
        "arabic": "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        "transliteration": "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana abduka, wa ana ala ahdika wa wadika mastatatu, audhu bika min sharri ma sanatu, abuu laka binimatika alayya, wa abuu bidhanbi, faghfir li fa innahu la yaghfirudh-dhunuba illa anta",
        "translation": "O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant. I keep Your covenant as much as I can. I seek refuge in You from the evil I have done. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me, for none forgives sins except You.",
        "repetitions": 1,
        "source": "Bukhari 6306",
        "virtue": "Known as Sayyid al-Istighfar, the master supplication for forgiveness"
      },
      {
        "id": "morning_004",
        "order": 4,
        "arabic": "اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
        "transliteration": "Allahumma ma asbaha bi min nimatin aw bi ahadin min khalqika faminka wahdaka la sharika lak, falakal-hamdu wa lakash-shukr",
        "translation": "O Allah, whatever blessing has come to me or to any of Your creation this morning is from You alone, without partner. To You belongs all praise and thanks.",
        "repetitions": 1,
        "source": "Abu Dawud 5073",
        "virtue": "Gratitude for Allah's blessings"
      },
      {
        "id": "morning_005",
        "order": 5,
        "arabic": "اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ",
        "transliteration": "Allahumma inni asbahtu ush-hiduka, wa ush-hidu hamalata arshika, wa malaikataka, wa jamia khalqika, annaka Antallahu la ilaha illa anta wahdaka la sharika lak, wa anna Muhammadan abduka wa rasuluk",
        "translation": "O Allah, this morning I call You, the bearers of Your Throne, Your angels, and all creation to witness that You are Allah; none has the right to be worshipped except You alone, without partner, and that Muhammad is Your servant and Messenger.",
        "repetitions": 4,
        "source": "Abu Dawud 5069",
        "virtue": "A testimony of faith in the morning"
      },
      {
        "id": "morning_006",
        "order": 6,
        "arabic": "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
        "transliteration": "Raditu billahi Rabba, wa bil-Islami dina, wa bi Muhammadin sallallahu alayhi wa sallama nabiyya",
        "translation": "I am pleased with Allah as Lord, with Islam as religion, and with Muhammad ﷺ as Prophet.",
        "repetitions": 3,
        "source": "Abu Dawud 5072; Tirmidhi 3389",
        "virtue": "A renewal of contentment with faith"
      },
      {
        "id": "morning_007",
        "order": 7,
        "arabic": "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        "transliteration": "Bismillahil-ladhi la yadurru maa ismihi shay'un fil-ardi wa la fis-sama'i wa huwas-Samiul-Alim",
        "translation": "In the name of Allah, with Whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, All-Knowing.",
        "repetitions": 3,
        "source": "Abu Dawud 5088; Tirmidhi 3388",
        "virtue": "Protection by Allah's name"
      },
      {
        "id": "morning_008",
        "order": 8,
        "arabic": "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
        "transliteration": "Audhu bikalimatillahit-tammati min sharri ma khalaq",
        "translation": "I seek refuge in the perfect words of Allah from the evil of what He has created.",
        "repetitions": 3,
        "source": "Muslim 2708",
        "virtue": "Protection from harm"
      },
      {
        "id": "morning_009",
        "order": 9,
        "arabic": "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
        "transliteration": "Hasbiyallahu la ilaha illa Huwa, alayhi tawakkaltu, wa Huwa Rabbul-Arshil-Adhim",
        "translation": "Allah is sufficient for me. None has the right to be worshipped except Him. Upon Him I rely, and He is the Lord of the Mighty Throne.",
        "repetitions": 7,
        "source": "Abu Dawud 5081",
        "virtue": "Reliance upon Allah"
      },
      {
        "id": "morning_010",
        "order": 10,
        "arabic": "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        "transliteration": "SubhanAllahi wa bihamdih",
        "translation": "Glory is to Allah and praise is to Him.",
        "repetitions": 100,
        "source": "Muslim 2691",
        "virtue": "Great reward and forgiveness by Allah's mercy"
      },
      {
        "id": "morning_011",
        "order": 11,
        "arabic": "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        "transliteration": "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu, wa huwa ala kulli shay'in qadir",
        "translation": "None has the right to be worshipped except Allah alone, without partner. His is the dominion and His is the praise, and He is able to do all things.",
        "repetitions": 10,
        "source": "Abu Dawud 5077",
        "virtue": "Morning declaration of tawhid"
      },
      {
        "id": "morning_012",
        "order": 12,
        "arabic": "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
        "transliteration": "Ya Hayyu Ya Qayyum, birahmatika astaghith, aslih li shani kullah, wa la takilni ila nafsi tarfata ayn",
        "translation": "O Ever-Living, O Sustainer, by Your mercy I seek help. Rectify all of my affairs and do not leave me to myself even for the blink of an eye.",
        "repetitions": 3,
        "source": "Hakim; Hisn al-Muslim",
        "virtue": "Seeking Allah's help and mercy"
      }
      ,
      {
        "id": "morning_013",
        "order": 13,
        "arabic": "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ",
        "transliteration": "Allahu la ilaha illa Huwa, Al-Hayyul-Qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ard. Man dhal-ladhi yashfa'u indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhituna bi shay'in min ilmihi illa bima sha'a. Wasi'a kursiyyuhus-samawati wal-ard, wa la ya'uduhu hifdhuhuma, wa Huwal-Aliyyul-Adhim.",
        "translation": "Allah - none has the right to be worshipped except Him, the Ever-Living, the Sustainer. Neither drowsiness nor sleep overtakes Him. To Him belongs whatever is in the heavens and whatever is on the earth. Who can intercede with Him except by His permission? He knows what is before them and what is behind them, and they encompass nothing of His knowledge except what He wills. His Kursi extends over the heavens and the earth, and preserving them does not tire Him. He is the Most High, the Most Great.",
        "repetitions": 1,
        "source": "Quran 2:255",
        "virtue": "Ayat al-Kursi for morning protection"
      },
      {
        "id": "morning_014",
        "order": 14,
        "arabic": "قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
        "transliteration": "Qul Huwallahu Ahad. Allahus-Samad. Lam yalid wa lam yulad. Wa lam yakun lahu kufuwan ahad.",
        "translation": "Say: He is Allah, One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent.",
        "repetitions": 3,
        "source": "Quran 112; Abu Dawud 5082; Tirmidhi 3575",
        "virtue": "Read three times in the morning with the last two surahs"
      },
      {
        "id": "morning_015",
        "order": 15,
        "arabic": "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
        "transliteration": "Qul audhu bi Rabbil-falaq, min sharri ma khalaq, wa min sharri ghasiqin idha waqab, wa min sharrin-naffathati fil-uqad, wa min sharri hasidin idha hasad.",
        "translation": "Say: I seek refuge in the Lord of daybreak, from the evil of what He created, from the evil of darkness when it settles, from the evil of those who blow on knots, and from the evil of an envier when he envies.",
        "repetitions": 3,
        "source": "Quran 113; Abu Dawud 5082; Tirmidhi 3575",
        "virtue": "Read three times in the morning for Allah's protection"
      },
      {
        "id": "morning_016",
        "order": 16,
        "arabic": "قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَٰهِ النَّاسِ، مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ",
        "transliteration": "Qul audhu bi Rabbin-nas, Malikin-nas, Ilahin-nas, min sharril-waswasil-khannas, alladhi yuwaswisu fi sudurin-nas, minal-jinnati wan-nas.",
        "translation": "Say: I seek refuge in the Lord of mankind, the King of mankind, the God of mankind, from the evil of the retreating whisperer who whispers into the hearts of mankind, from among jinn and mankind.",
        "repetitions": 3,
        "source": "Quran 114; Abu Dawud 5082; Tirmidhi 3575",
        "virtue": "Read three times in the morning with Al-Ikhlas and Al-Falaq"
      },
      {
        "id": "morning_017",
        "order": 17,
        "arabic": "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي",
        "transliteration": "Allahumma inni as'alukal-afiyah fid-dunya wal-akhirah. Allahumma inni as'alukal-afwa wal-afiyah fi dini wa dunyaya wa ahli wa mali. Allahummastur awrati wa amin raw'ati. Allahummahfazni min bayni yadayya, wa min khalfi, wa an yamini, wa an shimali, wa min fawqi, wa audhu bi adhamatika an ughtala min tahti.",
        "translation": "O Allah, I ask You for well-being in this world and the Hereafter. O Allah, I ask You for pardon and well-being in my religion, my worldly life, my family and my wealth. O Allah, conceal my faults and calm my fears. O Allah, protect me from in front of me, from behind me, from my right, from my left and from above me, and I seek refuge in Your greatness from being taken unexpectedly from beneath me.",
        "repetitions": 1,
        "source": "Abu Dawud 5074; Ibn Majah 3871",
        "virtue": "A comprehensive morning dua for safety and well-being"
      }

    ]
  },
  {
    "id": "evening",
    "name": "Evening Adhkar",
    "arabic_name": "أذكار المساء",
    "description": "Recommended remembrance after Asr until Maghrib",
    "icon": "sunset",
    "items": [
      {
        "id": "evening_001",
        "order": 1,
        "arabic": "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        "transliteration": "Amsayna wa amsal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ala kulli shay'in qadir",
        "translation": "We have entered the evening and the kingdom belongs to Allah. Praise is to Allah. None has the right to be worshipped except Allah alone, without partner. His is the dominion and His is the praise, and He is able to do all things.",
        "repetitions": 1,
        "source": "Muslim 2723",
        "virtue": "Evening remembrance of tawhid and gratitude"
      },
      {
        "id": "evening_002",
        "order": 2,
        "arabic": "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ",
        "transliteration": "Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu wa ilaykal-masir",
        "translation": "O Allah, by You we enter the evening, by You we enter the morning, by You we live, by You we die, and to You is the return.",
        "repetitions": 1,
        "source": "Tirmidhi 3391",
        "virtue": null
      },
      {
        "id": "evening_003",
        "order": 3,
        "arabic": "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        "transliteration": "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana abduka, wa ana ala ahdika wa wadika mastatatu, audhu bika min sharri ma sanatu, abuu laka binimatika alayya, wa abuu bidhanbi, faghfir li fa innahu la yaghfirudh-dhunuba illa anta",
        "translation": "O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant. I keep Your covenant as much as I can. I seek refuge in You from the evil I have done. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me, for none forgives sins except You.",
        "repetitions": 1,
        "source": "Bukhari 6306",
        "virtue": "Sayyid al-Istighfar"
      },
      {
        "id": "evening_004",
        "order": 4,
        "arabic": "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
        "transliteration": "Allahumma ma amsa bi min nimatin aw bi ahadin min khalqika faminka wahdaka la sharika lak, falakal-hamdu wa lakash-shukr",
        "translation": "O Allah, whatever blessing has come to me or to any of Your creation this evening is from You alone, without partner. To You belongs all praise and thanks.",
        "repetitions": 1,
        "source": "Abu Dawud 5073",
        "virtue": "Gratitude for Allah's blessings"
      },
      {
        "id": "evening_005",
        "order": 5,
        "arabic": "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ",
        "transliteration": "Allahumma inni amsaytu ush-hiduka, wa ush-hidu hamalata arshika, wa malaikataka, wa jamia khalqika, annaka Antallahu la ilaha illa anta wahdaka la sharika lak, wa anna Muhammadan abduka wa rasuluk",
        "translation": "O Allah, this evening I call You, the bearers of Your Throne, Your angels, and all creation to witness that You are Allah; none has the right to be worshipped except You alone, without partner, and that Muhammad is Your servant and Messenger.",
        "repetitions": 4,
        "source": "Abu Dawud 5069",
        "virtue": "A testimony of faith in the evening"
      },
      {
        "id": "evening_006",
        "order": 6,
        "arabic": "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
        "transliteration": "Raditu billahi Rabba, wa bil-Islami dina, wa bi Muhammadin sallallahu alayhi wa sallama nabiyya",
        "translation": "I am pleased with Allah as Lord, with Islam as religion, and with Muhammad ﷺ as Prophet.",
        "repetitions": 3,
        "source": "Abu Dawud 5072; Tirmidhi 3389",
        "virtue": "A renewal of contentment with faith"
      },
      {
        "id": "evening_007",
        "order": 7,
        "arabic": "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        "transliteration": "Bismillahil-ladhi la yadurru maa ismihi shay'un fil-ardi wa la fis-sama'i wa huwas-Samiul-Alim",
        "translation": "In the name of Allah, with Whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, All-Knowing.",
        "repetitions": 3,
        "source": "Abu Dawud 5088; Tirmidhi 3388",
        "virtue": "Protection by Allah's name"
      },
      {
        "id": "evening_008",
        "order": 8,
        "arabic": "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
        "transliteration": "Audhu bikalimatillahit-tammati min sharri ma khalaq",
        "translation": "I seek refuge in the perfect words of Allah from the evil of what He has created.",
        "repetitions": 3,
        "source": "Muslim 2708",
        "virtue": "Protection from harm"
      },
      {
        "id": "evening_009",
        "order": 9,
        "arabic": "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
        "transliteration": "Hasbiyallahu la ilaha illa Huwa, alayhi tawakkaltu, wa Huwa Rabbul-Arshil-Adhim",
        "translation": "Allah is sufficient for me. None has the right to be worshipped except Him. Upon Him I rely, and He is the Lord of the Mighty Throne.",
        "repetitions": 7,
        "source": "Abu Dawud 5081",
        "virtue": "Reliance upon Allah"
      },
      {
        "id": "evening_010",
        "order": 10,
        "arabic": "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        "transliteration": "SubhanAllahi wa bihamdih",
        "translation": "Glory is to Allah and praise is to Him.",
        "repetitions": 100,
        "source": "Muslim 2691",
        "virtue": "Great reward and forgiveness by Allah's mercy"
      },
      {
        "id": "evening_011",
        "order": 11,
        "arabic": "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        "transliteration": "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu, wa huwa ala kulli shay'in qadir",
        "translation": "None has the right to be worshipped except Allah alone, without partner. His is the dominion and His is the praise, and He is able to do all things.",
        "repetitions": 10,
        "source": "Abu Dawud 5077",
        "virtue": "Evening declaration of tawhid"
      },
      {
        "id": "evening_012",
        "order": 12,
        "arabic": "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ غَضَبِهِ وَعِقَابِهِ، وَشَرِّ عِبَادِهِ، وَمِنْ هَمَزَاتِ الشَّيَاطِينِ، وَأَنْ يَحْضُرُونِ",
        "transliteration": "Audhu bikalimatillahit-tammati min ghadabihi wa iqabihi, wa sharri ibadihi, wa min hamazatish-shayatin, wa an yahdurun",
        "translation": "I seek refuge in the perfect words of Allah from His anger and punishment, from the evil of His servants, from the whisperings of devils and from their presence.",
        "repetitions": 1,
        "source": "Abu Dawud 3893; Tirmidhi 3528",
        "virtue": "Protection before sleep or at night"
      }
      ,
      {
        "id": "evening_013",
        "order": 13,
        "arabic": "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ",
        "transliteration": "Allahu la ilaha illa Huwa, Al-Hayyul-Qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ard. Man dhal-ladhi yashfa'u indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhituna bi shay'in min ilmihi illa bima sha'a. Wasi'a kursiyyuhus-samawati wal-ard, wa la ya'uduhu hifdhuhuma, wa Huwal-Aliyyul-Adhim.",
        "translation": "Allah - none has the right to be worshipped except Him, the Ever-Living, the Sustainer. Neither drowsiness nor sleep overtakes Him. To Him belongs whatever is in the heavens and whatever is on the earth. Who can intercede with Him except by His permission? He knows what is before them and what is behind them, and they encompass nothing of His knowledge except what He wills. His Kursi extends over the heavens and the earth, and preserving them does not tire Him. He is the Most High, the Most Great.",
        "repetitions": 1,
        "source": "Quran 2:255",
        "virtue": "Ayat al-Kursi for evening protection"
      },
      {
        "id": "evening_014",
        "order": 14,
        "arabic": "قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
        "transliteration": "Qul Huwallahu Ahad. Allahus-Samad. Lam yalid wa lam yulad. Wa lam yakun lahu kufuwan ahad.",
        "translation": "Say: He is Allah, One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent.",
        "repetitions": 3,
        "source": "Quran 112; Abu Dawud 5082; Tirmidhi 3575",
        "virtue": "Read three times in the evening with the last two surahs"
      },
      {
        "id": "evening_015",
        "order": 15,
        "arabic": "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
        "transliteration": "Qul audhu bi Rabbil-falaq, min sharri ma khalaq, wa min sharri ghasiqin idha waqab, wa min sharrin-naffathati fil-uqad, wa min sharri hasidin idha hasad.",
        "translation": "Say: I seek refuge in the Lord of daybreak, from the evil of what He created, from the evil of darkness when it settles, from the evil of those who blow on knots, and from the evil of an envier when he envies.",
        "repetitions": 3,
        "source": "Quran 113; Abu Dawud 5082; Tirmidhi 3575",
        "virtue": "Read three times in the evening for Allah's protection"
      },
      {
        "id": "evening_016",
        "order": 16,
        "arabic": "قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَٰهِ النَّاسِ، مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ",
        "transliteration": "Qul audhu bi Rabbin-nas, Malikin-nas, Ilahin-nas, min sharril-waswasil-khannas, alladhi yuwaswisu fi sudurin-nas, minal-jinnati wan-nas.",
        "translation": "Say: I seek refuge in the Lord of mankind, the King of mankind, the God of mankind, from the evil of the retreating whisperer who whispers into the hearts of mankind, from among jinn and mankind.",
        "repetitions": 3,
        "source": "Quran 114; Abu Dawud 5082; Tirmidhi 3575",
        "virtue": "Read three times in the evening with Al-Ikhlas and Al-Falaq"
      },
      {
        "id": "evening_017",
        "order": 17,
        "arabic": "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي",
        "transliteration": "Allahumma inni as'alukal-afiyah fid-dunya wal-akhirah. Allahumma inni as'alukal-afwa wal-afiyah fi dini wa dunyaya wa ahli wa mali. Allahummastur awrati wa amin raw'ati. Allahummahfazni min bayni yadayya, wa min khalfi, wa an yamini, wa an shimali, wa min fawqi, wa audhu bi adhamatika an ughtala min tahti.",
        "translation": "O Allah, I ask You for well-being in this world and the Hereafter. O Allah, I ask You for pardon and well-being in my religion, my worldly life, my family and my wealth. O Allah, conceal my faults and calm my fears. O Allah, protect me from in front of me, from behind me, from my right, from my left and from above me, and I seek refuge in Your greatness from being taken unexpectedly from beneath me.",
        "repetitions": 1,
        "source": "Abu Dawud 5074; Ibn Majah 3871",
        "virtue": "A comprehensive evening dua for safety and well-being"
      }

    ]
  },
  {
    "id": "after_prayer",
    "name": "After Prayer Adhkar",
    "arabic_name": "أذكار بعد الصلاة",
    "description": "Remembrance after completing the obligatory prayers",
    "icon": "check-circle",
    "items": [
      {
        "id": "after_prayer_001",
        "order": 1,
        "arabic": "أَسْتَغْفِرُ اللَّهَ",
        "transliteration": "Astaghfirullah",
        "translation": "I seek forgiveness from Allah.",
        "repetitions": 3,
        "source": "Muslim 591",
        "virtue": null
      },
      {
        "id": "after_prayer_002",
        "order": 2,
        "arabic": "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
        "transliteration": "Allahumma antas-Salam wa minkas-salam, tabarakta ya Dhal-Jalali wal-Ikram",
        "translation": "O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of majesty and honor.",
        "repetitions": 1,
        "source": "Muslim 591",
        "virtue": null
      },
      {
        "id": "after_prayer_003",
        "order": 3,
        "arabic": "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        "transliteration": "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu, wa huwa ala kulli shay'in qadir",
        "translation": "None has the right to be worshipped except Allah alone, without partner. His is the dominion and His is the praise, and He is able to do all things.",
        "repetitions": 1,
        "source": "Bukhari 844; Muslim 593",
        "virtue": null
      },
      {
        "id": "after_prayer_004",
        "order": 4,
        "arabic": "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
        "transliteration": "La hawla wa la quwwata illa billah",
        "translation": "There is no power and no strength except with Allah.",
        "repetitions": 1,
        "source": "Bukhari 6384; Muslim 2704",
        "virtue": "A treasure from the treasures of Paradise"
      },
      {
        "id": "after_prayer_005",
        "order": 5,
        "arabic": "اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ",
        "transliteration": "Allahumma la mania lima atayta, wa la mutiya lima manata, wa la yanfau dhal-jaddi minkal-jadd",
        "translation": "O Allah, none can withhold what You give, none can give what You withhold, and the wealth of the wealthy cannot benefit them against You.",
        "repetitions": 1,
        "source": "Bukhari 844; Muslim 593",
        "virtue": null
      },
      {
        "id": "after_prayer_006",
        "order": 6,
        "arabic": "سُبْحَانَ اللَّهِ",
        "transliteration": "SubhanAllah",
        "translation": "Glory be to Allah.",
        "repetitions": 33,
        "source": "Bukhari 843; Muslim 595",
        "virtue": null
      },
      {
        "id": "after_prayer_007",
        "order": 7,
        "arabic": "الْحَمْدُ لِلَّهِ",
        "transliteration": "Alhamdulillah",
        "translation": "Praise be to Allah.",
        "repetitions": 33,
        "source": "Bukhari 843; Muslim 595",
        "virtue": null
      },
      {
        "id": "after_prayer_008",
        "order": 8,
        "arabic": "اللَّهُ أَكْبَرُ",
        "transliteration": "Allahu Akbar",
        "translation": "Allah is the Greatest.",
        "repetitions": 34,
        "source": "Bukhari 843; Muslim 595",
        "virtue": "Completes one hundred remembrances"
      },
      {
        "id": "after_prayer_009",
        "order": 9,
        "arabic": "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
        "transliteration": "Allahumma ainni ala dhikrika wa shukrika wa husni ibadatik",
        "translation": "O Allah, help me to remember You, thank You, and worship You in the best manner.",
        "repetitions": 1,
        "source": "Abu Dawud 1522; Nasai 1303",
        "virtue": "A beautiful supplication after prayer"
      },
      {
        "id": "after_prayer_010",
        "order": 10,
        "arabic": "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْجُبْنِ، وَأَعُوذُ بِكَ أَنْ أُرَدَّ إِلَى أَرْذَلِ الْعُمُرِ، وَأَعُوذُ بِكَ مِنْ فِتْنَةِ الدُّنْيَا، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ",
        "transliteration": "Allahumma inni audhu bika minal-jubn, wa audhu bika an uradda ila ardhalil-umur, wa audhu bika min fitnatid-dunya, wa audhu bika min adhabil-qabr",
        "translation": "O Allah, I seek refuge in You from cowardice, from being returned to a feeble old age, from the trial of this world, and from the punishment of the grave.",
        "repetitions": 1,
        "source": "Bukhari 6365",
        "virtue": "Protection supplication"
      }
    ]
  },
  {
    "id": "sleep",
    "name": "Before Sleeping",
    "arabic_name": "أذكار النوم",
    "description": "Remembrance before going to sleep",
    "icon": "moon",
    "items": [
      {
        "id": "sleep_001",
        "order": 1,
        "arabic": "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
        "transliteration": "Bismika Allahumma amutu wa ahya",
        "translation": "In Your name, O Allah, I die and I live.",
        "repetitions": 1,
        "source": "Bukhari 6324",
        "virtue": null
      },
      {
        "id": "sleep_002",
        "order": 2,
        "arabic": "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ",
        "transliteration": "Allahumma qini adhabaka yawma tabathu ibadak",
        "translation": "O Allah, protect me from Your punishment on the Day You resurrect Your servants.",
        "repetitions": 3,
        "source": "Abu Dawud 5045; Tirmidhi 3398",
        "virtue": null
      },
      {
        "id": "sleep_003",
        "order": 3,
        "arabic": "سُبْحَانَ اللَّهِ",
        "transliteration": "SubhanAllah",
        "translation": "Glory be to Allah.",
        "repetitions": 33,
        "source": "Bukhari 5361; Muslim 2727",
        "virtue": "Part of the bedtime tasbih taught to Fatimah رضي الله عنها"
      },
      {
        "id": "sleep_004",
        "order": 4,
        "arabic": "الْحَمْدُ لِلَّهِ",
        "transliteration": "Alhamdulillah",
        "translation": "Praise be to Allah.",
        "repetitions": 33,
        "source": "Bukhari 5361; Muslim 2727",
        "virtue": "Part of the bedtime tasbih"
      },
      {
        "id": "sleep_005",
        "order": 5,
        "arabic": "اللَّهُ أَكْبَرُ",
        "transliteration": "Allahu Akbar",
        "translation": "Allah is the Greatest.",
        "repetitions": 34,
        "source": "Bukhari 5361; Muslim 2727",
        "virtue": "Part of the bedtime tasbih"
      },
      {
        "id": "sleep_006",
        "order": 6,
        "arabic": "آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ...",
        "transliteration": "Amanar-rasulu bima unzila ilayhi min rabbihi wal-mu'minun...",
        "translation": "The last two verses of Surah Al-Baqarah (2:285–286). Recite them in full before sleeping.",
        "repetitions": 1,
        "source": "Bukhari 5009; Muslim 807",
        "virtue": "The last two verses of Al-Baqarah are sufficient for the one who recites them at night"
      },
      {
        "id": "sleep_007",
        "order": 7,
        "arabic": "اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ",
        "transliteration": "Allahumma aslamtu nafsi ilayk, wa fawwadtu amri ilayk, wa wajjahtu wajhi ilayk, wa alja'tu zahri ilayk, raghbatan wa rahbatan ilayk, la malja'a wa la manja minka illa ilayk, amantu bikitabikal-ladhi anzalt, wa binabiyyikal-ladhi arsalt",
        "translation": "O Allah, I submit myself to You, entrust my affairs to You, turn my face to You, and rely completely upon You, in hope and fear of You. There is no refuge and no escape from You except to You. I believe in Your Book which You revealed and Your Prophet whom You sent.",
        "repetitions": 1,
        "source": "Bukhari 247; Muslim 2710",
        "virtue": "Make it among the last words before sleeping"
      }
    ]
  },
  {
    "id": "waking",
    "name": "Upon Waking Up",
    "arabic_name": "أذكار الاستيقاظ",
    "description": "Remembrance when waking from sleep",
    "icon": "sun",
    "items": [
      {
        "id": "waking_001",
        "order": 1,
        "arabic": "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
        "transliteration": "Alhamdu lillahil-ladhi ahyana bada ma amatana wa ilayhin-nushur",
        "translation": "Praise is to Allah Who gave us life after He caused us to die, and to Him is the resurrection.",
        "repetitions": 1,
        "source": "Bukhari 6312",
        "virtue": null
      },
      {
        "id": "waking_002",
        "order": 2,
        "arabic": "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
        "transliteration": "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu, wa huwa ala kulli shay'in qadir. SubhanAllah, walhamdulillah, wa la ilaha illallah, wallahu Akbar, wa la hawla wa la quwwata illa billah",
        "translation": "None has the right to be worshipped except Allah alone, without partner. His is the dominion and His is the praise, and He is able to do all things. Glory be to Allah, praise be to Allah, none has the right to be worshipped except Allah, Allah is the Greatest, and there is no power and no strength except with Allah.",
        "repetitions": 1,
        "source": "Bukhari 1154",
        "virtue": "A remembrance for one who wakes at night"
      },
      {
        "id": "waking_003",
        "order": 3,
        "arabic": "الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي فِي جَسَدِي، وَرَدَّ عَلَيَّ رُوحِي، وَأَذِنَ لِي بِذِكْرِهِ",
        "transliteration": "Alhamdu lillahil-ladhi afani fi jasadi, wa radda alayya ruhi, wa adhina li bidhikrih",
        "translation": "Praise is to Allah Who gave health to my body, returned my soul to me, and allowed me to remember Him.",
        "repetitions": 1,
        "source": "Tirmidhi 3401",
        "virtue": null
      }
    ]
  },
  {
    "id": "protection",
    "name": "Protection Adhkar",
    "arabic_name": "أذكار الحفظ والتحصين",
    "description": "Remembrance for protection, reliance, and safety",
    "icon": "shield",
    "items": [
      {
        "id": "protection_001",
        "order": 1,
        "arabic": "قُلْ هُوَ اللَّهُ أَحَدٌ",
        "transliteration": "Qul huwa Allahu ahad",
        "translation": "Surah Al-Ikhlas (112). Recite the full surah.",
        "repetitions": 3,
        "source": "Abu Dawud 5082; Tirmidhi 3575",
        "virtue": "Recited morning and evening with the Mu'awwidhat"
      },
      {
        "id": "protection_002",
        "order": 2,
        "arabic": "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
        "transliteration": "Qul audhu bi Rabbil-falaq",
        "translation": "Surah Al-Falaq (113). Recite the full surah.",
        "repetitions": 3,
        "source": "Abu Dawud 5082; Tirmidhi 3575",
        "virtue": "Protection morning and evening"
      },
      {
        "id": "protection_003",
        "order": 3,
        "arabic": "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
        "transliteration": "Qul audhu bi Rabbin-nas",
        "translation": "Surah An-Nas (114). Recite the full surah.",
        "repetitions": 3,
        "source": "Abu Dawud 5082; Tirmidhi 3575",
        "virtue": "Protection morning and evening"
      },
      {
        "id": "protection_004",
        "order": 4,
        "arabic": "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ",
        "transliteration": "Allahumma inni audhu bika minal-hammi wal-hazan, wa audhu bika minal-ajzi wal-kasal, wa audhu bika minal-jubni wal-bukhl, wa audhu bika min ghalabatid-dayni wa qahrir-rijal",
        "translation": "O Allah, I seek refuge in You from anxiety and grief, from inability and laziness, from cowardice and miserliness, and from being overcome by debt and overpowered by people.",
        "repetitions": 1,
        "source": "Bukhari 6369",
        "virtue": "Protection from worry, debt, and weakness"
      },
      {
        "id": "protection_005",
        "order": 5,
        "arabic": "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْبُخْلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ، وَأَعُوذُ بِكَ أَنْ أُرَدَّ إِلَى أَرْذَلِ الْعُمُرِ، وَأَعُوذُ بِكَ مِنْ فِتْنَةِ الدُّنْيَا، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ",
        "transliteration": "Allahumma inni audhu bika minal-bukhl, wa audhu bika minal-jubn, wa audhu bika an uradda ila ardhalil-umur, wa audhu bika min fitnatid-dunya, wa audhu bika min adhabil-qabr",
        "translation": "O Allah, I seek refuge in You from miserliness, cowardice, being returned to feeble old age, the trial of this world, and the punishment of the grave.",
        "repetitions": 1,
        "source": "Bukhari 6365",
        "virtue": null
      },
      {
        "id": "protection_006",
        "order": 6,
        "arabic": "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ زَوَالِ نِعْمَتِكَ، وَتَحَوُّلِ عَافِيَتِكَ، وَفُجَاءَةِ نِقْمَتِكَ، وَجَمِيعِ سَخَطِكَ",
        "transliteration": "Allahumma inni audhu bika min zawali nimatik, wa tahawwuli afiyatik, wa fuja'ati niqmatik, wa jami'i sakhatik",
        "translation": "O Allah, I seek refuge in You from the removal of Your blessing, the change of Your protection, the suddenness of Your punishment, and all that displeases You.",
        "repetitions": 1,
        "source": "Muslim 2739",
        "virtue": "Seeking protection from loss of blessings"
      }
    ]
  },
  {
    "id": "forgiveness",
    "name": "Forgiveness & Repentance",
    "arabic_name": "الاستغفار والتوبة",
    "description": "Daily istighfar, repentance, and mercy duas",
    "icon": "heart",
    "items": [
      {
        "id": "forgiveness_001",
        "order": 1,
        "arabic": "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
        "transliteration": "Astaghfirullaha wa atubu ilayh",
        "translation": "I seek forgiveness from Allah and repent to Him.",
        "repetitions": 100,
        "source": "Bukhari 6307; Muslim 2702",
        "virtue": "The Prophet ﷺ frequently sought forgiveness"
      },
      {
        "id": "forgiveness_002",
        "order": 2,
        "arabic": "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ، إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
        "transliteration": "Rabbighfir li wa tub alayya, innaka Antat-Tawwabur-Rahim",
        "translation": "My Lord, forgive me and accept my repentance. Indeed, You are the Accepter of repentance, the Most Merciful.",
        "repetitions": 100,
        "source": "Abu Dawud 1516; Tirmidhi 3434",
        "virtue": "A repeated repentance dua"
      },
      {
        "id": "forgiveness_003",
        "order": 3,
        "arabic": "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
        "transliteration": "SubhanAllahi wa bihamdih, astaghfirullaha wa atubu ilayh",
        "translation": "Glory is to Allah and praise is to Him. I seek forgiveness from Allah and repent to Him.",
        "repetitions": 1,
        "source": "Bukhari 4967; Muslim 484",
        "virtue": "A remembrance from the end of the Prophet's ﷺ life"
      },
      {
        "id": "forgiveness_004",
        "order": 4,
        "arabic": "اللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ، دِقَّهُ وَجِلَّهُ، وَأَوَّلَهُ وَآخِرَهُ، وَعَلَانِيَتَهُ وَسِرَّهُ",
        "transliteration": "Allahummaghfir li dhanbi kullah, diqqahu wa jillah, wa awwalahu wa akhirah, wa alaniyatahu wa sirrah",
        "translation": "O Allah, forgive all my sins: the small and the great, the first and the last, the public and the private.",
        "repetitions": 1,
        "source": "Muslim 483",
        "virtue": "Comprehensive forgiveness dua"
      },
      {
        "id": "forgiveness_005",
        "order": 5,
        "arabic": "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
        "transliteration": "Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal-khasirin",
        "translation": "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.",
        "repetitions": 1,
        "source": "Quran 7:23",
        "virtue": "The repentance dua of Adam and Hawwa عليهما السلام"
      },
      {
        "id": "forgiveness_006",
        "order": 6,
        "arabic": "رَبِّ اغْفِرْ وَارْحَمْ وَأَنتَ خَيْرُ الرَّاحِمِينَ",
        "transliteration": "Rabbighfir warham wa Anta khayrur-rahimin",
        "translation": "My Lord, forgive and have mercy, and You are the best of the merciful.",
        "repetitions": 1,
        "source": "Quran 23:118",
        "virtue": "A concise Quranic supplication"
      }
    ]
  },
  {
    "id": "daily_tasbih",
    "name": "Daily Tasbih",
    "arabic_name": "التسبيح اليومي",
    "description": "Short daily remembrances with great reward",
    "icon": "sun",
    "items": [
      {
        "id": "tasbih_001",
        "order": 1,
        "arabic": "سُبْحَانَ اللَّهِ",
        "transliteration": "SubhanAllah",
        "translation": "Glory be to Allah.",
        "repetitions": 33,
        "source": "General dhikr",
        "virtue": null
      },
      {
        "id": "tasbih_002",
        "order": 2,
        "arabic": "الْحَمْدُ لِلَّهِ",
        "transliteration": "Alhamdulillah",
        "translation": "Praise be to Allah.",
        "repetitions": 33,
        "source": "General dhikr",
        "virtue": null
      },
      {
        "id": "tasbih_003",
        "order": 3,
        "arabic": "اللَّهُ أَكْبَرُ",
        "transliteration": "Allahu Akbar",
        "translation": "Allah is the Greatest.",
        "repetitions": 34,
        "source": "General dhikr",
        "virtue": null
      },
      {
        "id": "tasbih_004",
        "order": 4,
        "arabic": "لَا إِلَهَ إِلَّا اللَّهُ",
        "transliteration": "La ilaha illallah",
        "translation": "None has the right to be worshipped except Allah.",
        "repetitions": 100,
        "source": "General dhikr",
        "virtue": "The best remembrance is La ilaha illallah"
      },
      {
        "id": "tasbih_005",
        "order": 5,
        "arabic": "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
        "transliteration": "La hawla wa la quwwata illa billah",
        "translation": "There is no power and no strength except with Allah.",
        "repetitions": 100,
        "source": "Bukhari 6384; Muslim 2704",
        "virtue": "A treasure from the treasures of Paradise"
      },
      {
        "id": "tasbih_006",
        "order": 6,
        "arabic": "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
        "transliteration": "SubhanAllahi wa bihamdih, SubhanAllahil-Adhim",
        "translation": "Glory is to Allah and praise is to Him. Glory is to Allah, the Magnificent.",
        "repetitions": 100,
        "source": "Bukhari 6682; Muslim 2694",
        "virtue": "Two phrases beloved to the Most Merciful"
      }
    ]
  }
];

export const DUAS_LIST: DuaItem[] = [
  {
    "id": "dua_eating_before",
    "category": "eating",
    "title": "Before Eating",
    "arabic": "بِسْمِ اللَّهِ",
    "transliteration": "Bismillah",
    "translation": "In the name of Allah.",
    "source": "Abu Dawud 3767",
    "icon": "utensils"
  },
  {
    "id": "dua_eating_forget",
    "category": "eating",
    "title": "If You Forget to Say Bismillah",
    "arabic": "بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ",
    "transliteration": "Bismillahi fi awwalihi wa akhirih",
    "translation": "In the name of Allah at its beginning and its end.",
    "source": "Abu Dawud 3767; Tirmidhi 1858",
    "icon": "utensils"
  },
  {
    "id": "dua_eating_after",
    "category": "eating",
    "title": "After Eating",
    "arabic": "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
    "transliteration": "Alhamdu lillahil-ladhi atamani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
    "translation": "Praise is to Allah Who fed me this and provided it for me without any power or might from me.",
    "source": "Tirmidhi 3458",
    "icon": "utensils"
  },
  {
    "id": "dua_enter_home",
    "category": "home",
    "title": "Entering the Home",
    "arabic": "بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
    "transliteration": "Bismillahi walajna, wa bismillahi kharajna, wa ala Allahi rabbina tawakkalna",
    "translation": "In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we rely.",
    "source": "Abu Dawud 5096",
    "icon": "home"
  },
  {
    "id": "dua_leave_home",
    "category": "home",
    "title": "Leaving the Home",
    "arabic": "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    "transliteration": "Bismillah, tawakkaltu ala Allah, wa la hawla wa la quwwata illa billah",
    "translation": "In the name of Allah, I rely upon Allah, and there is no power and no strength except with Allah.",
    "source": "Abu Dawud 5095; Tirmidhi 3426",
    "icon": "home"
  },
  {
    "id": "dua_enter_masjid",
    "category": "masjid",
    "title": "Entering the Masjid",
    "arabic": "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    "transliteration": "Allahummaftah li abwaba rahmatik",
    "translation": "O Allah, open for me the gates of Your mercy.",
    "source": "Muslim 713",
    "icon": "building"
  },
  {
    "id": "dua_leave_masjid",
    "category": "masjid",
    "title": "Leaving the Masjid",
    "arabic": "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    "transliteration": "Allahumma inni as'aluka min fadlik",
    "translation": "O Allah, I ask You from Your bounty.",
    "source": "Muslim 713",
    "icon": "building"
  },
  {
    "id": "dua_travel",
    "category": "travel",
    "title": "Travel Dua",
    "arabic": "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ",
    "transliteration": "Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila Rabbina lamunqalibun",
    "translation": "Glory is to the One Who has subjected this to us, and we could never have done it by ourselves. Indeed, to our Lord we will return.",
    "source": "Quran 43:13-14; Muslim 1342",
    "icon": "plane"
  },
  {
    "id": "dua_travel_long",
    "category": "travel",
    "title": "Safety and Goodness During Travel",
    "arabic": "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى",
    "transliteration": "Allahumma inna nas'aluka fi safarina hadhal-birra wat-taqwa, wa minal-amali ma tarda",
    "translation": "O Allah, we ask You for righteousness and piety in this journey of ours, and for deeds that please You.",
    "source": "Muslim 1342",
    "icon": "plane"
  },
  {
    "id": "dua_return_travel",
    "category": "travel",
    "title": "Returning from Travel",
    "arabic": "آيِبُونَ، تَائِبُونَ، عَابِدُونَ، لِرَبِّنَا حَامِدُونَ",
    "transliteration": "Ayibun, ta'ibun, abidun, li Rabbina hamidun",
    "translation": "We return, repenting, worshipping, and praising our Lord.",
    "source": "Bukhari 1797; Muslim 1344",
    "icon": "plane"
  },
  {
    "id": "dua_distress",
    "category": "distress",
    "title": "In Times of Distress",
    "arabic": "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ",
    "transliteration": "La ilaha illallahul-Adhimul-Halim, la ilaha illallahu Rabbul-Arshil-Adhim, la ilaha illallahu Rabbus-samawati wa Rabbul-ardi wa Rabbul-Arshil-Karim",
    "translation": "None has the right to be worshipped except Allah, the Magnificent, the Forbearing. None has the right to be worshipped except Allah, Lord of the Mighty Throne. None has the right to be worshipped except Allah, Lord of the heavens, Lord of the earth, and Lord of the Noble Throne.",
    "source": "Bukhari 6346; Muslim 2730",
    "icon": "alert-circle"
  },
  {
    "id": "dua_worry",
    "category": "distress",
    "title": "Against Worry, Grief, Debt, and Weakness",
    "arabic": "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْجُبْنِ وَالْبُخْلِ، وَغَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ",
    "transliteration": "Allahumma inni audhu bika minal-hammi wal-hazan, wal-ajzi wal-kasal, wal-jubni wal-bukhl, wa ghalabatid-dayni wa qahrir-rijal",
    "translation": "O Allah, I seek refuge in You from anxiety and grief, inability and laziness, cowardice and miserliness, being overcome by debt and overpowered by people.",
    "source": "Bukhari 6369",
    "icon": "alert-circle"
  },
  {
    "id": "dua_forgiveness_master",
    "category": "forgiveness",
    "title": "Master Supplication for Forgiveness",
    "arabic": "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    "transliteration": "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana abduka, wa ana ala ahdika wa wadika mastatatu, audhu bika min sharri ma sanatu, abuu laka binimatika alayya, wa abuu bidhanbi, faghfir li fa innahu la yaghfirudh-dhunuba illa anta",
    "translation": "O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant. I keep Your covenant as much as I can. I seek refuge in You from the evil I have done. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me, for none forgives sins except You.",
    "source": "Bukhari 6306",
    "icon": "shield"
  },
  {
    "id": "dua_parents",
    "category": "family",
    "title": "Dua for Parents",
    "arabic": "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    "transliteration": "Rabbi irhamhuma kama rabbayani saghira",
    "translation": "My Lord, have mercy upon them as they raised me when I was small.",
    "source": "Quran 17:24",
    "icon": "users"
  },
  {
    "id": "dua_family",
    "category": "family",
    "title": "For Righteous Family",
    "arabic": "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    "transliteration": "Rabbana hab lana min azwajina wa dhurriyyatina qurrata ayunin wajalna lil-muttaqina imama",
    "translation": "Our Lord, grant us from our spouses and offspring comfort to our eyes and make us an example for the righteous.",
    "source": "Quran 25:74",
    "icon": "users"
  },
  {
    "id": "dua_believers",
    "category": "family",
    "title": "Forgiveness for Parents and Believers",
    "arabic": "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
    "transliteration": "Rabbana ghfir li wa liwalidayya wa lil-mu'minina yawma yaqumul-hisab",
    "translation": "Our Lord, forgive me and my parents and the believers on the Day the account is established.",
    "source": "Quran 14:41",
    "icon": "users"
  },
  {
    "id": "dua_rizq",
    "category": "rizq",
    "title": "Beneficial Knowledge, Good Provision, Accepted Deeds",
    "arabic": "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا",
    "transliteration": "Allahumma inni as'aluka ilman nafian, wa rizqan tayyiban, wa amalan mutaqabbalan",
    "translation": "O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.",
    "source": "Ibn Majah 925",
    "icon": "sun"
  },
  {
    "id": "dua_knowledge",
    "category": "knowledge",
    "title": "Increase Me in Knowledge",
    "arabic": "رَّبِّ زِدْنِي عِلْمًا",
    "transliteration": "Rabbi zidni ilma",
    "translation": "My Lord, increase me in knowledge.",
    "source": "Quran 20:114",
    "icon": "sun"
  },
  {
    "id": "dua_guidance",
    "category": "guidance",
    "title": "Guidance and Mercy",
    "arabic": "رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا",
    "transliteration": "Rabbana atina min ladunka rahmatan wa hayyi' lana min amrina rashada",
    "translation": "Our Lord, grant us mercy from Yourself and prepare for us right guidance in our affair.",
    "source": "Quran 18:10",
    "icon": "shield"
  },
  {
    "id": "dua_dunya_akhirah",
    "category": "guidance",
    "title": "Good in This World and the Hereafter",
    "arabic": "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    "transliteration": "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar",
    "translation": "Our Lord, give us good in this world and good in the Hereafter and protect us from the punishment of the Fire.",
    "source": "Quran 2:201",
    "icon": "heart"
  },
  {
    "id": "dua_mercy_after_guidance",
    "category": "guidance",
    "title": "Do Not Let Our Hearts Deviate",
    "arabic": "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً إِنَّكَ أَنتَ الْوَهَّابُ",
    "transliteration": "Rabbana la tuzigh qulubana bada idh hadaytana wa hab lana min ladunka rahmah innaka Antal-Wahhab",
    "translation": "Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself. Indeed, You are the Bestower.",
    "source": "Quran 3:8",
    "icon": "heart"
  },
  {
    "id": "dua_patience",
    "category": "guidance",
    "title": "Patience and Firmness",
    "arabic": "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا",
    "transliteration": "Rabbana afrigh alayna sabran wa thabbit aqdamana",
    "translation": "Our Lord, pour patience upon us and make our feet firm.",
    "source": "Quran 2:250",
    "icon": "shield"
  },
  {
    "id": "dua_sick",
    "category": "health",
    "title": "Dua for the Sick",
    "arabic": "أَذْهِبِ الْبَأْسَ رَبَّ النَّاسِ، اشْفِ وَأَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا",
    "transliteration": "Adhhibil-ba'sa Rabban-nas, ishfi wa Antash-Shafi, la shifa'a illa shifa'uk, shifa'an la yughadiru saqama",
    "translation": "Remove the harm, Lord of mankind. Heal, for You are the Healer. There is no healing except Your healing, a healing that leaves no illness.",
    "source": "Bukhari 5743; Muslim 2191",
    "icon": "heart"
  },
  {
    "id": "dua_pain",
    "category": "health",
    "title": "When Feeling Pain",
    "arabic": "بِسْمِ اللَّهِ، أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ",
    "transliteration": "Bismillah. Audhu billahi wa qudratihi min sharri ma ajidu wa uhadhir",
    "translation": "In the name of Allah. I seek refuge in Allah and His power from the evil of what I feel and fear.",
    "source": "Muslim 2202",
    "icon": "heart"
  },
  {
    "id": "dua_clothes_new",
    "category": "daily",
    "title": "Wearing New Clothes",
    "arabic": "اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ كَسَوْتَنِيهِ، أَسْأَلُكَ مِنْ خَيْرِهِ وَخَيْرِ مَا صُنِعَ لَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّهِ وَشَرِّ مَا صُنِعَ لَهُ",
    "transliteration": "Allahumma lakal-hamd, anta kasawtanih, as'aluka min khayrihi wa khayri ma sunia lah, wa audhu bika min sharrihi wa sharri ma sunia lah",
    "translation": "O Allah, to You belongs praise; You clothed me with it. I ask You for its good and the good for which it was made, and I seek refuge in You from its evil and the evil for which it was made.",
    "source": "Abu Dawud 4020; Tirmidhi 1767",
    "icon": "heart"
  },
  {
    "id": "dua_toilet_enter",
    "category": "daily",
    "title": "Entering the Toilet",
    "arabic": "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ",
    "transliteration": "Allahumma inni audhu bika minal-khubuthi wal-khaba'ith",
    "translation": "O Allah, I seek refuge in You from male and female devils.",
    "source": "Bukhari 142; Muslim 375",
    "icon": "shield"
  },
  {
    "id": "dua_toilet_exit",
    "category": "daily",
    "title": "Leaving the Toilet",
    "arabic": "غُفْرَانَكَ",
    "transliteration": "Ghufranak",
    "translation": "I seek Your forgiveness.",
    "source": "Abu Dawud 30; Tirmidhi 7",
    "icon": "shield"
  },
  {
    "id": "dua_sneeze",
    "category": "daily",
    "title": "When Sneezing",
    "arabic": "الْحَمْدُ لِلَّهِ",
    "transliteration": "Alhamdulillah",
    "translation": "Praise be to Allah.",
    "source": "Bukhari 6224",
    "icon": "heart"
  },
  {
    "id": "dua_rain",
    "category": "nature",
    "title": "When Rain Falls",
    "arabic": "اللَّهُمَّ صَيِّبًا نَافِعًا",
    "transliteration": "Allahumma sayyiban nafia",
    "translation": "O Allah, make it beneficial rain.",
    "source": "Bukhari 1032",
    "icon": "sun"
  },
  {
    "id": "dua_wind",
    "category": "nature",
    "title": "When the Wind Blows",
    "arabic": "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَهَا وَأَعُوذُ بِكَ مِنْ شَرِّهَا",
    "transliteration": "Allahumma inni as'aluka khayraha wa audhu bika min sharriha",
    "translation": "O Allah, I ask You for its good and seek refuge in You from its evil.",
    "source": "Abu Dawud 5097; Ibn Majah 3727",
    "icon": "shield"
  },
  {
    "id": "dua_moon_new",
    "category": "nature",
    "title": "Seeing the New Moon",
    "arabic": "اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْيُمْنِ وَالْإِيمَانِ، وَالسَّلَامَةِ وَالْإِسْلَامِ، رَبِّي وَرَبُّكَ اللَّهُ",
    "transliteration": "Allahumma ahillahu alayna bil-yumni wal-iman, was-salamati wal-Islam, Rabbi wa Rabbukallah",
    "translation": "O Allah, bring it over us with blessing and faith, safety and Islam. My Lord and your Lord is Allah.",
    "source": "Tirmidhi 3451",
    "icon": "moon"
  },
  {
    "id": "dua_gratitude",
    "category": "gratitude",
    "title": "When Pleased by Good News",
    "arabic": "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ",
    "transliteration": "Alhamdu lillahil-ladhi bini'matihi tatimmus-salihat",
    "translation": "Praise is to Allah by Whose blessing good things are completed.",
    "source": "Ibn Majah 3803",
    "icon": "heart"
  },
  {
    "id": "dua_bad_news",
    "category": "gratitude",
    "title": "When Facing Difficulty",
    "arabic": "الْحَمْدُ لِلَّهِ عَلَى كُلِّ حَالٍ",
    "transliteration": "Alhamdu lillahi ala kulli hal",
    "translation": "Praise is to Allah in every situation.",
    "source": "Ibn Majah 3803",
    "icon": "heart"
  },
  {
    "id": "dua_tawakkul",
    "category": "guidance",
    "title": "Reliance on Allah",
    "arabic": "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    "transliteration": "Hasbunallahu wa nimal-wakil",
    "translation": "Allah is sufficient for us, and He is the best disposer of affairs.",
    "source": "Quran 3:173",
    "icon": "shield"
  },
  {
    "id": "dua_nuh",
    "category": "forgiveness",
    "title": "Forgiveness for Me and My Household",
    "arabic": "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِمَن دَخَلَ بَيْتِيَ مُؤْمِنًا وَلِلْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ",
    "transliteration": "Rabbighfir li wa liwalidayya wa liman dakhala baytiya mu'minan wa lil-mu'minina wal-mu'minat",
    "translation": "My Lord, forgive me, my parents, whoever enters my house as a believer, and the believing men and believing women.",
    "source": "Quran 71:28",
    "icon": "home"
  }
];
