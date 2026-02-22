export type PokemonType =
  | "Normal" | "Fire" | "Water" | "Electric" | "Grass" | "Ice"
  | "Fighting" | "Poison" | "Ground" | "Flying" | "Psychic" | "Bug"
  | "Rock" | "Ghost" | "Dragon" | "Dark" | "Steel" | "Fairy";

export type MoveCategory = "Physical" | "Special" | "Status";

// Primary status conditions (only one at a time) - Gen 1 style short codes
export type PrimaryStatus =
  | "none"
  | "psn"    // Poison
  | "tox"    // Badly poisoned (Toxic)
  | "brn"    // Burn
  | "par"    // Paralysis
  | "slp"    // Sleep
  | "frz";   // Freeze

// Volatile status conditions (can stack)
export interface VolatileStatus {
  confusion?: number;    // turns remaining (2-5)
  flinch?: boolean;      // loses next turn
  trapped?: { turns: number; moveId: number };  // trapped for X turns
  leechSeed?: boolean;   // seeded for Leech Seed
  seededBy?: string;     // name of Pokemon that seeded
  toxicTurns?: number;   // turns of toxic damage accumulation
  sleepTurns?: number;   // turns remaining for sleep
}

// For backward compatibility
export type StatusEffect = PrimaryStatus;

export type StatKey = "hp" | "attack" | "defense" | "spAttack" | "spDefense" | "speed" | "accuracy" | "evasion";

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface Evolution {
  method: "level" | "stone" | "trade";
  requirement?: number | string;
  evolvesTo: number;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  types: string[];
  stats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  cr: number;
  xp: number;
  grow: "fast" | "medium" | "slow" | "mediumSlow" | "slowFast";
  evo: {
    m: "lvl" | "stone" | "trade";
    r?: number | string;
    t: number;
  } | null;
  ab?: string;
}

// Move effect types for data-driven move resolution
export type MoveEffectType = 
  | "damage"
  | "status"           // Apply primary status
  | "volatile"         // Apply volatile status (confusion, etc.)
  | "statStage"        // Modify stat stages
  | "heal"             // Heal user
  | "drain"            // Drain HP from target
  | "recoil"           // Recoil damage to user
  | "multiStrike"      // Hit 2-5 times
  | "leechSeed"        // Plant leech seed
  | "trap";            // Trap target

export interface MoveEffect {
  type: MoveEffectType;
  chance?: number;                    // % chance to apply (for secondary effects)
  // For status effects
  status?: PrimaryStatus;
  // For volatile status
  volatile?: keyof VolatileStatus;
  volatileTurns?: number;             // for confusion/trap turns (usually 2-5)
  // For stat stage changes
  statChanges?: { stat: keyof StatStages; stages: number }[];
  // For healing/drain/recoil (percentage)
  percent?: number;
  // For multi-strike moves
  minHits?: number;
  maxHits?: number;
  // For trapping
  trapTurns?: number;
}

export interface Move {
  id: number;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  currentPp: number;
  description: string;
  priority?: number;
  effects?: MoveEffect[];  // New data-driven effects array
  // Legacy effect support (for backward compatibility)
  effect?: {
    type: string;
    chance?: number;
    statChange?: { stat: keyof StatStages; stages: number }[];
    status?: PrimaryStatus;
    healPercent?: number;
    recoilPercent?: number;
    minHits?: number;
    maxHits?: number;
  };
}

export interface StatModifiers {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  accuracy: number;
  evasion: number;
}

