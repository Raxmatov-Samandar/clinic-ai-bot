const TelegramBot = require("node-telegram-bot-api");
const https = require("https");
const http = require("http");

const TOKEN = process.env.BOT_TOKEN;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const bot = new TelegramBot(TOKEN, { polling: true });

// ─── CLINIC CONFIG ─── Edit this section for each client ───────────────────
const CLINIC = {
  name: "Salomatlik Klinikasi",
  address: "Toshkent, Yunusobod tumani, 5-mavze, 12-uy",
  phone: "+998 71 123 45 67",
  whatsapp: "+998 90 123 45 67",
  workingHours: {
    "Dushanba – Juma": "08:00 – 20:00",
    "Shanba":          "09:00 – 17:00",
    "Yakshanba":       "Dam olish kuni",
  },
  services: [
    { name: "Terapevt (umumiy shifokor)", price: "80,000 so'm" },
    { name: "Kardiolog",                  price: "120,000 so'm" },
    { name: "Nevropatolog",               price: "120,000 so'm" },
    { name: "Ginekolog",                  price: "100,000 so'm" },
    { name: "Urolog",                     price: "100,000 so'm" },
    { name: "Pediatr (bolalar shifokori)",price: "90,000 so'm" },
    { name: "UZI tekshiruvi",             price: "60,000 so'mdan" },
    { name: "Qon tahlili (umumiy)",       price: "35,000 so'm" },
    { name: "Qon tahlili (to'liq panel)", price: "150,000 so'm" },
    { name: "Kardiogramma (EKG)",         price: "50,000 so'm" },
  ],
  doctors: [
    { name: "Dr. Aziz Karimov",    spec: "Terapevt",    exp: "15 yil tajriba" },
    { name: "Dr. Malika Yusupova", spec: "Kardiolog",    exp: "12 yil tajriba" },
    { name: "Dr. Bobur Toshmatov", spec: "Nevropatolog", exp: "10 yil tajriba" },
    { name: "Dr. Nodira Aliyeva",  spec: "Ginekolog",    exp: "18 yil tajriba" },
    { name: "Dr. Sardor Xoliqov",  spec: "Urolog",       exp: "8 yil tajriba"  },
    { name: "Dr. Zulfiya Raximova",spec: "Pediatr",      exp: "14 yil tajriba" },
  ],
};
// ────────────────────────────────────────────────────────────────────────────

// ── Claude AI funksiyasi ──────────────────────────────────────────────────────
async function askClaude(userQuestion) {
  if (!CLAUDE_API_KEY) return null;

  const systemPrompt = `Sen ${CLINIC.name} klinikasining AI yordamchisisisan.
Faqat shu klinika haqida ma'lumot ber. Qisqa, aniq, do'stona. Uzbek tilida gapir.

Klinika ma'lumotlari:
- Nomi: ${CLINIC.name}
- Manzil: ${CLINIC.address}
- Telefon: ${CLINIC.phone}
- Ish vaqti: ${Object.entries(CLINIC.workingHours).map(([k,v]) => `${k}: ${v}`).join(", ")}
- Xizmatlar: ${CLINIC.services.map(s => `${s.name} — ${s.price}`).join(", ")}
- Shifokorlar: ${CLINIC.doctors.map(d => `${d.name} (${d.spec})`).join(", ")}

Qoidalar:
1. Tibbiy tashxis qo'yma — shifokorga murojaat qilishni tavsiya et
2. Qabul uchun "Qabulga yozilish" tugmasini bosishni ayt
3. Javob 2-4 jumladan oshmasin
4. Klinikaga aloqasiz savollarga: "Bu haqda shifokorga murojaat qiling" de`;

  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: userQuestion }],
    });

    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content?.[0]?.text || null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on("error", (e) => { console.error("HTTPS error:", e.message); resolve(null); });
    req.write(body);
    req.end();
  });
}

// Track appointment flow
const appointmentFlow = {};

// ── Main menu ─────────────────────────────────────────────────────────────────
function mainMenu() {
  return {
    reply_markup: {
      keyboard: [
        ["📋 Xizmatlar va narxlar", "🕐 Ish vaqti"],
        ["👨‍⚕️ Shifokorlar",          "📅 Qabulga yozilish"],
        ["📍 Manzil",               "📞 Bog'lanish"],
        ["🤖 AI maslahat"],
      ],
      resize_keyboard: true,
    },
  };
}

