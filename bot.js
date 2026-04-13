const TelegramBot = require("node-telegram-bot-api");
const https = require("https");
const http = require("http");

// ─── ENV ─────────────────────────────────────────────────────────────────────
const TOKEN       = process.env.BOT_TOKEN;
const CLAUDE_KEY  = process.env.CLAUDE_API_KEY;
const ADMIN_ID    = process.env.ADMIN_CHAT_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// ─── CLINIC CONFIG ────────────────────────────────────────────────────────────
const CLINIC = {
  name:     "Salomatlik Klinikasi",
  address:  "Toshkent, Yunusobod tumani, 5-mavze, 12-uy",
  phone:    "+998 71 123 45 67",
  whatsapp: "+998 90 123 45 67",
  mapLat:   41.2995,
  mapLng:   69.2401,
  established: "2010",
  workingHours: {
    "Dushanba – Juma": "08:00 – 20:00",
    "Shanba":          "09:00 – 17:00",
    "Yakshanba":       "Dam olish kuni",
  },
  doctors: [
    {
      id: 1, name: "Dr. Aziz Karimov", spec: "Terapevt", exp: "15 yil",
      price: "80,000 so'm", telegram_id: null,
      bio: "Toshkent Tibbiyot Akademiyasini 2008-yilda tamomlagan. Germaniyada malaka oshirgan. Yurak-qon tomir va nafas yo'li kasalliklarida ixtisoslashgan.",
      schedule: "Du-Ju: 09:00-17:00, Sha: 09:00-13:00",
      treats: ["gripp", "shamollash", "bronxit", "pnevmoniya", "gipertenziya", "umumiy tekshiruv"],
    },
    {
      id: 2, name: "Dr. Malika Yusupova", spec: "Kardiolog", exp: "12 yil",
      price: "120,000 so'm", telegram_id: null,
      bio: "Yurak kasalliklari bo'yicha oliy malakali mutaxassis. EKG va EXO-KG tekshiruvlarini o'tkazadi. 500+ muvaffaqiyatli bemor.",
      schedule: "Du-Ju: 10:00-18:00",
      treats: ["yurak og'rig'i", "aritmiya", "gipertenziya", "stenokardiya", "yurak yetishmovchiligi", "EKG"],
    },
    {
      id: 3, name: "Dr. Bobur Toshmatov", spec: "Nevropatolog", exp: "10 yil",
      price: "120,000 so'm", telegram_id: null,
      bio: "Asab tizimi kasalliklari mutaxassisi. Bosh og'rig'i, miqren, osteoxondroz davolashda katta tajribaga ega.",
      schedule: "Du-Sha: 09:00-17:00",
      treats: ["bosh og'rig'i", "miqren", "osteoxondroz", "uyqusizlik", "depressiya", "insult", "epilepsiya"],
    },
    {
      id: 4, name: "Dr. Nodira Aliyeva", spec: "Ginekolog", exp: "18 yil",
      price: "100,000 so'm", telegram_id: null,
      bio: "Ayollar salomatligi bo'yicha eng tajribali mutaxassislardan biri. Homiladorlik, tug'ruq va ginekologik kasalliklarni davolaydi.",
      schedule: "Du-Ju: 08:00-16:00, Sha: 08:00-12:00",
      treats: ["homiladorlik", "ginekologik kasalliklar", "oylik bузилиши", "kista", "mioma", "STI"],
    },
    {
      id: 5, name: "Dr. Sardor Xoliqov", spec: "Urolog", exp: "8 yil",
      price: "100,000 so'm", telegram_id: null,
      bio: "Siydik-tanosil tizimi kasalliklari mutaxassisi. Zamonaviy endoskopik usullar bilan davolaydi.",
      schedule: "Du-Sha: 10:00-18:00",
      treats: ["siydik yo'li kasalliklari", "prostatit", "buyrak toshi", "sistit", "potentsiya"],
    },
    {
      id: 6, name: "Dr. Zulfiya Raximova", spec: "Pediatr", exp: "14 yil",
      price: "90,000 so'm", telegram_id: null,
      bio: "Bolalar shifokori, 0-16 yosh. Bolalar kasalliklari va rivojlanishi bo'yicha mutaxassis.",
      schedule: "Du-Sha: 08:00-17:00",
      treats: ["bolalar kasalliklari", "isitma", "yo'tal", "allergiya", "emlash", "rivojlanish"],
    },
    {
      id: 7, name: "Dr. Kamol Mirzayev", spec: "Oftalmolog", exp: "11 yil",
      price: "110,000 so'm", telegram_id: null,
      bio: "Ko'z kasalliklari mutaxassisi. Ko'z bosimi, katarakt, ko'rish buzilishlari davolashda ixtisoslashgan.",
      schedule: "Du-Ju: 09:00-17:00",
      treats: ["ko'z qizarishi", "ko'z og'rig'i", "ko'rish yomonlashishi", "ko'z bosimi", "katarakt", "conjunktivit"],
    },
    {
      id: 8, name: "Dr. Dilnoza Xasanova", spec: "Dermatolog", exp: "9 yil",
      price: "100,000 so'm", telegram_id: null,
      bio: "Teri kasalliklari va kosmetologiya mutaxassisi. Ekzema, psoriaz, akne davolashda tajribali.",
      schedule: "Du-Sha: 10:00-18:00",
      treats: ["ekzema", "psoriaz", "akne", "teri qichishi", "toshmalar", "grибок", "allergik dermatit"],
    },
    {
      id: 9, name: "Dr. Jasur Tursunov", spec: "Ortoped", exp: "13 yil",
      price: "120,000 so'm", telegram_id: null,
      bio: "Suyak va bo'g'im kasalliklari mutaxassisi. Artrit, artroz, umurtqa kasalliklarini davolaydi.",
      schedule: "Du-Ju: 09:00-17:00",
      treats: ["bo'g'im og'rig'i", "bel og'rig'i", "artrit", "artroz", "suyak sinishi", "umurtqa"],
    },
    {
      id: 10, name: "Dr. Maftuna Ergasheva", spec: "Endokrinolog", exp: "10 yil",
      price: "110,000 so'm", telegram_id: null,
      bio: "Gormon va modda almashinuvi kasalliklari mutaxassisi. Diabet, qalqonsimon bez kasalliklari.",
      schedule: "Du-Sha: 09:00-17:00",
      treats: ["diabet", "qalqonsimon bez", "semirish", "hormon buzilishi", "osteoporoz"],
    },
  ],
  services: [
    { name: "Terapevt maslahati",        price: "80,000 so'm"    },
    { name: "Kardiolog maslahati",        price: "120,000 so'm"   },
    { name: "Ginekolog maslahati",        price: "100,000 so'm"   },
    { name: "Pediatr maslahati",          price: "90,000 so'm"    },
    { name: "Oftalmolog maslahati",       price: "110,000 so'm"   },
    { name: "Dermatolog maslahati",       price: "100,000 so'm"   },
    { name: "Nevropatolog maslahati",     price: "120,000 so'm"   },
    { name: "Urolog maslahati",           price: "100,000 so'm"   },
    { name: "Ortoped maslahati",          price: "120,000 so'm"   },
    { name: "Endokrinolog maslahati",     price: "110,000 so'm"   },
    { name: "UZI (qorin bo'shlig'i)",     price: "80,000 so'm"    },
    { name: "UZI (ginekologik)",          price: "90,000 so'm"    },
    { name: "UZI (yurak — EXO-KG)",       price: "120,000 so'm"   },
    { name: "Qon tahlili (umumiy)",       price: "35,000 so'm"    },
    { name: "Qon tahlili (to'liq panel)", price: "150,000 so'm"   },
    { name: "Siydik tahlili",             price: "25,000 so'm"    },
    { name: "Qand (glyukoza) tahlili",    price: "20,000 so'm"    },
    { name: "EKG",                        price: "50,000 so'm"    },
    { name: "MRT",                        price: "350,000 so'm"   },
    { name: "KT (kompyuter tomografiya)", price: "400,000 so'm"   },
    { name: "Rentgen",                    price: "45,000 so'm"    },
    { name: "Massaj (1 seans)",           price: "60,000 so'm"    },
    { name: "Tish tekshiruvi",            price: "50,000 so'm"    },
  ],
};