export interface Pokemon {
  speciesId: number;
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  stats: {
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  // Primary status (only one at a time)
  status: PrimaryStatus;
  // Volatile status (can stack)
  volatileStatus: VolatileStatus;
  // Stat stages (clamped to -6..+6) - NEW
  statStages: StatStages;
  // Legacy stat modifiers - for backward compatibility
  statModifiers?: StatModifiers;
  // Legacy fields - for backward compatibility
  sleepTurns?: number;
  toxicTurns?: number;
  confusionTurns?: number;
  leechSeed?: boolean;
  moves: Move[];
  exp: number;
  types: PokemonType[];
  ivs: Stats;
  evs: Stats;
  ability?: string;
  heldItem?: Item | null;
}

// Stat stages (Gen 1-3 style) - clamped to [-6, +6]
export interface StatStages {
  atk: number;  // Attack
  def: number;  // Defense
  spa: number;  // Special Attack
  spd: number;  // Special Defense
  spe: number;  // Speed
  acc: number;  // Accuracy
  eva: number;  // Evasion
}

// Backward-compatible stat modifiers (old format)
export interface StatModifiers {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  accuracy: number;
  evasion: number;
}

export interface Item {
  id: number;
  name: string;
  type: "PokeBall" | "Potion" | "StatusHeal" | "TM" | "HM" | "KeyItem" | "Evolution" | "Other";
  description: string;
  price: number;
  sellPrice: number;
  effect?: {
    type: string;
    value?: number | string;
    moveId?: number;
  };
}

export interface BagItem {
  item: Item;
  quantity: number;
}

export interface BattleState {
  playerActive: Pokemon;
  opponentActive: Pokemon;
  playerParty: Pokemon[];
  opponentParty: Pokemon[];
  turn: number;
  isWild: boolean;
  messageLog: string[];
  canEscape: boolean;
  opponentTrainerName?: string;
  battleType: "wild" | "trainer" | "gym" | "elite4" | "champion";
}

// Trainer class payout multipliers (base payout = average level * 20 * multiplier)
export const TRAINER_CLASS_MULTIPLIERS: Record<string, number> = {
  "Bug Catcher": 0.5,
  "Youngster": 0.6,
  "Lass": 0.6,
  "Camper": 0.7,
  "Picnicker": 0.7,
  "Twins": 0.7,
  "Fisherman": 0.8,
  "Hiker": 0.9,
  "Swimmer": 0.8,
  "Beauty": 1.2,
  "Gambler": 1.5,
  "Gentleman": 1.8,
  "Lady": 1.8,
  "Rich Boy": 2.0,
  "Socialite": 1.8,
  "Ace Trainer": 1.5,
  "Black Belt": 1.3,
  "Battle Girl": 1.3,
  "Engineer": 1.0,
  "Super Nerd": 1.0,
  "Scientist": 1.1,
  "Psychic": 1.2,
  "Channeler": 1.1,
  "Rocker": 1.0,
  "Juggler": 1.1,
  "Tamer": 1.2,
  "Bird Keeper": 0.9,
  "Sailor": 0.9,
  "PokeManiac": 1.3,
  "Rocket": 1.0,
  "Cue Ball": 1.1,
  "Biker": 1.0,
  "Burglar": 1.2,
  "Jr. Trainer": 0.8,
  "Crush Girl": 1.0,
  "Tuber": 0.5,
  "School Kid": 0.6,
  "Teacher": 0.9,
  "Guitarist": 1.0,
  "Kindler": 0.9,
  "Ruin Maniac": 1.1,
  "Aroma Lady": 0.8,
  "Collector": 1.2,
  "Parasol Lady": 0.9,
  "Bug Maniac": 0.8,
  "Ninja Boy": 0.8,
  "Dragon Tamer": 1.4,
  "Cool Trainer": 1.4,
  "Veteran": 1.6,
  "Gym Leader": 2.5,
  "Elite Four": 3.0,
  "Champion": 4.0,
  "Rival": 1.5
};

export interface Trainer {
  name: string;
  class: string;
  sprite: string;
  party: { speciesId: number; level: number; moves?: number[] }[];
  reward: number;
  beforeBattleText: string;
  afterBattleText: string;
  isGymLeader?: boolean;
  isElite4?: boolean;
  isChampion?: boolean;
  badge?: string;
}

export interface Gym {
  name: string;
  leader: Trainer;
  city: string;
  badge: string;
  tmReward: number;
}

export type GameScreen = 
  | "title"
  | "starter"
  | "overworld"
  | "battle"
  | "party"
  | "bag"
  | "pokemart"
  | "pokecenter"
  | "pokemonDetail"
  | "evolution"
  | "gameOver"
  | "victory";

// PC Storage structure
export interface PCStorage {
  currentBoxIndex: number;
  boxes: Pokemon[][];  // Each box is an array of Pokemon
}

// Pending move learn state
export interface PendingMoveLearn {
  pokemon: Pokemon;
  newMove: Move;
  source: 'levelup' | 'tm';
}

export interface GameState {
  screen: GameScreen;
  playerName: string;
  playerParty: Pokemon[];
  pcStorage: PCStorage;
  bag: BagItem[];
  badges: string[];
  money: number;
  currentLocation: string;
  defeatedTrainers: string[];
  gameProgress: number;
  selectedPokemonIndex: number;
  battleState?: BattleState;
  pendingMoveLearn?: PendingMoveLearn | null;
}

export const TYPE_EFFECTIVENESS: Partial<Record<PokemonType, Partial<Record<PokemonType, number>>>> = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Grass: 2, Ice: 2, Bug: 2, Steel: 2, Fire: 0.5, Water: 0.5, Rock: 0.5, Dragon: 0.5 },
  Water: { Fire: 2, Ground: 2, Rock: 2, Water: 0.5, Grass: 0.5, Dragon: 0.5 },
  Electric: { Water: 2, Flying: 2, Electric: 0.5, Grass: 0.5, Dragon: 0.5, Ground: 0 },
  Grass: { Water: 2, Ground: 2, Rock: 2, Fire: 0.5, Grass: 0.5, Poison: 0.5, Flying: 0.5, Bug: 0.5, Dragon: 0.5, Steel: 0.5 },
  Ice: { Grass: 2, Ground: 2, Flying: 2, Dragon: 2, Fire: 0.5, Water: 0.5, Ice: 0.5, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Rock: 2, Dark: 2, Steel: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Fairy: 0.5, Ghost: 0 },
  Poison: { Grass: 2, Fairy: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0 },
  Ground: { Fire: 2, Electric: 2, Poison: 2, Rock: 2, Steel: 2, Grass: 0.5, Bug: 0.5, Flying: 0 },
  Flying: { Grass: 2, Fighting: 2, Bug: 2, Electric: 0.5, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Steel: 0.5, Dark: 0 },
  Bug: { Grass: 2, Psychic: 2, Dark: 2, Fire: 0.5, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Ghost: 0.5, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Flying: 2, Bug: 2, Fighting: 0.5, Ground: 0.5, Steel: 0.5 },
  Ghost: { Psychic: 2, Ghost: 2, Dark: 0.5, Normal: 0 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Psychic: 2, Ghost: 2, Fighting: 0.5, Dark: 0.5, Fairy: 0.5 },
  Steel: { Ice: 2, Rock: 2, Fairy: 2, Fire: 0.5, Water: 0.5, Electric: 0.5, Steel: 0.5 },
  Fairy: { Fighting: 2, Dragon: 2, Dark: 2, Fire: 0.5, Poison: 0.5, Steel: 0.5 },
};