// ── Formatters ────────────────────────────────────────────────────────────────
function servicesText() {
  let t = `🏥 *${CLINIC.name} — Xizmatlar va narxlar*\n\n`;
  CLINIC.services.forEach((s) => { t += `• ${s.name}\n  💰 ${s.price}\n\n`; });
  t += "💡 Narxlar o'zgarishi mumkin. Aniq ma'lumot uchun qo'ng'iroq qiling.";
  return t;
}
function hoursText() {
  let t = `🕐 *Ish vaqtimiz*\n\n`;
  for (const [d, v] of Object.entries(CLINIC.workingHours)) t += `📅 *${d}:* ${v}\n`;
  return t + `\n📞 ${CLINIC.phone}`;
}
function doctorsText() {
  let t = `👨‍⚕️ *Bizning shifokorlar*\n\n`;
  CLINIC.doctors.forEach((d) => { t += `🩺 *${d.name}*\n   ${d.spec} | ${d.exp}\n\n`; });
  return t;
}

// ── /start ────────────────────────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  const name = msg.from.first_name || "Hurmatli mijoz";
  bot.sendMessage(msg.chat.id,
    `Salom, *${name}*! 👋\n\n` +
    `🏥 *${CLINIC.name}*ga xush kelibsiz!\n\n` +
    `• Xizmatlar va narxlar\n` +
    `• Shifokorlar\n` +
    `• Qabulga yozilish\n` +
    `• 🤖 AI maslahat — istalgan savolga javob\n\n` +
    `Quyidagi tugmalardan birini tanlang 👇`,
    { parse_mode: "Markdown", ...mainMenu() }
  );
});