// ─── KLINIKA BILIMLAR BAZASI (RAG) ───────────────────────────────────────────
const KNOWLEDGE_BASE = `
=== SALOMATLIK KLINIKASI — TO'LIQ MA'LUMOT BAZASI ===

KLINIKA HAQIDA:
- 2010-yildan buyon ishlamoqda, 14 yillik tajriba
- 10 ta mutaxassis shifokor, 30+ tibbiy xizmat
- Zamonaviy MRT, KT, UZI, laboratoriya jihozlari
- Dorixona klinika ichida mavjud
- Bepul maslahat: birinchi tashrif uchun 10% chegirma
- Sug'urta: Uzbekinvest, Gross, Alpha Insurance qabul qilinadi

SHIFOKORLAR HAQIDA BATAFSIL:
- Dr. Aziz Karimov (Terapevt): Germaniyada malaka oshirgan, yurak-qon tomir va nafas kasalliklarida ixtisoslashgan. JADVAL: Du-Ju 09:00-17:00, Sha 09:00-13:00
- Dr. Malika Yusupova (Kardiolog): EKG va EXO-KG mutaxassisi, 500+ bemor. JADVAL: Du-Ju 10:00-18:00
- Dr. Bobur Toshmatov (Nevropatolog): Bosh og'rig'i va miqren bo'yicha ekspert. JADVAL: Du-Sha 09:00-17:00
- Dr. Nodira Aliyeva (Ginekolog): 18 yil tajriba, homiladorlik kuzatuvi. JADVAL: Du-Ju 08:00-16:00
- Dr. Sardor Xoliqov (Urolog): Endoskopik usullar. JADVAL: Du-Sha 10:00-18:00
- Dr. Zulfiya Raximova (Pediatr): 0-16 yosh bolalar. JADVAL: Du-Sha 08:00-17:00
- Dr. Kamol Mirzayev (Oftalmolog): Ko'z bosimi, katarakt. JADVAL: Du-Ju 09:00-17:00
- Dr. Dilnoza Xasanova (Dermatolog): Ekzema, psoriaz, akne. JADVAL: Du-Sha 10:00-18:00
- Dr. Jasur Tursunov (Ortoped): Suyak, bo'g'im, umurtqa. JADVAL: Du-Ju 09:00-17:00
- Dr. Maftuna Ergasheva (Endokrinolog): Diabet, qalqonsimon bez. JADVAL: Du-Sha 09:00-17:00

PROTOKOLLAR VA QOIDALAR:
- Qabulga yozilish: 1-2 kun oldin yozilish tavsiya etiladi
- Kechikish: 15 daqiqadan ko'p kechiksa, navbat keyinga suriladi
- Tahlil natijalari: umumiy qon 2 soat, to'liq panel 1 kun
- MRT/KT natijasi: 2-4 soat
- Bolalar: ota-onasi bilan kelishi shart (16 yoshgacha)
- Homilador ayollar: alohida navbat, ustunlik beriladi

NARXLAR VA CHEGIRMALAR:
- Pensionerlar (65+): barcha xizmatlarga 15% chegirma
- Talabalar: 10% chegirma (talaba guvohnomasi bilan)
- Birinchi tashrif: 10% chegirma
- Kompleks tekshiruv (5+ xizmat): 20% chegirma
- Sug'urta orqali: to'lov sug'urta kompaniyasiga qarab

TEZ-TEZ BERILADIGAN SAVOLLAR:
S: Qon tahlili uchun ro'za tutish kerakmi?
J: Ha, umumiy qon tahlili uchun emas, lekin glyukoza va lipid uchun 8-12 soat ro'za tutish kerak.

S: MRT uchun tayyorgarlik kerakmi?
J: Metall implant, kardiostimulyator bo'lsa oldindan aytish shart. Qorin MRT uchun 4 soat ovqat yeymaslik kerak.

S: Bolani yolg'iz yuborishim mumkinmi?
J: 16 yoshgacha ota-ona yoki vasiy bilan kelish shart.

S: Natijalarni online olsa bo'ladimi?
J: Ha, Telegram orqali yuboriladi. Qabulda so'rang.

S: Kechqurun ham ishlaysizmi?
J: Ha, Du-Ju kuni 20:00 gacha, Shanba 17:00 gacha.

KASALLIKLAR VA SHIFOKORLAR ALOQASI:
- Bosh og'rig'i, miqren → Nevropatolog (Dr. Toshmatov)
- Yurak og'rig'i, bosim → Kardiolog (Dr. Yusupova)
- Ko'z muammolari → Oftalmolog (Dr. Mirzayev)
- Teri muammolari → Dermatolog (Dr. Xasanova)
- Bel, bo'g'im og'rig'i → Ortoped (Dr. Tursunov)
- Qand kasalligi, vazn → Endokrinolog (Dr. Ergasheva)
- Bolalar kasalliklari → Pediatr (Dr. Raximova)
- Ayollar muammolari → Ginekolog (Dr. Aliyeva)
- Siydik muammolari → Urolog (Dr. Xoliqov)
- Shamollash, gripp → Terapevt (Dr. Karimov)
- Umumiy tekshiruv → Terapevt (Dr. Karimov)
`;

