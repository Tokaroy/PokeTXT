import type { Trainer } from "@/types";
import { TRAINER_CLASS_MULTIPLIERS } from "@/types";

// Helper function to calculate trainer reward based on party and class
function calcReward(party: { speciesId: number; level: number }[], trainerClass: string): number {
  const avgLevel = party.reduce((sum, p) => sum + p.level, 0) / party.length;
  const multiplier = TRAINER_CLASS_MULTIPLIERS[trainerClass] || 1.0;
  return Math.floor(avgLevel * 20 * multiplier);
}

export const GYM_LEADERS: Trainer[] = [
  {
    name: "Brock",
    class: "Gym Leader",
    sprite: "🪨",
    party: [
      { speciesId: 74, level: 12 },
      { speciesId: 95, level: 14 }
    ],
    reward: 0, // Calculated
    beforeBattleText: "I'm Brock! I'm Pewter's Gym Leader! I believe in rock hard defense and determination!",
    afterBattleText: "I took you for granted. As proof of your victory, here's the Boulder Badge!",
    isGymLeader: true,
    badge: "Boulder Badge"
  },
  {
    name: "Misty",
    class: "Gym Leader",
    sprite: "💧",
    party: [
      { speciesId: 120, level: 18 },
      { speciesId: 121, level: 21 }
    ],
    reward: 0,
    beforeBattleText: "I'm Misty! I hope you know what you're doing, because I'm no pushover!",
    afterBattleText: "Wow! You're too much! You can have the Cascade Badge!",
    isGymLeader: true,
    badge: "Cascade Badge"
  },
  {
    name: "Lt. Surge",
    class: "Gym Leader",
    sprite: "⚡",
    party: [
      { speciesId: 100, level: 21 },
      { speciesId: 25, level: 18 },
      { speciesId: 26, level: 24 }
    ],
    reward: 0,
    beforeBattleText: "Hey, kid! What do you think you're doing here? You won't live long in combat!",
    afterBattleText: "Whoa! You're the real deal, kid! Fine then, take the Thunder Badge!",
    isGymLeader: true,
    badge: "Thunder Badge"
  },
  {
    name: "Erika",
    class: "Gym Leader",
    sprite: "🌿",
    party: [
      { speciesId: 71, level: 29 },
      { speciesId: 114, level: 24 },
      { speciesId: 45, level: 29 }
    ],
    reward: 0,
    beforeBattleText: "Hello. Lovely weather isn't it? It's so pleasant. ...Oh dear. I must have dozed off.",
    afterBattleText: "Oh! I concede defeat. You are remarkably strong. I must confer the Rainbow Badge.",
    isGymLeader: true,
    badge: "Rainbow Badge"
  },
  {
    name: "Koga",
    class: "Gym Leader",
    sprite: "☠️",
    party: [
      { speciesId: 109, level: 37 },
      { speciesId: 89, level: 39 },
      { speciesId: 49, level: 37 },
      { speciesId: 110, level: 43 }
    ],
    reward: 0,
    beforeBattleText: "Fwahahaha! A mere child like you dares to challenge me? Very well, I shall show you true terror!",
    afterBattleText: "Hah! You have proven your worth! Here, take the Soul Badge!",
    isGymLeader: true,
    badge: "Soul Badge"
  },
  {
    name: "Sabrina",
    class: "Gym Leader",
    sprite: "🔮",
    party: [
      { speciesId: 64, level: 38 },
      { speciesId: 122, level: 37 },
      { speciesId: 49, level: 38 },
      { speciesId: 65, level: 43 }
    ],
    reward: 0,
    beforeBattleText: "I had a vision of your arrival! I have had psychic powers since I was a child.",
    afterBattleText: "I'm shocked! But, a loss is a loss. I admit I didn't work hard enough to win. You earned the Marsh Badge.",
    isGymLeader: true,
    badge: "Marsh Badge"
  },
  {
    name: "Blaine",
    class: "Gym Leader",
    sprite: "🔥",
    party: [
      { speciesId: 58, level: 42 },
      { speciesId: 77, level: 40 },
      { speciesId: 78, level: 42 },
      { speciesId: 59, level: 47 }
    ],
    reward: 0,
    beforeBattleText: "Hah! I am Blaine, the red-hot Leader of Cinnabar Gym! My fiery Pokémon are all ready with intense heat!",
    afterBattleText: "I have burned down to nothing! Not even ashes remain! You have earned the Volcano Badge!",
    isGymLeader: true,
    badge: "Volcano Badge"
  },
  {
    name: "Giovanni",
    class: "Gym Leader",
    sprite: "🌋",
    party: [
      { speciesId: 111, level: 45 },
      { speciesId: 51, level: 42 },
      { speciesId: 31, level: 44 },
      { speciesId: 34, level: 45 },
      { speciesId: 112, level: 50 }
    ],
    reward: 0,
    beforeBattleText: "So! I must say, I am impressed you got here. I am Giovanni. I am the Leader of Viridian Gym!",
    afterBattleText: "Ha! That was a truly intense fight! You have won! As proof, here is the Earth Badge!",
    isGymLeader: true,
    badge: "Earth Badge"
  }
].map(t => ({ ...t, reward: calcReward(t.party, t.class) }));