bot.onText(/📋 Xizmatlar/, (msg) => {
  bot.sendMessage(msg.chat.id, servicesText(), { parse_mode: "Markdown", ...mainMenu() });
});
bot.onText(/🕐 Ish vaqti/, (msg) => {
  bot.sendMessage(msg.chat.id, hoursText(), { parse_mode: "Markdown", ...mainMenu() });
});
bot.onText(/👨‍⚕️ Shifokorlar/, (msg) => {
  bot.sendMessage(msg.chat.id, doctorsText(), { parse_mode: "Markdown", ...mainMenu() });
});
bot.onText(/📍 Manzil/, (msg) => {
  bot.sendMessage(msg.chat.id, `📍 *Manzil:*\n${CLINIC.address}`, { parse_mode: "Markdown" });
  bot.sendLocation(msg.chat.id, 41.2995, 69.2401);
  bot.sendMessage(msg.chat.id, "Yuqoridagi xaritada ko'ring 👆", mainMenu());
});
bot.onText(/📞 Bog'lanish/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `📞 *Bog'lanish*\n\n🏥 ${CLINIC.name}\n📍 ${CLINIC.address}\n📞 ${CLINIC.phone}\n💬 WhatsApp: ${CLINIC.whatsapp}`,
    { parse_mode: "Markdown", ...mainMenu() }
  );
});

// ── AI maslahat ───────────────────────────────────────────────────────────────
bot.onText(/🤖 AI maslahat/, (msg) => {
  const chatId = msg.chat.id;
  if (!CLAUDE_API_KEY) {
    bot.sendMessage(chatId, `AI maslahat hozircha mavjud emas.\nQo'ng'iroq qiling: ${CLINIC.phone}`, mainMenu());
    return;
  }
  appointmentFlow[chatId] = { step: "ai_question" };
  bot.sendMessage(chatId,
    `🤖 *AI maslahat*\n\nSavolingizni yozing — darhol javob beraman!\n\n_Masalan: "Boshim og'riyapti, qaysi shifokorga boraman?" yoki "UZI narxi qancha?"_`,
    { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
  );
});

// ── Qabulga yozilish ──────────────────────────────────────────────────────────
bot.onText(/📅 Qabulga yozilish/, (msg) => {
  const chatId = msg.chat.id;
  const list = CLINIC.doctors.map((d, i) => `${i + 1}. ${d.name} — ${d.spec}`).join("\n");
  bot.sendMessage(chatId,
    `📅 *Qabulga yozilish*\n\nShifokorlar:\n${list}\n\nRaqam yozing (masalan: *1*)`,
    { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
  );
  appointmentFlow[chatId] = { step: "doctor" };
});

// ── Universal handler ─────────────────────────────────────────────────────────
const MENU_BTNS = [
  "📋 Xizmatlar va narxlar","🕐 Ish vaqti","👨‍⚕️ Shifokorlar",
  "📅 Qabulga yozilish","📍 Manzil","📞 Bog'lanish","🤖 AI maslahat",
];

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith("/") || MENU_BTNS.includes(text)) return;

  const flow = appointmentFlow[chatId];
  if (!flow) return;

  // AI savol
  if (flow.step === "ai_question") {
    delete appointmentFlow[chatId];
    const wait = await bot.sendMessage(chatId, "🤖 Javob tayyorlanmoqda...");
    const answer = await askClaude(text);
    await bot.deleteMessage(chatId, wait.message_id).catch(() => {});

    bot.sendMessage(chatId,
      answer
        ? `🤖 *AI maslahat:*\n\n${answer}\n\n_Qo'shimcha savol bo'lsa yana yozing._`
        : `Kechirasiz, hozir javob bera olmayapman. Qo'ng'iroq qiling: ${CLINIC.phone}`,
      { parse_mode: "Markdown", ...mainMenu() }
    );

    if (process.env.ADMIN_CHAT_ID) {
      bot.sendMessage(process.env.ADMIN_CHAT_ID,
        `🤖 *AI savol*\n👤 @${msg.from.username || msg.from.first_name}\n❓ ${text}\n💬 ${answer || "xato"}`,
        { parse_mode: "Markdown" }
      );
    }
    return;
  }

  // Appointment: doctor
  if (flow.step === "doctor") {
    const n = parseInt(text);
    if (isNaN(n) || n < 1 || n > CLINIC.doctors.length) {
      bot.sendMessage(chatId, `⚠️ 1 dan ${CLINIC.doctors.length} gacha raqam kiriting.`);
      return;
    }
    flow.doctor = CLINIC.doctors[n - 1];
    flow.step = "name";
    bot.sendMessage(chatId, `✅ *${flow.doctor.name}* tanlandi.\n\nIsmingizni kiriting:`, { parse_mode: "Markdown" });
    return;
  }

  if (flow.step === "name") {
    flow.patientName = text; flow.step = "phone";
    bot.sendMessage(chatId, `📞 Telefon raqamingizni kiriting:`, {
      reply_markup: {
        keyboard: [[{ text: "📱 Raqamni yuborish", request_contact: true }]],
        resize_keyboard: true, one_time_keyboard: true,
      },
    });
    return;
  }

  if (flow.step === "phone") {
    flow.phone = text; flow.step = "date";
    bot.sendMessage(chatId, `📅 Qaysi kun kelmoqchisiz? _(Masalan: Ertaga, 15-iyun)_`,
      { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } });
    return;
  }

  if (flow.step === "date") {
    flow.date = text; flow.step = "time";
    bot.sendMessage(chatId, `⏰ Qaysi vaqt qulay? _(Masalan: 10:00)_`, { parse_mode: "Markdown" });
    return;
  }

  if (flow.step === "time") {
    flow.time = text;
    bot.sendMessage(chatId,
      `✅ *Qabul so'rovi yuborildi!*\n\n` +
      `👤 ${flow.patientName}\n🩺 ${flow.doctor.name}\n📅 ${flow.date} — ${flow.time}\n📞 ${flow.phone}\n\n` +
      `Operatorimiz tasdiqlash uchun bog'lanadi. 📞 ${CLINIC.phone}`,
      { parse_mode: "Markdown", ...mainMenu() }
    );
    if (process.env.ADMIN_CHAT_ID) {
      bot.sendMessage(process.env.ADMIN_CHAT_ID,
        `🔔 *YANGI QABUL*\n👤 ${flow.patientName}\n📞 ${flow.phone}\n🩺 ${flow.doctor.name}\n📅 ${flow.date} — ${flow.time}`,
        { parse_mode: "Markdown" }
      );
    }
    delete appointmentFlow[chatId];
    return;
  }
});

bot.on("contact", (msg) => {
  const chatId = msg.chat.id;
  const flow = appointmentFlow[chatId];
  if (flow?.step === "phone") {
    flow.phone = msg.contact.phone_number;
    flow.step = "date";
    bot.sendMessage(chatId, `📅 Qaysi kun kelmoqchisiz?`, { reply_markup: { remove_keyboard: true } });
  }
});

bot.on("polling_error", (err) => console.error("Polling error:", err.message));

// ── Railway HTTP server ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => res.end("Bot ishlayapdi ✅")).listen(PORT, () => {
  console.log(`✅ ${CLINIC.name} boti ishga tushdi... (port: ${PORT})`);
  console.log(CLAUDE_API_KEY ? "🤖 Claude AI ulangan" : "⚠️  CLAUDE_API_KEY yo'q — oddiy rejim");
});