// ─── BOT SETUP ───────────────────────────────────────────────────────────────
const bot = WEBHOOK_URL
  ? new TelegramBot(TOKEN)
  : new TelegramBot(TOKEN, { polling: true });

const userState = {};

// ─── AI ──────────────────────────────────────────────────────────────────────
async function askClaude(messages, systemPrompt) {
  if (!CLAUDE_KEY) return null;
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: systemPrompt,
      messages,
    });
    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try {
          const p = JSON.parse(d);
          if (p.error) console.error("Claude error:", JSON.stringify(p.error));
          resolve(p.content?.[0]?.text || null);
        } catch(e) {
          console.error("Parse error:", e.message);
          resolve(null);
        }
      });
    });
    req.on("error", (e) => { console.error("HTTPS error:", e.message); resolve(null); });
    req.write(body);
    req.end();
  });
}

// ─── MENUS ───────────────────────────────────────────────────────────────────
function mainMenu() {
  return {
    reply_markup: {
      keyboard: [
        ["📋 Xizmatlar va narxlar", "🕐 Ish vaqti"],
        ["👨‍⚕️ Shifokorlar",          "📅 Qabulga yozilish"],
        ["📍 Manzil",               "📞 Operator"],
        ["🤖 AI Maslahatchi"],
      ],
      resize_keyboard: true,
    },
  };
}

