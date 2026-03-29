const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.BOT_TOKEN;
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
    { name: "Dr. Aziz Karimov",   spec: "Terapevt",   exp: "15 yil tajriba" },
    { name: "Dr. Malika Yusupova",spec: "Kardiolog",   exp: "12 yil tajriba" },
    { name: "Dr. Bobur Toshmatov",spec: "Nevropatolog",exp: "10 yil tajriba" },
    { name: "Dr. Nodira Aliyeva", spec: "Ginekolog",   exp: "18 yil tajriba" },
    { name: "Dr. Sardor Xoliqov", spec: "Urolog",      exp: "8 yil tajriba"  },
    { name: "Dr. Zulfiya Raximova",spec:"Pediatr",     exp: "14 yil tajriba" },
  ],
};
// ────────────────────────────────────────────────────────────────────────────

// Track users in multi-step appointment flow
const appointmentFlow = {};

// ── Main menu keyboard ──────────────────────────────────────────────────────
function mainMenu() {
  return {
    reply_markup: {
      keyboard: [
        ["📋 Xizmatlar va narxlar", "🕐 Ish vaqti"],
        ["👨‍⚕️ Shifokorlar",          "📅 Qabulga yozilish"],
        ["📍 Manzil",               "📞 Bog'lanish"],
        ["❓ Savol berish"],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };
}

// ── Formatters ───────────────────────────────────────────────────────────────
function servicesText() {
  let text = `🏥 *${CLINIC.name} — Xizmatlar va narxlar*\n\n`;
  CLINIC.services.forEach((s) => {
    text += `• ${s.name}\n  💰 ${s.price}\n\n`;
  });
  text += "💡 Narxlar o'zgarishi mumkin. Aniq ma'lumot uchun qo'ng'iroq qiling.";
  return text;
}

function hoursText() {
  let text = `🕐 *Ish vaqtimiz*\n\n`;
  for (const [day, time] of Object.entries(CLINIC.workingHours)) {
    text += `📅 *${day}:* ${time}\n`;
  }
  text += `\n📞 Qo'shimcha ma'lumot: ${CLINIC.phone}`;
  return text;
}

function doctorsText() {
  let text = `👨‍⚕️ *Bizning shifokorlar*\n\n`;
  CLINIC.doctors.forEach((d) => {
    text += `🩺 *${d.name}*\n   ${d.spec} | ${d.exp}\n\n`;
  });
  return text;
}

function contactText() {
  return (
    `📞 *Bog'lanish*\n\n` +
    `🏥 *Klinika:* ${CLINIC.name}\n` +
    `📍 *Manzil:* ${CLINIC.address}\n` +
    `📞 *Telefon:* ${CLINIC.phone}\n` +
    `💬 *WhatsApp:* ${CLINIC.whatsapp}\n\n` +
    `Qo'ng'iroq qilish uchun telefon raqamga bosing 👆`
  );
}

// ── /start ───────────────────────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  const name = msg.from.first_name || "Hurmatli mijoz";
  const welcome =
    `Salom, *${name}*! 👋\n\n` +
    `🏥 *${CLINIC.name}*ga xush kelibsiz!\n\n` +
    `Men sizga quyidagilarda yordam bera olaman:\n` +
    `• Xizmatlar va narxlar haqida ma'lumot\n` +
    `• Shifokorlar ro'yxati\n` +
    `• Ish vaqti\n` +
    `• Qabulga yozilish\n\n` +
    `Quyidagi tugmalardan birini tanlang 👇`;

  bot.sendMessage(msg.chat.id, welcome, {
    parse_mode: "Markdown",
    ...mainMenu(),
  });
});

// ── Services ─────────────────────────────────────────────────────────────────
bot.onText(/📋 Xizmatlar/, (msg) => {
  bot.sendMessage(msg.chat.id, servicesText(), {
    parse_mode: "Markdown",
    ...mainMenu(),
  });
});

// ── Working hours ─────────────────────────────────────────────────────────────
bot.onText(/🕐 Ish vaqti/, (msg) => {
  bot.sendMessage(msg.chat.id, hoursText(), {
    parse_mode: "Markdown",
    ...mainMenu(),
  });
});

