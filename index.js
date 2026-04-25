import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import pino from "pino";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "connecting") {
      console.log("⏳ Menghubungkan...");
    }

    // ✅ PAIRING NOMOR (AMAN)
    if (!sock.authState.creds.registered) {
      const number = "6282287486762"; // GANTI NOMOR KAMU
      const code = await sock.requestPairingCode(number);
      console.log("🔑 Kode pairing:", code);
    }

    if (connection === "open") {
      console.log("✅ Bot WA aktif");
    }

    if (connection === "close") {
      const reconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (reconnect) startBot();
    }
  });

  // pesan masuk
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
        text: "📄 *Amil Jaya Fotocopy*\nKetik:\n1. harga\n2. order"
      });
    }

    if (pesan === "harga") {
      await sock.sendMessage(from, {
        text: "💰 Harga:\nFC:200\nWarna:500\nPrint:1000\nLaminating:5000"
      });
    }

    if (pesan === "order") {
      await sock.sendMessage(from, {
        text: "🛒 Format:\nNama - Layanan - Jumlah"
      });
    }
  });
}

startBot();
