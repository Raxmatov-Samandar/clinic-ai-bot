const TelegramBot = require("node-telegram-bot-api");
const https = require("https");
const http = require("http");

// ─── ENV ─────────────────────────────────────────────────────────────────────
const TOKEN          = process.env.BOT_TOKEN;
const CLAUDE_KEY     = process.env.CLAUDE_API_KEY;
const ADMIN_ID       = process.env.ADMIN_CHAT_ID;
const WEBHOOK_URL    = process.env.WEBHOOK_URL; // https://your-app.onrender.com

// ─── CLINIC CONFIG ────────────────────────────────────────────────────────────
const CLINIC = {
  name:     "Salomatlik Klinikasi",
  address:  "Toshkent, Yunusobod tumani, 5-mavze, 12-uy",
  phone:    "+998 71 123 45 67",
  whatsapp: "+998 90 123 45 67",
  mapLat:   41.2995,
  mapLng:   69.2401,
  workingHours: {
    "Dushanba – Juma": "08:00 – 20:00",
    "Shanba":          "09:00 – 17:00",
    "Yakshanba":       "Dam olish kuni",
  },
  // Har bir shifokor uchun telegram_id ni klinikadan oling
  // Agar yo'q bo'lsa — null qoldiring, admin ga ketadi
  doctors: [
    { id: 1,  name: "Dr. Aziz Karimov",     spec: "Terapevt",     exp: "15 yil", price: "80,000 so'm",  telegram_id: null },
    { id: 2,  name: "Dr. Malika Yusupova",  spec: "Kardiolog",     exp: "12 yil", price: "120,000 so'm", telegram_id: null },
    { id: 3,  name: "Dr. Bobur Toshmatov",  spec: "Nevropatolog",  exp: "10 yil", price: "120,000 so'm", telegram_id: null },
    { id: 4,  name: "Dr. Nodira Aliyeva",   spec: "Ginekolog",     exp: "18 yil", price: "100,000 so'm", telegram_id: null },
    { id: 5,  name: "Dr. Sardor Xoliqov",   spec: "Urolog",        exp: "8 yil",  price: "100,000 so'm", telegram_id: null },
    { id: 6,  name: "Dr. Zulfiya Raximova", spec: "Pediatr",       exp: "14 yil", price: "90,000 so'm",  telegram_id: null },
    { id: 7,  name: "Dr. Kamol Mirzayev",   spec: "Oftalmolog",    exp: "11 yil", price: "110,000 so'm", telegram_id: null },
    { id: 8,  name: "Dr. Dilnoza Xasanova", spec: "Dermatolog",    exp: "9 yil",  price: "100,000 so'm", telegram_id: null },
    { id: 9,  name: "Dr. Jasur Tursunov",   spec: "Ortoped",       exp: "13 yil", price: "120,000 so'm", telegram_id: null },
    { id: 10, name: "Dr. Maftuna Ergasheva",spec: "Endokrinolog",  exp: "10 yil", price: "110,000 so'm", telegram_id: null },
  ],
  services: [
    { name: "Terapevt maslahati",     price: "80,000 so'm"   },
    { name: "Kardiolog maslahati",    price: "120,000 so'm"  },
    { name: "UZI tekshiruvi",         price: "60,000 so'mdan"},
    { name: "Qon tahlili (umumiy)",   price: "35,000 so'm"   },
    { name: "Qon tahlili (to'liq)",   price: "150,000 so'm"  },
    { name: "EKG",                    price: "50,000 so'm"   },
    { name: "MRT",                    price: "350,000 so'm"  },
    { name: "Rentgen",                price: "45,000 so'm"   },
    { name: "Ginekolog maslahati",    price: "100,000 so'm"  },
    { name: "Pediatr maslahati",      price: "90,000 so'm"   },
    { name: "Oftalmolog maslahati",   price: "110,000 so'm"  },
    { name: "Dermatolog maslahati",   price: "100,000 so'm"  },
  ],
};

// ─── BOT SETUP ───────────────────────────────────────────────────────────────
const bot = WEBHOOK_URL
  ? new TelegramBot(TOKEN)
  : new TelegramBot(TOKEN, { polling: true });

// ─── STATE ───────────────────────────────────────────────────────────────────
const userState = {}; // chatId → { step, data }

// ─── AI CLAUDE ───────────────────────────────────────────────────────────────
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
      one_time_keyboard: true,
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
  const doctor = CLINIC.doctors.find(d => d.id === doctorId);
  const targetId = doctor?.telegram_id || ADMIN_ID;
  if (targetId) bot.sendMessage(targetId, text, { parse_mode: "Markdown" });
}

