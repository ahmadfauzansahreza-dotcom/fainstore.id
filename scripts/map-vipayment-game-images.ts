import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";

const dir = path.join(process.cwd(), "public/images/games");

const cards = fs
  .readdirSync(dir)
  .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file));

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/\.(png|jpg|jpeg|webp)$/i, "")
    .replace(/^card game\s*/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const aliases: Record<string, string> = {
  "free fire": "CARD GAME FREE-FIRE.png",
  "free fire max": "CARD GAME FREE FIRE MAX.png",
  "lifeafter": "CARD GAME LIVEAFTER.png",
  "magic chess go go": "CARD GAME MAGIC CHESS.png",
  "mobile legends a": "CARD GAME MOBILE LEGENDS.png",
  "mobile legends b": "CARD GAME MOBILE LEGENDS.png",
  "mobile legends brazil": "CARD GAME MOBILE LEGENDS.png",
  "mobile legends global": "CARD GAME MOBILE LEGENDS.png",
  "mobile legends malaysia": "CARD GAME MOBILE LEGENDS.png",
  "mobile legends philippines": "CARD GAME MOBILE LEGENDS.png",
  "mobile legends russia": "CARD GAME MOBILE LEGENDS.png",
  "mobile legends singapore": "CARD GAME MOBILE LEGENDS.png",
  "mobile legends turkey": "CARD GAME MOBILE LEGENDS.png",
  "mobile legends gift": "CARD GAME MOBILE LEGENDS.png",
  "pubg mobile global": "CARD GAME PUBG MOBILE.png",
  "pubg mobile id": "CARD GAME PUBG MOBILE.png",
  "ragnarok m eternal love sea": "CARD GAME RAGNAROK M ETERNAL LOVE.png",
  "roblox via login": "CARD GAME ROBLOX VIA LOGIN.png",
  "voucher roblox": "CARD GAME VOUCHER ROBLOX.png",
  "voucher valorant": "CARD GAME VOUCHER VALORANT.png",
  "dynasty warriors overlords": "CARD GAME DYNASTY WARRIORSoverlords.png",
  "state of survival zombie war": "CARD GAME STATE OF SURVIVALZombie War.png",
  "zenless zone zero zzz": "CARD GAME ZENLESS ZONE ZERO .png",
};

const normalizedCards = cards.map((file) => ({
  file,
  normalized: normalize(file),
}));

function findCard(gameName: string, slug: string) {
  const name = normalize(gameName);

  if (aliases[name]) {
    return aliases[name];
  }

  const exact = normalizedCards.find(
    (card) => card.normalized === name
  );

  if (exact) return exact.file;

  const slugNormalized = normalize(slug);

  const slugMatch = normalizedCards.find(
    (card) =>
      card.normalized === slugNormalized ||
      card.normalized.includes(slugNormalized) ||
      slugNormalized.includes(card.normalized)
  );

  return slugMatch?.file;
}

async function main() {
  const games = await db.game.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  let mapped = 0;
  let missing = 0;

  console.log("========================================");
  console.log("FAIN STORE — VIPAYMENT GAME IMAGE MAP");
  console.log("========================================");

  for (const game of games) {
    const card = findCard(game.name, game.slug);

    if (!card) {
      missing++;
      console.log(`MISSING | ${game.name} | ${game.slug}`);
      continue;
    }

    const imageUrl = `/images/games/${card}`;

    await db.game.update({
      where: { id: game.id },
      data: { imageUrl },
    });

    mapped++;

    console.log(`MAPPED  | ${game.name} -> ${card}`);
  }

  console.log("");
  console.log("========================================");
  console.log(`TOTAL GAMES : ${games.length}`);
  console.log(`MAPPED      : ${mapped}`);
  console.log(`MISSING     : ${missing}`);
  console.log("DATABASE IMAGE URL BERHASIL DIPERBARUI");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("IMAGE MAP FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