function cancelMenu() {
  return {
    reply_markup: {
      keyboard: [["❌ Bekor qilish"]],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function send(chatId, text, extra = {}) {
  return bot.sendMessage(chatId, text, { parse_mode: "Markdown", ...extra });
}
function notifyAdmin(text) {
  if (ADMIN_ID) bot.sendMessage(ADMIN_ID, text, { parse_mode: "Markdown" });
}
function notifyDoctor(doctorId, text) {
  const doc = CLINIC.doctors.find(d => d.id === doctorId);
  const target = doc?.telegram_id || ADMIN_ID;
  if (target) bot.sendMessage(target, text, { parse_mode: "Markdown" });
}
function getDoctorsList() {
  return CLINIC.doctors.map((d, i) =>
    `${i+1}. *${d.name}* — ${d.spec} (${d.exp}, ${d.price})`
  ).join("\n");
}

// ─── /start ──────────────────────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  userState[msg.chat.id] = null;
  const name = msg.from.first_name || "Hurmatli mehmon";
  send(msg.chat.id,
    `Salom, *${name}*! 👋\n\n` +
    `🏥 *${CLINIC.name}*ga xush kelibsiz!\n` +
    `_(${CLINIC.established}-yildan beri xizmatda)_\n\n` +
    `Quyidagilardan foydalanishingiz mumkin:\n\n` +
    `📋 Xizmatlar va narxlar\n` +
    `👨‍⚕️ Shifokorlar ro'yxati\n` +
    `🕐 Ish vaqti jadvali\n` +
    `📅 Qabulga yozilish\n` +
    `📍 Klinika manzili\n` +
    `📞 Operator bilan bog'lanish\n` +
    `🤖 *AI Maslahatchi* — belgilaringizni aytib, professional tashxis oling\n\n` +
    `Tugmani tanlang 👇`,
    mainMenu()
  );
});

// ─── XIZMATLAR ───────────────────────────────────────────────────────────────
bot.onText(/📋 Xizmatlar/, (msg) => {
  let text = `📋 *${CLINIC.name} — Xizmatlar va narxlar*\n\n`;
  CLINIC.services.forEach(s => { text += `• ${s.name} — 💰 ${s.price}\n`; });
  text += `\n🎁 *Chegirmalar:*\n`;
  text += `• Pensionerlar (65+): 15% chegirma\n`;
  text += `• Talabalar: 10% chegirma\n`;
  text += `• Birinchi tashrif: 10% chegirma\n`;
  text += `\n📞 Aniq narx: ${CLINIC.phone}`;
  send(msg.chat.id, text, mainMenu());
});

// ─── ISH VAQTI ───────────────────────────────────────────────────────────────
bot.onText(/🕐 Ish vaqti/, (msg) => {
  let text = `🕐 *Ish vaqti jadvali*\n\n`;
  for (const [day, time] of Object.entries(CLINIC.workingHours)) {
    text += `📅 *${day}:* ${time}\n`;
  }
  text += `\n👨‍⚕️ *Shifokorlar jadvali:*\n`;
  CLINIC.doctors.forEach(d => {
    text += `• ${d.spec}: ${d.schedule}\n`;
  });
  text += `\n📞 ${CLINIC.phone}`;
  send(msg.chat.id, text, mainMenu());
});

// ─── SHIFOKORLAR ─────────────────────────────────────────────────────────────
bot.onText(/👨‍⚕️ Shifokorlar/, (msg) => {
  let text = `👨‍⚕️ *Bizning shifokorlar*\n\n`;
  CLINIC.doctors.forEach(d => {
    text += `🩺 *${d.name}*\n`;
    text += `   ${d.spec} | ${d.exp} tajriba | ${d.price}\n`;
    text += `   📅 ${d.schedule}\n`;
    text += `   _${d.bio}_\n\n`;
  });
  send(msg.chat.id, text, mainMenu());
});

// ─── MANZIL ──────────────────────────────────────────────────────────────────
bot.onText(/📍 Manzil/, (msg) => {
  send(msg.chat.id, `📍 *Manzil:*\n${CLINIC.address}\n\n🚌 Mo'ljal: Yunusobod 5-mavze`);
  bot.sendLocation(msg.chat.id, CLINIC.mapLat, CLINIC.mapLng);
  send(msg.chat.id, "Yuqoridagi xaritada ko'ring 👆", mainMenu());
});

// ─── OPERATOR ────────────────────────────────────────────────────────────────
bot.onText(/📞 Operator/, (msg) => {
  send(msg.chat.id,
    `📞 *Operator bilan bog'lanish*\n\n` +
    `🏥 ${CLINIC.name}\n` +
    `📍 ${CLINIC.address}\n` +
    `📞 Telefon: ${CLINIC.phone}\n` +
    `💬 WhatsApp: ${CLINIC.whatsapp}\n\n` +
    `⏰ Qo'ng'iroq qabul vaqti:\n` +
    `Du-Ju: 08:00-20:00\n` +
    `Shanba: 09:00-17:00`,
    mainMenu()
  );
});

// ─── AI MASLAHATCHI ───────────────────────────────────────────────────────────
bot.onText(/🤖 AI Maslahatchi/, (msg) => {
  const chatId = msg.chat.id;
  if (!CLAUDE_KEY) {
    send(chatId, `AI Maslahatchi hozircha mavjud emas.\nQo'ng'iroq qiling: ${CLINIC.phone}`, mainMenu());
    return;
  }
  userState[chatId] = { step: "ai_start", history: [], questionCount: 0 };
  send(chatId,
    `🤖 *AI Maslahatchi*\n\n` +
    `Salom! Men sizga tibbiy maslahat beraman.\n\n` +
    `*Qanday muammo bor?* Belgilaringizni batafsil yozing.\n\n` +
    `_Masalan:_\n` +
    `_• "Ko'zim qizargan va achishyapti, 2 kundan beri"_\n` +
    `_• "Boshim og'riyapti va ko'nglim ayniyapti"_\n` +
    `_• "Bel og'rig'im bor, egilolmayapman"_`,
    cancelMenu()
  );
});

// ─── QABULGA YOZILISH ─────────────────────────────────────────────────────────
bot.onText(/📅 Qabulga yozilish/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: "appt_doctor" };
  send(chatId,
    `📅 *Qabulga yozilish*\n\n` +
    `Shifokorlar:\n\n${getDoctorsList()}\n\n` +
    `Raqam yozing _(masalan: 1)_`,
    cancelMenu()
  );
});