export function getTypeEffectiveness(moveType: PokemonType, defenderTypes: PokemonType[]): number {
  return defenderTypes.reduce((mult, defType) => {
    const m = TYPE_EFFECTIVENESS[moveType]?.[defType] ?? 1;
    return mult * m;
  }, 1);
}

export function calculateHP(baseHp: number, level: number, iv: number, ev: number): number {
  return Math.floor(((2 * baseHp + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

export function calculateStat(base: number, level: number, iv: number, ev: number): number {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
}

export function getNatureModifier(nature: string, stat: StatKey): number {
  const natureModifiers: Record<string, { increased?: StatKey; decreased?: StatKey }> = {
    Adamant: { increased: "attack", decreased: "spAttack" },
    Bold: { increased: "defense", decreased: "attack" },
    Brave: { increased: "attack", decreased: "speed" },
    Calm: { increased: "spDefense", decreased: "attack" },
    Careful: { increased: "spDefense", decreased: "spAttack" },
    Gentle: { increased: "spDefense", decreased: "defense" },
    Hasty: { increased: "speed", decreased: "defense" },
    Impish: { increased: "defense", decreased: "spAttack" },
    Jolly: { increased: "speed", decreased: "spAttack" },
    Lax: { increased: "defense", decreased: "spDefense" },
    Lonely: { increased: "attack", decreased: "defense" },
    Mild: { increased: "spAttack", decreased: "defense" },
    Modest: { increased: "spAttack", decreased: "attack" },
    Naive: { increased: "speed", decreased: "spDefense" },
    Naughty: { increased: "attack", decreased: "spDefense" },
    Quiet: { increased: "spAttack", decreased: "speed" },
    Rash: { increased: "spAttack", decreased: "spDefense" },
    Relaxed: { increased: "defense", decreased: "speed" },
    Sassy: { increased: "spDefense", decreased: "speed" },
    Serious: {},
    Timid: { increased: "speed", decreased: "attack" },
  };
  
  const mod = natureModifiers[nature];
  if (mod?.increased === stat) return 1.1;
  if (mod?.decreased === stat) return 0.9;
  return 1;
}

export function calculateExperienceGain(defeatedSpecies: PokemonSpecies, defeatedLevel: number, isTrainerBattle: boolean): number {
  const baseExp = defeatedSpecies.xp ?? 64;
  const trainerBonus = isTrainerBattle ? 1.5 : 1;
  return Math.max(1, Math.floor((baseExp * defeatedLevel * trainerBonus) / 7));
}

export function getExpForLevel(level: number, growthRate: string): number {
  switch (growthRate) {
    case "fast":
      return Math.floor((4 * Math.pow(level, 3)) / 5);
    case "slow":
      return Math.floor((5 * Math.pow(level, 3)) / 4);
    case "medium":
    default:
      return Math.pow(level, 3);
  }
}

export function getLevelFromExperience(exp: number, growthRate: string): number {
  let level = 1;
  while (getExpForLevel(level + 1, growthRate) <= exp && level < 100) {
    level++;
  }
  return level;
}