function getDoctorsList() {
  return CLINIC.doctors.map((d, i) =>
    `${i + 1}. *${d.name}* — ${d.spec} (${d.exp}, ${d.price})`
  ).join("\n");
}

// ─── /start ──────────────────────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  const name = msg.from.first_name || "Hurmatli mehmon";
  userState[msg.chat.id] = null;
  send(msg.chat.id,
    `Salom, *${name}*! 👋\n\n` +
    `🏥 *${CLINIC.name}*ga xush kelibsiz!\n\n` +
    `Quyidagi xizmatlardan foydalanishingiz mumkin:\n\n` +
    `📋 Xizmatlar va narxlar\n` +
    `👨‍⚕️ Shifokorlar ro'yxati\n` +
    `🕐 Ish vaqti jadvali\n` +
    `📅 Qabulga yozilish\n` +
    `📍 Klinika manzili\n` +
    `📞 Operator bilan bog'lanish\n` +
    `🤖 *AI Maslahatchi* — kasallik bo'yicha professional maslahat\n\n` +
    `Tugmani tanlang 👇`,
    mainMenu()
  );
});

// ─── XIZMATLAR ───────────────────────────────────────────────────────────────
bot.onText(/📋 Xizmatlar/, (msg) => {
  let text = `📋 *${CLINIC.name} — Xizmatlar va narxlar*\n\n`;
  CLINIC.services.forEach(s => { text += `• ${s.name} — 💰 ${s.price}\n`; });
  text += `\n💡 Aniq narx uchun: ${CLINIC.phone}`;
  send(msg.chat.id, text, mainMenu());
});

// ─── ISH VAQTI ───────────────────────────────────────────────────────────────
bot.onText(/🕐 Ish vaqti/, (msg) => {
  let text = `🕐 *Ish vaqti jadvali*\n\n`;
  for (const [day, time] of Object.entries(CLINIC.workingHours)) {
    text += `📅 *${day}:* ${time}\n`;
  }
  text += `\n📞 ${CLINIC.phone}`;
  send(msg.chat.id, text, mainMenu());
});

// ─── SHIFOKORLAR ─────────────────────────────────────────────────────────────
bot.onText(/👨‍⚕️ Shifokorlar/, (msg) => {
  send(msg.chat.id,
    `👨‍⚕️ *Bizning shifokorlar*\n\n${getDoctorsList()}`,
    mainMenu()
  );
});

// ─── MANZIL ──────────────────────────────────────────────────────────────────
bot.onText(/📍 Manzil/, (msg) => {
  send(msg.chat.id, `📍 *Manzil:*\n${CLINIC.address}`);
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
    `Ish vaqtida qo'ng'iroq qiling yoki xabar yozing.`,
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
  userState[chatId] = { step: "ai_start", history: [] };
  send(chatId,
    `🤖 *AI Maslahatchi*\n\n` +
    `Salom! Men sizga tibbiy maslahat beraman.\n\n` +
    `Qayerda noqulaylik his qilyapsiz? Belgilaringizni batafsil yozing.\n\n` +
    `_Masalan: "Ko'zim qizargan va achishyapti" yoki "Boshim og'riyapti va ko'nglim ayniyapti"_`,
    cancelMenu()
  );
});