export const ELITE_FOUR: Trainer[] = [
  {
    name: "Lorelei",
    class: "Elite Four",
    sprite: "❄️",
    party: [
      { speciesId: 87, level: 54 },
      { speciesId: 91, level: 53 },
      { speciesId: 80, level: 54 },
      { speciesId: 124, level: 56 },
      { speciesId: 131, level: 56 }
    ],
    reward: 0,
    beforeBattleText: "Welcome to the Pokémon League! I am Lorelei of the Elite Four! No one can best me when it comes to icy Pokémon!",
    afterBattleText: "You're better than I thought! Go on ahead!",
    isElite4: true
  },
  {
    name: "Bruno",
    class: "Elite Four",
    sprite: "🥊",
    party: [
      { speciesId: 95, level: 53 },
      { speciesId: 107, level: 55 },
      { speciesId: 106, level: 55 },
      { speciesId: 95, level: 56 },
      { speciesId: 68, level: 58 }
    ],
    reward: 0,
    beforeBattleText: "I am Bruno of the Elite Four! Through rigorous training, people and Pokémon can become stronger!",
    afterBattleText: "My job is done! Go face your next challenge!",
    isElite4: true
  },
  {
    name: "Agatha",
    class: "Elite Four",
    sprite: "👻",
    party: [
      { speciesId: 94, level: 56 },
      { speciesId: 42, level: 56 },
      { speciesId: 93, level: 55 },
      { speciesId: 24, level: 58 },
      { speciesId: 94, level: 60 }
    ],
    reward: 0,
    beforeBattleText: "I am Agatha of the Elite Four! I hear Oak's taken a liking to you! That old duff was once tough and handsome!",
    afterBattleText: "Oh, my! You're something special, child! You can go on to the next room!",
    isElite4: true
  },
  {
    name: "Lance",
    class: "Elite Four",
    sprite: "🐉",
    party: [
      { speciesId: 130, level: 58 },
      { speciesId: 148, level: 56 },
      { speciesId: 142, level: 56 },
      { speciesId: 148, level: 60 },
      { speciesId: 149, level: 62 }
    ],
    reward: 0,
    beforeBattleText: "Ah! I've heard about you! I lead the Elite Four! I can tell because you're here!",
    afterBattleText: "That's it! I hate to admit it, but you are a Pokémon master!",
    isElite4: true
  }
].map(t => ({ ...t, reward: calcReward(t.party, t.class) }));

export const CHAMPION: Trainer = {
  name: "Blue",
  class: "Champion",
  sprite: "👑",
  party: [
    { speciesId: 18, level: 59 },
    { speciesId: 65, level: 57 },
    { speciesId: 112, level: 61 },
    { speciesId: 130, level: 61 },
    { speciesId: 103, level: 63 },
    { speciesId: 6, level: 65 }
  ],
  reward: 0,
  beforeBattleText: "Hey! I was looking forward to seeing you! My rival should be strong to keep me sharp! Let's go!",
  afterBattleText: "I can't believe it! I lost to you! You're the new Champion!",
  isChampion: true
};
CHAMPION.reward = calcReward(CHAMPION.party, CHAMPION.class);

