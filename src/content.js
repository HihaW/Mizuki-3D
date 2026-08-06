// ★ ALL page copy lives here. Replace the // VERIFY placeholders with your final text.
// Canonical base facts have been verified against official/sekaipedia sources.

export const content = {
  hero: {
    jp: '暁山<span class="accent">瑞希</span>',
    en: 'Mizuki Akiyama',
    sub: '25-ji, Nightcord de. · the animator'
    // VERIFY: replace sub with your chosen tagline if desired
  },

  profile: {
    headingEn: 'The one who loves everything cute…',
    // VERIFY: birthday Aug 27 · height 165cm (not 162) · Kamiyama High 2-B
    stats: [
      { label: 'Name', value: 'Akiyama Mizuki', jp: '暁山 瑞希' },
      { label: 'Alias', value: 'Amia' },
      { label: 'Birthday', value: 'Aug 27' },
      { label: 'Height', value: '165 cm' },
      { label: 'School', value: 'Kamiyama High · 2-B' },
      { label: 'Unit', value: '25-ji, Nightcord de.' },
      { label: 'Image color', value: '#DDAACC' },
      { label: 'VA', value: 'Satou Hinata' }
    ],
    bars: [
      { label: 'Cuteness', value: 95 },
      { label: 'Video editing', value: 92 },
      { label: 'Friendship', value: 88 },
      { label: 'Secret-keeping', value: 99 },
      { label: 'Fashion sense', value: 94 }
      // VERIFY: stat labels/values are stylized for the page, tune freely
    ]
  },

  story: {
    headingEn: 'A story told at 25:00',
    // VERIFY: default lore draft — replace with your preferred lore summary
    loreJp:
      '25時、ナイトコードで。の映像編集者。偶然ネットで見つけた奏の曲に恋をし、' +
      'その曲の動画を作ったことがきっかけでグループに入る。「可愛い」ものが大好きで、' +
      'みんなには言えない大きな秘密を抱えている。',
    loreEn:
      "25-ji, Nightcord de.'s animator. Falling in love with one of Kanade's songs found at random online, " +
      'Mizuki created a music video for it, which caught Kanade\u2019s attention — that\u2019s how they joined the group. ' +
      'Obsessed with anything cute, yet carrying a big secret they keep from everyone else.'
  },

  // VERIFY: song titles below are placeholders. ID-SMILE.mp3 is a real 25-ji track you supplied.
  tracks: [
    { title: 'ID, Smile', jp: 'アイディスマイル', src: `${import.meta.env.BASE_URL}audio/id-smile.mp3` }
  ],

  // VERIFY: quotes below are canonical; add more or replace (do not fabricate lines).
  quotes: [
    "I welcome anything as long as it's cute♪",
    "I'm still me, but is that ok?"
  ],

  cta: {
    heading: 'Follow the animation studio under 25:00.',
    primary: 'Listen to ID, Smile',
    secondary: 'Back to top'
  }
};