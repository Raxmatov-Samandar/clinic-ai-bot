# Klinika Telegram Bot — To'liq qo'llanma

## Nima qila oladi?
- Xizmatlar va narxlar
- Shifokorlar ro'yxati
- Ish vaqti
- Qabulga yozilish (to'liq qadamlar: shifokor → ism → telefon → kun → vaqt)
- Savol berish → admin Telegram'ga bildirishnoma
- Har bir yangi qabul so'rovi admin'ga darhol yetib boradi

---

## 1-QADAM — Telegram botni yaratish (BotFather)

1. Telegram'da @BotFather ga o'ting
2. /newbot yozing
3. Bot nomi bering (masalan: "Salomatlik Klinikasi")
4. Username bering (masalan: salomatlik_bot)
5. BotFather sizga TOKEN beradi — uni saqlang:
   ```
   123456789:ABCdefGHIjklMNO...
   ```

---

## 2-QADAM — Admin chat ID olish

1. @userinfobot ga yozing /start
2. U sizning chat ID raqamingizni beradi (masalan: 987654321)
3. Buni ADMIN_CHAT_ID sifatida ishlatamiz

---

## 3-QADAM — Klinika ma'lumotlarini o'zgartirish

bot.js faylining yuqorisidagi CLINIC ob'ektini o'zgartiring:

```js
const CLINIC = {
  name: "Sizning klinika nomi",
  address: "Toshkent, ...",
  phone: "+998 ...",
  // va hokazo
};
```

Koordinatalarni ham o'zgartiring (sendLocation qatori):
```js
bot.sendLocation(msg.chat.id, 41.2995, 69.2401); // <- bu yerga haqiqiy coords
```
Google Maps'da klinikani oching → share → coordinates nusxa oling.

---

## 4-QADAM — Railway.app'da joylash (BEPUL)

### railway.app saytiga kiring

1. railway.app saytiga boring
2. GitHub bilan kirish (GitHub account kerak — bepul)
3. "New Project" → "Deploy from GitHub repo" bosing

### GitHub repo yarating

```bash
# Kompyuteringizda:
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/SIZNING_USERNAME/clinic-bot
git push -u origin main
```

### Environment variables qo'shing

Railway dashboard'da → Variables bo'limiga:

```
BOT_TOKEN = 123456789:ABCdef... (BotFather'dan)
ADMIN_CHAT_ID = 987654321      (sizning Telegram ID)
```

### Deploy

Railway avtomatik deploy qiladi. 2 daqiqa kutamiz.
Logs'da "✅ bot ishga tushdi" yozuvini ko'rasiz.

---

## 5-QADAM — Test qilish

Telegram'da botingizga o'ting → /start bosing.
Agar ishlasa — tayyor! Klientga topshirishingiz mumkin.

---

## NARX QANDAY BELGILASH

| Xizmat                | Narx tavsiyasi  |
|-----------------------|-----------------|
| Bot o'rnatish (bir yo'l)| $300 – $500   |
| Oylik xizmat + yangilanish | $50 – $100/oy |

Birinchi klient uchun: $300 boshlang. Keyinchalik $500–700 qiling.

---

## KELAJAKDA QO'SHISH MUMKIN

- OpenAI/Claude API ulash → bot savolga AI bilan javob bersin
- Ko'p tilli: O'zbek / Rus / Ingliz
- To'lov qabul qilish (Click, Payme)
- Qabul jadvali (Google Sheets bilan sinxron)
- SMS eslatma (Eskiz.uz API)