// Trainer types available by route with appropriate levels
export const ROUTE_TRAINER_TYPES: Record<number, { classes: string[]; minLevel: number; maxLevel: number }> = {
  1: { classes: ["Youngster", "Lass", "Bug Catcher"], minLevel: 3, maxLevel: 6 },
  2: { classes: ["Youngster", "Lass", "Bug Catcher"], minLevel: 5, maxLevel: 9 },
  3: { classes: ["Youngster", "Lass", "Bug Catcher", "Hiker"], minLevel: 8, maxLevel: 12 },
  4: { classes: ["Lass", "Hiker", "Jr. Trainer"], minLevel: 10, maxLevel: 14 },
  5: { classes: ["Jr. Trainer", "Picnicker", "Camper"], minLevel: 12, maxLevel: 16 },
  6: { classes: ["Jr. Trainer", "Picnicker", "Bug Catcher"], minLevel: 14, maxLevel: 18 },
  7: { classes: ["Gambler", "Jr. Trainer", "Lass"], minLevel: 16, maxLevel: 21 },
  8: { classes: ["Super Nerd", "Lass", "Gambler", "Biker"], minLevel: 18, maxLevel: 23 },
  9: { classes: ["Hiker", "Bug Catcher", "Jr. Trainer"], minLevel: 17, maxLevel: 22 },
  10: { classes: ["Hiker", "PokeManiac", "Super Nerd"], minLevel: 19, maxLevel: 25 },
  11: { classes: ["Youngster", "Gambler", "Engineer"], minLevel: 21, maxLevel: 26 },
  12: { classes: ["Fisherman", "Rocker", "Jr. Trainer"], minLevel: 23, maxLevel: 28 },
  13: { classes: ["Bird Keeper", "Jr. Trainer", "Beauty"], minLevel: 25, maxLevel: 30 },
  14: { classes: ["Bird Keeper", "Biker", "Beauty"], minLevel: 27, maxLevel: 32 },
  15: { classes: ["Jr. Trainer", "PokeManiac", "Beauty"], minLevel: 28, maxLevel: 33 },
  16: { classes: ["Biker", "Cue Ball", "Bird Keeper"], minLevel: 29, maxLevel: 34 },
  17: { classes: ["Cue Ball", "Biker", "Bird Keeper"], minLevel: 30, maxLevel: 35 },
  18: { classes: ["Bird Keeper", "Beauty", "Gambler"], minLevel: 31, maxLevel: 36 },
  19: { classes: ["Swimmer", "Beauty", "Tuber"], minLevel: 32, maxLevel: 37 },
  20: { classes: ["Swimmer", "Beauty", "Bird Keeper"], minLevel: 34, maxLevel: 39 },
  21: { classes: ["Fisherman", "Swimmer", "Gambler"], minLevel: 35, maxLevel: 40 },
  22: { classes: ["Rival", "Bird Keeper", "Fisherman"], minLevel: 38, maxLevel: 43 },
  23: { classes: ["Ace Trainer", "Black Belt", "Bird Keeper"], minLevel: 41, maxLevel: 46 },
  24: { classes: ["Rocket", "Jr. Trainer", "Lass"], minLevel: 14, maxLevel: 19 },
  25: { classes: ["Hiker", "Super Nerd", "Youngster"], minLevel: 15, maxLevel: 20 }
};