// ─── QABULGA YOZILISH ─────────────────────────────────────────────────────────
bot.onText(/📅 Qabulga yozilish/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: "appt_doctor" };
  send(chatId,
    `📅 *Qabulga yozilish*\n\n` +
    `Shifokorlar ro'yxati:\n\n${getDoctorsList()}\n\n` +
    `Qaysi shifokorga yozilmoqchisiz?\n*Raqam yozing (masalan: 1)*`,
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

  // Bekor qilish
  if (text === "❌ Bekor qilish") {
    userState[chatId] = null;
    send(chatId, "Bekor qilindi. Asosiy menyu:", mainMenu());
    return;
  }

  const state = userState[chatId];
  if (!state) return;

  // ── AI MASLAHATCHI FLOW ─────────────────────────────────────────────────────
  if (state.step === "ai_start") {
    state.symptoms = text;
    state.history = [{ role: "user", content: text }];
    state.step = "ai_questioning";
    state.questionCount = 0;

    const systemPrompt = `Sen ${CLINIC.name} klinikasining professional AI tibbiy maslahatchiisisan.
Shifokorlar: ${CLINIC.doctors.map(d => d.spec).join(", ")}.

Vazifang:
1. Bemorning belgilarini eshit
2. Aniq tashxis qo'yish uchun 2-3 ta qisqa savol ber (bittadan)
3. Keyin professional tashxis qo'y va qaysi shifokorga borishini ayt
4. Bemor uchun tibbiy blanка tayyorla

HOZIR: Bemorning dastlabki belgilarini ko'rib, birinchi aniqlovchi savolni ber.
Savol qisqa bo'lsin, bir jumlada.`;

    const wait = await send(chatId, "🤖 Tahlil qilinmoqda...");
    const answer = await askClaude(state.history, systemPrompt);
    await bot.deleteMessage(chatId, wait.message_id).catch(() => {});

    if (answer) {
      state.history.push({ role: "assistant", content: answer });
      send(chatId, `🤖 ${answer}`, cancelMenu());
    } else {
      userState[chatId] = null;
      send(chatId, `Kechirasiz, xatolik. Qo'ng'iroq qiling: ${CLINIC.phone}`, mainMenu());
    }
    return;
  }

  if (state.step === "ai_questioning") {
    state.history.push({ role: "user", content: text });
    state.questionCount++;

    const systemPrompt = `Sen ${CLINIC.name} klinikasining professional AI tibbiy maslahatchiisisan.
Shifokorlar: ${CLINIC.doctors.map(d => `${d.spec}: ${d.name}`).join(", ")}.

Suhbat tarixi asosida:
- Agar ${state.questionCount >= 2 ? "TASHXIS VA BLANКА vaqti keldi" : "yana 1 ta aniqlovchi savol ber"}.

${state.questionCount >= 2 ? `TASHXIS QADAMI:
1. Professional tashxis qo'y
2. Qaysi shifokorga borishini ayt (klinikadan)  
3. Shifokorga borish uchun tibbiy blanка yoz:

FORMAT:
---
🏥 TIBBIY BLANКА
Bemor: [ism so'ralmagan, "Bemor" deb yoz]
Sana: ${new Date().toLocaleDateString('uz-UZ')}
Belgilar: [qisqa]
Dastlabki tashxis: [tashxis]
Yo'naltirish: [shifokor nomi va mutaxassisligi]
Tavsiyalar: [2-3 ta]
---

Keyin bemorni qabulga yozilishga taklif qil.` : "Bitta qisqa savol ber."}`;

    const wait = await send(chatId, "🤖 Tahlil qilinmoqda...");
    const answer = await askClaude(state.history, systemPrompt);
    await bot.deleteMessage(chatId, wait.message_id).catch(() => {});

    if (answer) {
      state.history.push({ role: "assistant", content: answer });

      if (state.questionCount >= 2) {
        // Blanка tayyor — shifokorga yuborish
        const doctorMatch = CLINIC.doctors.find(d =>
          answer.toLowerCase().includes(d.spec.toLowerCase())
        );

        send(chatId, `🤖 *AI Maslahatchi xulosasi:*\n\n${answer}`, mainMenu());

        // Shifokorga blanкa yuborish
        const blankText =
          `📋 *YANGI BEMOR — AI TASHXISI*\n\n` +
          `👤 Telegram: @${msg.from.username || msg.from.first_name}\n` +
          `📅 Sana: ${new Date().toLocaleDateString('uz-UZ')}\n\n` +
          `*Belgilar:* ${state.symptoms}\n\n` +
          `*AI xulosasi:*\n${answer}`;

        if (doctorMatch) {
          notifyDoctor(doctorMatch.id, blankText);
          send(chatId,
            `✅ Tibbiy blanкangiz *${doctorMatch.name}* (${doctorMatch.spec}) ga yuborildi!\n\n` +
            `Qabulga yozilish uchun 👇`,
            {
              reply_markup: {
                keyboard: [["📅 Qabulga yozilish"], ["🏠 Asosiy menyu"]],
                resize_keyboard: true,
              },
            }
          );
        } else {
          notifyAdmin(blankText);
          send(chatId,
            `✅ Tibbiy blanкangiz administratorga yuborildi!\n\nQabulga yozilish uchun 👇`,
            {
              reply_markup: {
                keyboard: [["📅 Qabulga yozilish"], ["🏠 Asosiy menyu"]],
                resize_keyboard: true,
              },
            }
          );
        }
        userState[chatId] = null;
      } else {
        send(chatId, `🤖 ${answer}`, cancelMenu());
      }
    } else {
      userState[chatId] = null;
      send(chatId, `Kechirasiz, xatolik yuz berdi.\nQo'ng'iroq qiling: ${CLINIC.phone}`, mainMenu());
    }
    return;
  }

  // ── QABUL FLOW ──────────────────────────────────────────────────────────────
  if (state.step === "appt_doctor") {
    const n = parseInt(text);
    if (isNaN(n) || n < 1 || n > CLINIC.doctors.length) {
      send(chatId, `⚠️ Iltimos 1 dan ${CLINIC.doctors.length} gacha raqam kiriting.`);
      return;
    }
    state.doctor = CLINIC.doctors[n - 1];
    state.step = "appt_name";
    send(chatId,
      `✅ *${state.doctor.name}* (${state.doctor.spec}) tanlandi.\n\nIsmingizni kiriting:`,
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
        resize_keyboard: true, one_time_keyboard: true,
      },
    });
    return;
  }

  if (state.step === "appt_phone") {
    state.phone = text;
    state.step = "appt_date";
    send(chatId, `📅 Qaysi kun kelmoqchisiz?\n_Masalan: Ertaga, 20-aprel_`, { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } });
    return;
  }

  if (state.step === "appt_date") {
    state.date = text;
    state.step = "appt_time";
    send(chatId, `⏰ Qaysi vaqt qulay?\n_Masalan: 10:00, Tushdan keyin_`, { parse_mode: "Markdown" });
    return;
  }

  if (state.step === "appt_time") {
    state.time = text;

    const summary =
      `✅ *Qabul so'rovi yuborildi!*\n\n` +
      `👤 Bemor: ${state.patientName}\n` +
      `🩺 Shifokor: ${state.doctor.name} (${state.doctor.spec})\n` +
      `📅 Kun: ${state.date}\n` +
      `⏰ Vaqt: ${state.time}\n` +
      `📞 Telefon: ${state.phone}\n\n` +
      `Operatorimiz tez orada tasdiqlash uchun bog'lanadi.\n` +
      `📞 ${CLINIC.phone}`;

    send(chatId, summary, mainMenu());

    const adminText =
      `🔔 *YANGI QABUL SO'ROVI*\n\n` +
      `👤 ${state.patientName}\n` +
      `📞 ${state.phone}\n` +
      `🩺 ${state.doctor.name} (${state.doctor.spec})\n` +
      `📅 ${state.date} — ⏰ ${state.time}\n` +
      `🆔 @${msg.from.username || msg.from.first_name}`;

    notifyDoctor(state.doctor.id, adminText);
    userState[chatId] = null;
    return;
  }

  // Asosiy menyu
  if (text === "🏠 Asosiy menyu") {
    userState[chatId] = null;
    send(chatId, "Asosiy menyu:", mainMenu());
  }
});