// ── Doctors ──────────────────────────────────────────────────────────────────
bot.onText(/👨‍⚕️ Shifokorlar/, (msg) => {
  bot.sendMessage(msg.chat.id, doctorsText(), {
    parse_mode: "Markdown",
    ...mainMenu(),
  });
});

// ── Address / map ─────────────────────────────────────────────────────────────
bot.onText(/📍 Manzil/, (msg) => {
  bot.sendMessage(msg.chat.id, `📍 *Bizning manzil:*\n${CLINIC.address}`, {
    parse_mode: "Markdown",
  });
  // Send a real map pin — replace coords with your clinic's actual location
  bot.sendLocation(msg.chat.id, 41.2995, 69.2401);
  bot.sendMessage(msg.chat.id, "Yuqoridagi xaritada ko'ring 👆", mainMenu());
});

// ── Contact ──────────────────────────────────────────────────────────────────
bot.onText(/📞 Bog'lanish/, (msg) => {
  bot.sendMessage(msg.chat.id, contactText(), {
    parse_mode: "Markdown",
    ...mainMenu(),
  });
});

// ── Appointment flow ──────────────────────────────────────────────────────────
bot.onText(/📅 Qabulga yozilish/, (msg) => {
  const chatId = msg.chat.id;
  appointmentFlow[chatId] = { step: "name" };

  const doctorList = CLINIC.doctors
    .map((d, i) => `${i + 1}. ${d.name} — ${d.spec}`)
    .join("\n");

  bot.sendMessage(
    chatId,
    `📅 *Qabulga yozilish*\n\n` +
    `Shifokorlar:\n${doctorList}\n\n` +
    `Qaysi shifokorga yozilmoqchisiz? (Raqam yozing, masalan: *1*)`,
    { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
  );
  appointmentFlow[chatId].step = "doctor";
});

// ── Free-form question ────────────────────────────────────────────────────────
bot.onText(/❓ Savol berish/, (msg) => {
  const chatId = msg.chat.id;
  appointmentFlow[chatId] = { step: "question" };
  bot.sendMessage(
    chatId,
    "❓ Savolingizni yozing — operatorimiz tez orada javob beradi:",
    { reply_markup: { remove_keyboard: true } }
  );
});

// ── Universal message handler (appointment steps + free question) ─────────────
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith("/")) return;

  // Skip known menu buttons — they have their own handlers
  const menuButtons = [
    "📋 Xizmatlar va narxlar","🕐 Ish vaqti","👨‍⚕️ Shifokorlar",
    "📅 Qabulga yozilish","📍 Manzil","📞 Bog'lanish","❓ Savol berish",
  ];
  if (menuButtons.includes(text)) return;

  const flow = appointmentFlow[chatId];
  if (!flow) return;

  // ── Free question ───────────────────────────────────────────────────────
  if (flow.step === "question") {
    delete appointmentFlow[chatId];
    bot.sendMessage(
      chatId,
      `✅ Savolingiz qabul qilindi!\n\n` +
      `📋 *Sizning savolingiz:*\n"${text}"\n\n` +
      `⏳ Operatorimiz 15–30 daqiqa ichida javob beradi.\n` +
      `Yoki hozir qo'ng'iroq qiling: ${CLINIC.phone}`,
      { parse_mode: "Markdown", ...mainMenu() }
    );

    // Notify admin (set ADMIN_CHAT_ID in env)
    if (process.env.ADMIN_CHAT_ID) {
      bot.sendMessage(
        process.env.ADMIN_CHAT_ID,
        `❓ *Yangi savol*\n` +
        `👤 @${msg.from.username || msg.from.first_name}\n` +
        `💬 ${text}`,
        { parse_mode: "Markdown" }
      );
    }
    return;
  }

  // ── Appointment: pick doctor ────────────────────────────────────────────
  if (flow.step === "doctor") {
    const num = parseInt(text);
    if (isNaN(num) || num < 1 || num > CLINIC.doctors.length) {
      bot.sendMessage(chatId, `⚠️ Iltimos, 1 dan ${CLINIC.doctors.length} gacha raqam kiriting.`);
      return;
    }
    flow.doctor = CLINIC.doctors[num - 1];
    flow.step = "name";
    bot.sendMessage(chatId, `✅ *${flow.doctor.name}* tanlandi.\n\nIsmingizni kiriting:`, {
      parse_mode: "Markdown",
    });
    return;
  }

  // ── Appointment: patient name ───────────────────────────────────────────
  if (flow.step === "name") {
    flow.patientName = text;
    flow.step = "phone";
    bot.sendMessage(chatId, `📞 Telefon raqamingizni kiriting:\n_(Masalan: +998 90 123 45 67)_`, {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [[{ text: "📱 Raqamni yuborish", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return;
  }

  // ── Appointment: phone number (typed) ──────────────────────────────────
  if (flow.step === "phone") {
    flow.phone = text;
    flow.step = "date";
    bot.sendMessage(
      chatId,
      `📅 Qaysi kun kelmoqchisiz?\n_(Masalan: Ertaga, 15-iyun, Shanba)_`,
      { reply_markup: { remove_keyboard: true } }
    );
    return;
  }

  // ── Appointment: date ───────────────────────────────────────────────────
  if (flow.step === "date") {
    flow.date = text;
    flow.step = "time";
    bot.sendMessage(chatId, `⏰ Qaysi vaqt qulay?\n_(Masalan: 10:00, Tushdan keyin)_`);
    return;
  }

  // ── Appointment: time → confirm ─────────────────────────────────────────
  if (flow.step === "time") {
    flow.time = text;

    const summary =
      `✅ *Qabul so'rovi qabul qilindi!*\n\n` +
      `👤 *Bemor:* ${flow.patientName}\n` +
      `🩺 *Shifokor:* ${flow.doctor.name} (${flow.doctor.spec})\n` +
      `📅 *Kun:* ${flow.date}\n` +
      `⏰ *Vaqt:* ${flow.time}\n` +
      `📞 *Telefon:* ${flow.phone}\n\n` +
      `⏳ Operatorimiz siz bilan bog'lanib, vaqtni tasdiqlaydi.\n` +
      `📞 Telefon: ${CLINIC.phone}`;

    bot.sendMessage(chatId, summary, { parse_mode: "Markdown", ...mainMenu() });

    // Notify admin
    if (process.env.ADMIN_CHAT_ID) {
      bot.sendMessage(
        process.env.ADMIN_CHAT_ID,
        `🔔 *YANGI QABUL SO'ROVI*\n\n` +
        `👤 Bemor: ${flow.patientName}\n` +
        `📞 Tel: ${flow.phone}\n` +
        `🩺 Shifokor: ${flow.doctor.name}\n` +
        `📅 Kun: ${flow.date}\n` +
        `⏰ Vaqt: ${flow.time}\n` +
        `🆔 Telegram: @${msg.from.username || "yo'q"}`,
        { parse_mode: "Markdown" }
      );
    }

    delete appointmentFlow[chatId];
    return;
  }
});

// ── Phone contact shared via button ──────────────────────────────────────────
bot.on("contact", (msg) => {
  const chatId = msg.chat.id;
  const flow = appointmentFlow[chatId];
  if (flow && flow.step === "phone") {
    flow.phone = msg.contact.phone_number;
    flow.step = "date";
    bot.sendMessage(
      chatId,
      `📅 Qaysi kun kelmoqchisiz?\n_(Masalan: Ertaga, 15-iyun, Shanba)_`,
      { reply_markup: { remove_keyboard: true } }
    );
  }
});

// ── Catch polling errors ──────────────────────────────────────────────────────
bot.on("polling_error", (err) => console.error("Polling error:", err.message));

// ── Railway uchun HTTP server (Railway port kutadi, bo'lmasa o'ldiradi) ───────
const http = require("http");
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => res.end("Bot ishlayapdi ✅")).listen(PORT, () => {
  console.log(`✅ ${CLINIC.name} boti ishga tushdi... (port: ${PORT})`);
});