// Trainer names by class
const TRAINER_NAMES: Record<string, string[]> = {
  "Bug Catcher": ["Rick", "Doug", "Sammy", "Colton", "Greg", "James", "Kent", "Robby", "Cale", "Jose"],
  "Youngster": ["Joey", "Mikey", "Albert", "Gordon", "Warren", "Jimmy", "Owen", "Jason", "Calvin", "Dillon"],
  "Lass": ["Janice", "Sally", "Robin", "Crissy", "Miriam", "Ali", "Reli", "Haley", "Ann", "Dawn"],
  "Hiker": ["Marcos", "Franklin", "Nob", "Wayne", "Brice", "Clark", "Trent", "Dudley", "Allen", "Eric"],
  "Jr. Trainer": ["Rick", "Flint", "Cristin", "Miriam", "Luis", "Dana", "Hillary", "Shane", "Josh", "Ben"],
  "Picnicker": ["Cindy", "Debra", "Heidi", "Edna", "Gwen", "Isabelle", "Carol", "Gina", "Tanya", "Susie"],
  "Camper": ["Drew", "Brady", "Ethan", "Shane", "Flint", "Lloyd", "Devan", "Steve", "Ted", "Ellis"],
  "Gambler": ["Hugo", "Jasper", "Dirk", "Billy", "Darian", "Stan", "Rich", "Phil", "Sean", "Lou"],
  "Super Nerd": ["Miguel", "Aidan", "Glenn", "Leslie", "Jovan", "Erik", "Avery", "Dave", "Ricky", "Zac"],
  "Engineer": ["Baily", "Braxton", "Dylan", "Bernie", "Hugo", "Howard", "Camden", "Trevor", "Gus", "Fred"],
  "Fisherman": ["Dale", "Barny", "Liam", "Claude", "Wade", "Nolan", "Kaden", "Josh", "Carter", "Elliot"],
  "Bird Keeper": ["Rod", "Abe", "Bob", "Boris", "Jacob", "Roger", "Carter", "Mitch", "Beck", "Marlon"],
  "Beauty": ["Bridget", "Tamia", "Lori", "Lola", "Sheila", "Grace", "Olivia", "Charlotte", "Naomi", "Cassie"],
  "Biker": ["Lukas", "Malik", "Isaac", "Gerald", "Ernest", "Alex", "Ruben", "Jaxon", "William", "Jesse"],
  "Cue Ball": ["Koji", "Luke", "Camden", "Isaiah", "Zeek", "Chad", "Zack", "Issac", "Raul", "Colton"],
  "Swimmer": ["Darrin", "Mathew", "Tony", "David", "Douglas", "Dirk", "Nori", "Mymo", "Barry", "Kirk"],
  "PokeManiac": ["Mark", "Herman", "Cooper", "Steve", "Dawson", "Ashton", "Winston", "Miller", "Derek", "Aiden"],
  "Rocket": ["Grunt", "Grunt", "Grunt", "Grunt", "Grunt", "Grunt", "Grunt", "Grunt", "Grunt", "Grunt"],
  "Black Belt": ["Kenji", "Lao", "Nob", "Kiyo", "Wai", "Lung", "Luk", "Chong", "Takashi", "Daisuke"],
  "Ace Trainer": ["Caleb", "Derek", "Ivan", "Allen", "Carter", "Dana", "Catherine", "Annie", "Wendy", "Alice"],
  "Rival": ["Blue", "Gary"],
  "Tuber": ["Jaxon", "Rory", "Alexis", "Amira"],
  "Rocker": ["Luca", "Billy", "Trent", "Vince"],
  "Juggler": ["Kirk", "Nate", "Shawn", "Gregory"],
  "Psychic": ["Johan", "Tyron", "Cameron", "Preston"],
  "Scientist": ["Ted", "Jerry", "Connor", "Parker"],
  "Gentleman": ["Arthur", "Henry", "Lamar", "Brooks"],
  "Lady": ["Vivian", "Gillian", "Rebecca", "Clara"],
  "Rich Boy": ["Winston", "Jason", "Dawson", "Cody"],
  "Cool Trainer": ["Kevin", "Steve", "Vincent", "Lewis"],
  "Veteran": ["Grant", "Hugo", "Enzo", "Ray"]
};

