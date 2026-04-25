import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  // simpan session
  sock.ev.on("creds.update", saveCreds);

  // handle koneksi
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const reconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (reconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ Bot WA aktif");
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

    // MENU
    if (pesan === "menu") {
      await sock.sendMessage(from, {
        text: "📄 *Amil Jaya Fotocopy*\nSilakan pilih:",
        buttons: [
          { buttonId: "harga", buttonText: { displayText: "💰 Harga" } },
          { buttonId: "order", buttonText: { displayText: "🛒 Order" } }
        ],
        headerType: 1
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
        text: "🛒 Kirim format:\nNama - Layanan - Jumlah\nContoh:\nAmil - Print - 10"
      });
    }
  });
}

startBot();
