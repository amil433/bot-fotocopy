import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import pino from "pino";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  let sudahPairing = false;

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "connecting") {
      console.log("⏳ Menghubungkan...");
    }

    // ✅ Pairing hanya sekali
    if (!sock.authState.creds.registered && !sudahPairing) {
      sudahPairing = true;

      setTimeout(async () => {
        try {
          const number = "6281234567890"; // 🔴 GANTI NOMOR KAMU
          const code = await sock.requestPairingCode(number);

          console.log("\n🔑 KODE PAIRING:");
          console.log(code);
          console.log("📱 Masukkan di WhatsApp > Perangkat tertaut\n");
        } catch (err) {
          console.log("❌ Gagal ambil kode pairing");
        }
      }, 8000); // delay biar stabil
    }

    if (connection === "open") {
      console.log("✅ Bot WA aktif");
    }

    if (connection === "close") {
      const reconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("🔁 Reconnect...");

      if (reconnect) startBot();
    }
  });

  // 📩 HANDLE PESAN
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const pesan = text.toLowerCase();

    // MENU
    if (pesan === "menu") {
      await sock.sendMessage(from, {
        text:
          "📄 *Amil Jaya Fotocopy*\n\n" +
          "Ketik:\n" +
          "1. harga\n" +
          "2. order"
      });
    }

    // HARGA
    if (pesan === "harga") {
      await sock.sendMessage(from, {
        text:
          "💰 *Harga:*\n" +
          "- FC Hitam Putih: 200\n" +
          "- FC Warna: 500\n" +
          "- Print: 1000\n" +
          "- Laminating: 5000"
      });
    }

    // ORDER
    if (pesan === "order") {
      await sock.sendMessage(from, {
        text:
          "🛒 *Format Order:*\n" +
          "Nama - Layanan - Jumlah\n\n" +
          "Contoh:\nAmil - Print - 10"
      });
    }
  });
}

startBot();