// ─── CONTACT ─────────────────────────────────────────────────────────────────
bot.on("contact", (msg) => {
  const chatId = msg.chat.id;
  const state = userState[chatId];
  if (state?.step === "appt_phone") {
    state.phone = msg.contact.phone_number;
    state.step = "appt_date";
    send(chatId, `📅 Qaysi kun kelmoqchisiz?\n_Masalan: Ertaga, 20-aprel_`, {
      parse_mode: "Markdown",
      reply_markup: { remove_keyboard: true },
    });
  }
});

// ─── WEBHOOK yoki POLLING ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

if (WEBHOOK_URL) {
  const webhookPath = `/webhook/${TOKEN}`;
  bot.setWebHook(`${WEBHOOK_URL}${webhookPath}`).then(() => {
    console.log("✅ Webhook o'rnatildi:", WEBHOOK_URL + webhookPath);
  });

  http.createServer((req, res) => {
    if (req.method === "POST" && req.url === webhookPath) {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        try {
          const update = JSON.parse(body);
          bot.processUpdate(update);
        } catch(e) {
          console.error("Webhook parse error:", e.message);
        }
        res.end("OK");
      });
    } else {
      res.end("Bot ishlayapdi ✅");
    }
  }).listen(PORT, () => {
    console.log(`✅ ${CLINIC.name} — Webhook rejimida (port: ${PORT})`);
    console.log(CLAUDE_KEY ? "🤖 Claude AI ulangan" : "⚠️ CLAUDE_API_KEY yo'q");
  });
} else {
  // Polling (local test uchun)
  http.createServer((req, res) => res.end("Bot ishlayapdi ✅")).listen(PORT);
  console.log(`✅ ${CLINIC.name} — Polling rejimida (port: ${PORT})`);
  console.log(CLAUDE_KEY ? "🤖 Claude AI ulangan" : "⚠️ CLAUDE_API_KEY yo'q");
  bot.on("polling_error", (err) => console.error("Polling error:", err.message));
}