// Pokemon pools by trainer class (simplified - common Pokemon for each type)
const CLASS_POKEMON_POOLS: Record<string, number[]> = {
  "Bug Catcher": [10, 11, 12, 13, 14, 15, 46, 47, 48, 49, 123],
  "Youngster": [16, 17, 18, 19, 20, 21, 22, 29, 30, 32, 33, 39, 40, 52, 53],
  "Lass": [16, 17, 18, 25, 26, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
  "Hiker": [50, 51, 74, 75, 76, 95, 111, 112],
  "Jr. Trainer": [1, 2, 3, 4, 5, 6, 7, 8, 9, 16, 17, 18, 25, 26, 27, 28, 29, 30, 32, 33],
  "Picnicker": [25, 26, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 52, 53],
  "Camper": [4, 5, 6, 19, 20, 21, 22, 25, 26, 27, 28, 32, 33, 34, 56, 57],
  "Gambler": [55, 57, 58, 59, 77, 78, 81, 82, 100, 101, 125, 126],
  "Super Nerd": [81, 82, 88, 89, 100, 101, 109, 110, 137],
  "Engineer": [81, 82, 100, 101, 125],
  "Fisherman": [72, 73, 90, 91, 116, 117, 118, 119, 120, 121, 129, 130],
  "Bird Keeper": [16, 17, 18, 21, 22, 41, 42, 83, 84, 85],
  "Beauty": [29, 30, 31, 35, 36, 37, 38, 39, 40, 44, 45, 61, 62, 86, 87, 124],
  "Biker": [19, 20, 88, 89, 109, 110],
  "Cue Ball": [56, 57, 66, 67, 68, 106, 107],
  "Swimmer": [54, 55, 60, 61, 62, 72, 73, 86, 87, 90, 91, 116, 117, 118, 119, 120, 121],
  "PokeManiac": [30, 31, 33, 34, 104, 105, 111, 112],
  "Rocket": [19, 20, 23, 24, 41, 42, 50, 51, 88, 89, 109, 110],
  "Black Belt": [56, 57, 66, 67, 68, 106, 107],
  "Ace Trainer": [3, 6, 9, 18, 20, 22, 26, 28, 31, 34, 36, 38, 40, 45, 53, 59, 62, 65, 68, 76, 83, 85, 87, 91, 94, 101, 103, 112, 117, 119, 121, 123, 130, 149],
  "Rival": [18, 20, 22, 26, 28, 38, 40, 59, 65, 68, 76, 82, 85, 87, 91, 94, 101, 103, 112, 115, 121, 130, 143, 149],
  "Tuber": [54, 55, 60, 61, 72, 73, 86, 87, 90, 91, 116, 117, 118, 119, 120, 121, 129, 130],
  "Rocker": [25, 26, 81, 82, 100, 101, 125],
  "Juggler": [63, 64, 65, 96, 97, 122],
  "Psychic": [63, 64, 65, 79, 80, 96, 97, 102, 103, 121, 124],
  "Scientist": [81, 82, 88, 89, 100, 101, 109, 110, 137],
  "Gentleman": [20, 26, 36, 38, 40, 53, 59, 101, 115, 128],
  "Lady": [25, 26, 35, 36, 37, 38, 39, 40, 113],
  "Rich Boy": [20, 26, 36, 38, 53, 59, 101, 115, 128],
  "Cool Trainer": [3, 6, 9, 18, 22, 26, 28, 31, 34, 36, 38, 40, 45, 53, 59, 62, 65, 68, 76, 83, 85, 87, 91, 94, 101, 103, 112, 117, 119, 121, 123, 130, 149],
  "Veteran": [3, 6, 9, 18, 22, 26, 28, 31, 34, 36, 38, 40, 45, 53, 59, 62, 65, 68, 76, 83, 85, 87, 91, 94, 101, 103, 112, 117, 119, 121, 123, 130, 143, 149]
};

// Generate a random trainer for a route
export function generateRouteTrainer(route: number): Trainer {
  const routeData = ROUTE_TRAINER_TYPES[route] || ROUTE_TRAINER_TYPES[1];
  const trainerClass = routeData.classes[Math.floor(Math.random() * routeData.classes.length)];
  const names = TRAINER_NAMES[trainerClass] || TRAINER_NAMES["Youngster"];
  const name = names[Math.floor(Math.random() * names.length)];
  
  // Generate party
  const partySize = Math.floor(Math.random() * 2) + 1; // 1-2 Pokemon early routes, more later
  const pokemonPool = CLASS_POKEMON_POOLS[trainerClass] || CLASS_POKEMON_POOLS["Youngster"];
  const party: { speciesId: number; level: number }[] = [];
  
  for (let i = 0; i < partySize; i++) {
    const speciesId = pokemonPool[Math.floor(Math.random() * pokemonPool.length)];
    const level = Math.floor(Math.random() * (routeData.maxLevel - routeData.minLevel + 1)) + routeData.minLevel;
    party.push({ speciesId, level });
  }
  
  const trainer: Trainer = {
    name,
    class: trainerClass,
    sprite: getTrainerSprite(trainerClass),
    party,
    reward: 0,
    beforeBattleText: getTrainerQuote(trainerClass, true),
    afterBattleText: getTrainerQuote(trainerClass, false)
  };
  
  trainer.reward = calcReward(party, trainerClass);
  return trainer;
}

function getTrainerSprite(trainerClass: string): string {
  const sprites: Record<string, string> = {
    "Bug Catcher": "🐛",
    "Youngster": "👦",
    "Lass": "👧",
    "Hiker": "🥾",
    "Jr. Trainer": "🎒",
    "Picnicker": "🧺",
    "Camper": "⛺",
    "Gambler": "🎰",
    "Super Nerd": "🤓",
    "Engineer": "🔧",
    "Fisherman": "🎣",
    "Bird Keeper": "🐦",
    "Beauty": "💅",
    "Biker": "🏍️",
    "Cue Ball": "🎱",
    "Swimmer": "🏊",
    "PokeManiac": "🦕",
    "Rocket": "🚀",
    "Black Belt": "🥋",
    "Ace Trainer": "🌟",
    "Rival": "😤",
    "Tuber": "🛟",
    "Rocker": "🎸",
    "Juggler": "🤹",
    "Psychic": "🔮",
    "Scientist": "🧪",
    "Gentleman": "🎩",
    "Lady": "👒",
    "Rich Boy": "💎",
    "Cool Trainer": "😎",
    "Veteran": "🏆"
  };
  return sprites[trainerClass] || "👤";
}

function getTrainerQuote(trainerClass: string, before: boolean): string {
  const quotes: Record<string, { before: string[]; after: string[] }> = {
    "Bug Catcher": {
      before: ["I love bug Pokemon! Let me show you!", "My bugs will swarm you!", "Bug Pokemon are the best!"],
      after: ["My bugs got squashed!", "Even bugs lose sometimes...", "I'll find stronger bugs!"]
    },
    "Youngster": {
      before: ["I'm training hard to be the best!", "My Pokemon and I are ready!", "Let's have a great battle!"],
      after: ["I need more training...", "You're really strong!", "I'll get stronger and win next time!"]
    },
    "Lass": {
      before: ["My Pokemon are super cute!", "Don't underestimate me!", "Let's battle!"],
      after: ["Aww, my poor Pokemon!", "You're too strong!", "I'll train harder!"]
    },
    "Hiker": {
      before: ["I just came down from the mountain!", "My Pokemon are as tough as rocks!", "Let's rock and roll!"],
      after: ["You're tougher than a boulder!", "I got flattened!", "Back to the mountains for training!"]
    },
    "Gambler": {
      before: ["I'm feeling lucky today!", "Wanna bet on this battle?", "Time to double my money!"],
      after: ["My luck ran out!", "I should've folded!", "That's a losing hand!"]
    },
    "Beauty": {
      before: ["My Pokemon are as beautiful as me!", "Don't ruin my makeup!", "Let's have an elegant battle!"],
      after: ["You ruined my look!", "How could you!", "Beauty is only skin deep anyway..."]
    },
    "Rich Boy": {
      before: ["My Pokemon are the finest money can buy!", "I'll show you what real training looks like!", "Prepare to lose!"],
      after: ["Money can't buy everything...", "I'll hire a better trainer!", "This is unacceptable!"]
    },
    "Rocket": {
      before: ["Team Rocket rules!", "Hand over your Pokemon!", "We're stealing your Pokemon!"],
      after: ["Team Rocket blasts off again!", "We'll be back!", "This isn't over!"]
    },
    "Ace Trainer": {
      before: ["Only the elite make it this far!", "Show me what you've got!", "This will be a real battle!"],
      after: ["You might have what it takes!", "Impressive skills!", "You're championship material!"]
    }
  };
  
  const classQuotes = quotes[trainerClass] || quotes["Youngster"];
  const quoteList = before ? classQuotes.before : classQuotes.after;
  return quoteList[Math.floor(Math.random() * quoteList.length)];
}

// Keep old route trainers for compatibility
export const ROUTE_TRAINERS: Trainer[][] = [];
