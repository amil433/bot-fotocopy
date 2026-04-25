import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import pino from "pino";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  // ✅ PAIRING VIA NOMOR
  if (!sock.authState.creds.registered) {
    rl.question("Masukkan nomor WhatsApp (contoh: 628xxxx): ", async (number) => {
      const code = await sock.requestPairingCode(number);
      console.log("Kode pairing kamu:", code);
    });
  }

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

    if (pesan === "menu") {
      await sock.sendMessage(from, {
        text: "📄 *Amil Jaya Fotocopy*\nKetik:\n1. harga\n2. order"
      });
    }

    if (pesan === "harga") {
      await sock.sendMessage(from, {
        text: "💰 FC:200 | Warna:500 | Print:1000"
      });
    }

    if (pesan === "order") {
      await sock.sendMessage(from, {
        text: "Kirim:\nNama - Layanan - Jumlah"
      });
    }
  });
}

startBot();