// ─── UNIVERSAL HANDLER ───────────────────────────────────────────────────────
const MENU_BTNS = [
  "📋 Xizmatlar va narxlar","🕐 Ish vaqti","👨‍⚕️ Shifokorlar",
  "📅 Qabulga yozilish","📍 Manzil","📞 Operator","🤖 AI Maslahatchi",
];

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith("/") || MENU_BTNS.includes(text)) return;

  if (text === "❌ Bekor qilish") {
    userState[chatId] = null;
    send(chatId, "Bekor qilindi.", mainMenu());
    return;
  }
  if (text === "🏠 Asosiy menyu") {
    userState[chatId] = null;
    send(chatId, "Asosiy menyu:", mainMenu());
    return;
  }

  const state = userState[chatId];
  if (!state) return;

  // ── AI MASLAHATCHI ──────────────────────────────────────────────────────────
  if (state.step === "ai_start" || state.step === "ai_questioning") {
    state.history.push({ role: "user", content: text });
    if (state.step === "ai_start") {
      state.symptoms = text;
      state.step = "ai_questioning";
    }
    state.questionCount++;

    const isLastQuestion = state.questionCount >= 3;

    const systemPrompt = `Sen "${CLINIC.name}" klinikasining professional AI tibbiy maslahatchiisisan.

KLINIKA MA'LUMOTLARI:
${KNOWLEDGE_BASE}

VAZIFANG:
${!isLastQuestion
  ? `Bemorning belgilarini tahlil qil va BITTA qisqa aniqlovchi savol ber.
Savol qisqa, aniq bo'lsin. Faqat bitta savol.`
  : `Endi YAKUNIY TASHXIS va BLANКА tayyorla:

1. Professional tibbiy tashxis (taxminiy) qo'y
2. Qaysi shifokorga borishini aniq ko'rsat (klinikamizdan)
3. Shifokorning ish jadvalini ayt
4. Quyidagi formatda tibbiy blanка yoz:

━━━━━━━━━━━━━━━━━━━━━━
🏥 TIBBIY YO'LLANMA
📅 Sana: ${new Date().toLocaleDateString('uz-UZ')}
━━━━━━━━━━━━━━━━━━━━━━
Bemor belgilari: [qisqacha]
Taxminiy tashxis: [tashxis]
Yo'naltirish: [shifokor ismi va mutaxassisligi]
Jadval: [shifokorning ish vaqti]
Tavsiyalar: [2-3 ta amaliy maslahat]
━━━━━━━━━━━━━━━━━━━━━━

5. Qabulga yozilishni taklif qil
6. ESLATMA: Bu taxminiy tashxis, shifokor ko'rigidan keyin aniqlanadi`
}

