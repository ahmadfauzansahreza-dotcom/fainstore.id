const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("./data-produk-10-08-26.json", "utf8")
);

function detectGame(name) {
  const n = name.toLowerCase();

  const rules = [
    ["Free Fire", /free fire/],
    ["Mobile Legend", /mobile legend/],
    ["Call Of Duty Mobile", /call ?of duty|codm/],
    ["Higgs Domino", /higgs domino/],
    ["Arena Of Valor", /\baov\b/],
    ["Point Blank", /point blank|pb cash/],
    ["Lords Mobile", /lords mobile|lord mobile/],
    ["Genshin Impact", /genshin impact|genesis crystals/],
    ["Dragon Raja", /dragon raja/],
    ["Sausage Man", /sausage man/],
    ["Omega Legends", /omega legends/],
    ["Tom and Jerry", /tom and jerry/],
    ["Tower Of Fantasy", /tower of fantasy/],
    ["Hago", /\bhago\b/],
    ["Super Sus", /super sus/],
    ["One Punch Man", /one punch man/],
    ["Revelation", /revelation/],
    ["Ace Racer", /ace racer/],
    ["Ragnarok", /ragnarok/],
    ["LifeAfter", /lifeafter/],
    ["Eudemons Online", /eudemons online/],
    ["Laplace M", /laplace m/],
    ["Lita", /\blita\b/],
    ["Ludo Club", /ludo club/],
    ["MU Origin 2", /mu origin 2/],
    ["MU Origin 3", /mu origin 3/],
    ["Marvel Super War", /marvel super war/],
    ["Mangatoon", /mangatoon/],
    ["Mango Live", /mango live/],
    ["Naruto Slugfest", /naruto.*slugfest/],
    ["Football Master 2", /football master 2/],
    ["Never After", /never after/],
    ["Mirage: Perfect Skyline", /mirage:perfect skyline/],
    ["Project Entropy", /project entropy/],
    ["Saint Seiya", /saint seiya/],
    ["Starfall Fantasy", /starfall fantasy/],
    ["Idle Legend", /idle legend/],
    ["Valorant", /valorant/],
    ["Hyper Front", /hyper front/],
    ["Goddess Of Victory: Nikke", /goddess of victory.*nikke/],
    ["Be The King", /be the king/],
    ["Harry Potter", /harry potter/],
    ["Metal Slug: Awakening", /metal slug/],
    ["Honkai: Star Rail", /honkai: star rail/],
    ["Google Play", /google play/],
    ["Garena Shell", /garena shell/],
    ["PUBG Mobile", /\buc\b/],
    ["Bigo Live", /bigo live/],
    ["Smile", /smile non indo/],
    ["Tokovoucher", /tokovoucher/]
  ];

  for (const [game, regex] of rules) {
    if (regex.test(n)) return game;
  }

  return null;
}

const groups = {};

for (const item of data) {
  const game = detectGame(item.nama);

  if (!groups[item.operator_id]) {
    groups[item.operator_id] = {
      count: 0,
      game,
      sample: item.nama
    };
  }

  groups[item.operator_id].count++;
}

console.log("================================");
console.log("TOTAL DATA:", data.length);
console.log("TOTAL OPERATOR:", Object.keys(groups).length);
console.log("================================");

let detected = 0;
let unknown = 0;

for (const [operator, info] of Object.entries(groups)) {
  if (info.game) {
    detected++;
  } else {
    unknown++;
    console.log(
      "TIDAK TERDETEKSI | operator:",
      operator,
      "| produk:",
      info.sample
    );
  }
}

console.log("================================");
console.log("OPERATOR TERDETEKSI:", detected);
console.log("OPERATOR UNKNOWN:", unknown);
console.log("================================");
