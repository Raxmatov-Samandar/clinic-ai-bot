const TelegramBot = require("node-telegram-bot-api");

// 1. Bot sozlamalari
const TOKEN = '8685429571:AAGIPH_Zp4fmv33WIjgJwRhFGneQzpoo1zQ';
const bot = new TelegramBot(TOKEN, { polling: true });

// 2. CLINIC CONFIG
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
    { name: "Kardiolog",                 price: "120,000 so'm" },
    { name: "Nevropatolog",              price: "120,000 so'm" },
    { name: "Ginekolog",                 price: "100,000 so'm" },
    { name: "Urolog",                    price: "100,000 so'm" },
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

// Appointment flow tracking
const appointmentFlow = {};

// 3. Keyboards
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

// 4. Formatters
function servicesText() {
  let text = `🏥 *${CLINIC.name} — Xizmatlar va narxlar*\n\n`;
  CLINIC.services.forEach((s) => { text += `• ${s.name}\n  💰 ${s.price}\n\n`; });
  text += "💡 Narxlar o'zgarishi mumkin. Aniq ma'lumot uchun qo'ng'iroq qiling.";
  return text;
}

function hoursText() {
  let text = `🕐 *Ish vaqtimiz*\n\n`;
  for (const [day, time] of Object.entries(CLINIC.workingHours)) { text += `📅 *${day}:* ${time}\n`; }
  text += `\n📞 Qo'shimcha ma'lumot: ${CLINIC.phone}`;
  return text;
}

function doctorsText() {
  let text = `👨‍⚕️ *Bizning shifokorlar*\n\n`;
  CLINIC.doctors.forEach((d) => { text += `🩺 *${d.name}*\n   ${d.spec} | ${d.exp}\n\n`; });
  return text;
}

function contactText() {
  return `📞 *Bog'lanish*\n\n🏥 *Klinika:* ${CLINIC.name}\n📍 *Manzil:* ${CLINIC.address}\n📞 *Telefon:* ${CLINIC.phone}\n💬 *WhatsApp:* ${CLINIC.whatsapp}`;
}

// 5. Handlers
bot.onText(/\/start/, (msg) => {
  const name = msg.from.first_name || "Hurmatli mijoz";
  bot.sendMessage(msg.chat.id, `Salom, *${name}*! 👋\n\n🏥 *${CLINIC.name}*ga xush kelibsiz!`, {
    parse_mode: "Markdown",
    ...mainMenu(),
  });
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
  bot.sendMessage(msg.chat.id, `📍 *Bizning manzil:*\n${CLINIC.address}`, { parse_mode: "Markdown" });
  bot.sendLocation(msg.chat.id, 41.3387, 69.2847); // Yunusobod 5-mavze taxminiy koordinata
});

bot.onText(/📞 Bog'lanish/, (msg) => {
  bot.sendMessage(msg.chat.id, contactText(), { parse_mode: "Markdown", ...mainMenu() });
});

bot.onText(/📅 Qabulga yozilish/, (msg) => {
  const chatId = msg.chat.id;
  const doctorList = CLINIC.doctors.map((d, i) => `${i + 1}. ${d.name} — ${d.spec}`).join("\n");
  appointmentFlow[chatId] = { step: "doctor" };
  bot.sendMessage(chatId, `📅 *Qabulga yozilish*\n\nShifokorlar:\n${doctorList}\n\nTanlang (raqam yozing):`, {
    parse_mode: "Markdown",
    reply_markup: { remove_keyboard: true }
  });
});

bot.onText(/❓ Savol berish/, (msg) => {
  appointmentFlow[msg.chat.id] = { step: "question" };
  bot.sendMessage(msg.chat.id, "❓ Savolingizni yozing:", { reply_markup: { remove_keyboard: true } });
});

// 6. Universal message handler (Step-by-step logic)
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith("/")) return;

  const menuButtons = ["📋 Xizmatlar va narxlar", "🕐 Ish vaqti", "👨‍⚕️ Shifokorlar", "📅 Qabulga yozilish", "📍 Manzil", "📞 Bog'lanish", "❓ Savol berish"];
  if (menuButtons.includes(text)) return;

  const flow = appointmentFlow[chatId];
  if (!flow) return;

  if (flow.step === "question") {
    delete appointmentFlow[chatId];
    bot.sendMessage(chatId, "✅ Savolingiz qabul qilindi. Tez orada javob beramiz.", mainMenu());
  } else if (flow.step === "doctor") {
    const idx = parseInt(text) - 1;
    if (CLINIC.doctors[idx]) {
      flow.doctor = CLINIC.doctors[idx];
      flow.step = "name";
      bot.sendMessage(chatId, `✅ ${flow.doctor.name} tanlandi. Ismingizni kiriting:`);
    } else {
      bot.sendMessage(chatId, "Iltimos, ro'yxatdagi raqamni kiriting.");
    }
  } else if (flow.step === "name") {
    flow.patientName = text;
    flow.step = "phone";
    bot.sendMessage(chatId, "📞 Telefon raqamingizni kiriting:", {
      reply_markup: { keyboard: [[{ text: "📱 Raqamni yuborish", request_contact: true }]], resize_keyboard: true }
    });
  } else if (flow.step === "phone") {
    flow.phone = text;
    flow.step = "confirm";
    bot.sendMessage(chatId, "Raxmat! Operatorimiz siz bilan bog'lanadi.", mainMenu());
    delete appointmentFlow[chatId];
  }
});

bot.on("contact", (msg) => {
  const chatId = msg.chat.id;
  if (appointmentFlow[chatId] && appointmentFlow[chatId].step === "phone") {
    bot.sendMessage(chatId, "✅ Raqamingiz qabul qilindi. Operatorimiz bog'lanadi.", mainMenu());
    delete appointmentFlow[chatId];
  }
});

bot.on("polling_error", (err) => console.error(err.message));
console.log(`✅ ${CLINIC.name} boti ishga tushdi...`);