import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    // ✅ QR muncul di console
    if (qr) {
      console.log("\n📱 SCAN QR INI:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "connecting") {
      console.log("⏳ Menghubungkan...");
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

    if (pesan === "menu") {
      await sock.sendMessage(from, {
        text:
          "📄 *Amil Jaya Fotocopy*\n\n" +
          "Ketik:\n" +
          "1. harga\n" +
          "2. order"
      });
    }

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

    if (pesan === "order") {
      await sock.sendMessage(from, {
        text:
          "🛒 Format:\nNama - Layanan - Jumlah\n\nContoh:\nAmil - Print - 10"
      });
    }
  });
}

startBot();