MUHIM: Faqat O'ZBEK tilida javob ber. Qisqa va aniq.`;

    const wait = await send(chatId, "🤖 Tahlil qilinmoqda...");
    const answer = await askClaude(state.history, systemPrompt);
    await bot.deleteMessage(chatId, wait.message_id).catch(() => {});

    if (!answer) {
      userState[chatId] = null;
      send(chatId, `Kechirasiz, xatolik. Qo'ng'iroq qiling: ${CLINIC.phone}`, mainMenu());
      return;
    }

    state.history.push({ role: "assistant", content: answer });

    if (isLastQuestion) {
      // Blanка yaratildi — shifokorga yuborish
      const doctorMatch = CLINIC.doctors.find(d =>
        answer.includes(d.name) || answer.toLowerCase().includes(d.spec.toLowerCase())
      );

      send(chatId, `🤖 *AI Maslahatchi xulosasi:*\n\n${answer}`, {
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [["📅 Qabulga yozilish"], ["🏠 Asosiy menyu"]],
          resize_keyboard: true,
        },
      });

      // Shifokorga yoki adminga blanка yuborish
      const blankMsg =
        `📋 *YANGI BEMOR — AI YO'LLANMA*\n\n` +
        `👤 @${msg.from.username || msg.from.first_name}\n` +
        `📅 ${new Date().toLocaleDateString('uz-UZ')}\n\n` +
        `*Dastlabki belgilar:* ${state.symptoms}\n\n` +
        `*AI xulosasi:*\n${answer}`;

      if (doctorMatch) {
        notifyDoctor(doctorMatch.id, blankMsg);
      } else {
        notifyAdmin(blankMsg);
      }

      userState[chatId] = null;
    } else {
      send(chatId, `🤖 ${answer}`, cancelMenu());
    }
    return;
  }

  // ── QABUL FLOW ──────────────────────────────────────────────────────────────
  if (state.step === "appt_doctor") {
    const n = parseInt(text);
    if (isNaN(n) || n < 1 || n > CLINIC.doctors.length) {
      send(chatId, `⚠️ 1 dan ${CLINIC.doctors.length} gacha raqam kiriting.`);
      return;
    }
    state.doctor = CLINIC.doctors[n - 1];
    state.step = "appt_name";
    send(chatId,
      `✅ *${state.doctor.name}* (${state.doctor.spec}) tanlandi.\n\n` +
      `📅 Jadval: ${state.doctor.schedule}\n\n` +
      `Ismingizni kiriting:`,
      cancelMenu()
    );
    return;
  }

  if (state.step === "appt_name") {
    state.patientName = text;
    state.step = "appt_phone";
    send(chatId, `📞 Telefon raqamingizni kiriting:`, {
      reply_markup: {
        keyboard: [[{ text: "📱 Raqamni yuborish", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return;
  }

  if (state.step === "appt_phone") {
    state.phone = text;
    state.step = "appt_date";
    send(chatId,
      `📅 Qaysi kun kelmoqchisiz?\n_Masalan: Ertaga, 20-aprel, Dushanba_`,
      { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
    );
    return;
  }

  if (state.step === "appt_date") {
    state.date = text;
    state.step = "appt_time";
    send(chatId, `⏰ Qaysi vaqt qulay?\n_Masalan: 10:00, 14:30_`, { parse_mode: "Markdown" });
    return;
  }

  if (state.step === "appt_time") {
    state.time = text;
    send(chatId,
      `✅ *Qabul so'rovi yuborildi!*\n\n` +
      `👤 Bemor: ${state.patientName}\n` +
      `🩺 Shifokor: ${state.doctor.name} (${state.doctor.spec})\n` +
      `📅 Kun: ${state.date} — ⏰ ${state.time}\n` +
      `📞 Telefon: ${state.phone}\n\n` +
      `Operatorimiz tez orada tasdiqlash uchun bog'lanadi.\n` +
      `📞 ${CLINIC.phone}`,
      mainMenu()
    );
    notifyDoctor(state.doctor.id,
      `🔔 *YANGI QABUL*\n\n` +
      `👤 ${state.patientName}\n📞 ${state.phone}\n` +
      `🩺 ${state.doctor.name} (${state.doctor.spec})\n` +
      `📅 ${state.date} — ⏰ ${state.time}\n` +
      `🆔 @${msg.from.username || msg.from.first_name}`
    );
    userState[chatId] = null;
    return;
  }
});

// ─── CONTACT ─────────────────────────────────────────────────────────────────
bot.on("contact", (msg) => {
  const state = userState[msg.chat.id];
  if (state?.step === "appt_phone") {
    state.phone = msg.contact.phone_number;
    state.step = "appt_date";
    send(msg.chat.id,
      `📅 Qaysi kun kelmoqchisiz?\n_Masalan: Ertaga, 20-aprel_`,
      { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
    );
  }
});

// ─── POLLING ERROR ────────────────────────────────────────────────────────────
bot.on("polling_error", (err) => console.error("Polling error:", err.message));

// ─── SERVER ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

if (WEBHOOK_URL) {
  const path = `/webhook/${TOKEN}`;
  bot.setWebHook(`${WEBHOOK_URL}${path}`).then(() => {
    console.log("✅ Webhook o'rnatildi");
  }).catch(e => console.error("Webhook error:", e.message));

  http.createServer((req, res) => {
    if (req.method === "POST" && req.url === path) {
      let body = "";
      req.on("data", c => (body += c));
      req.on("end", () => {
        try { bot.processUpdate(JSON.parse(body)); } catch(e) {}
        res.end("OK");
      });
    } else {
      res.end(`${CLINIC.name} boti ishlayapdi ✅`);
    }
  }).listen(PORT, () => {
    console.log(`✅ ${CLINIC.name} — Webhook rejim (port: ${PORT})`);
    console.log(CLAUDE_KEY ? "🤖 Claude AI ulangan" : "⚠️ CLAUDE_API_KEY yo'q");
  });
} else {
  http.createServer((req, res) => res.end("OK")).listen(PORT);
  console.log(`✅ ${CLINIC.name} — Polling rejim (port: ${PORT})`);
  console.log(CLAUDE_KEY ? "🤖 Claude AI ulangan" : "⚠️ CLAUDE_API_KEY yo'q");
}
