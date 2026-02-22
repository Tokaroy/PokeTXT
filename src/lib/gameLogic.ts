import type { 
  Pokemon, 
  Move, 
  Stats, 
  PrimaryStatus, 
  VolatileStatus, 
  Item, 
  StatStages,
  MoveEffect
} from "@/types";
import { getPokemonById } from "@/data/pokemon";
import { getMoveById } from "@/data/moves";
import { getTypeEffectiveness, getExpForLevel, getLevelFromExperience } from "@/types";
import { getMovesForLevel, getNewMovesAtLevel } from "@/data/moveLearnsets";

// ============================================
// STAT STAGE HELPERS (immutable)
// ============================================

/** Clamp stat stage to [-6, +6] */
export const clampStage = (stage: number): number => {
  return Math.max(-6, Math.min(6, stage));
};

/** Apply stat stage change immutably. Returns { newPokemon, message, success } */
export const applyStageChange = (
  pokemon: Pokemon,
  stat: keyof StatStages,
  stages: number
): { pokemon: Pokemon; message: string; success: boolean } => {
  const currentStage = pokemon.statStages[stat];
  const newStage = clampStage(currentStage + stages);
  const actualChange = newStage - currentStage;

  if (actualChange === 0) {
    const direction = stages > 0 ? "higher" : "lower";
    return {
      pokemon,
      message: `${pokemon.name}'s ${getStatDisplayName(stat)} won't go any ${direction}!`,
      success: false
    };
  }

  const newPokemon: Pokemon = {
    ...pokemon,
    statStages: {
      ...pokemon.statStages,
      [stat]: newStage
    }
  };

  const message = buildStatChangeMessage(pokemon.name, stat, actualChange);
  return { pokemon: newPokemon, message, success: true };
};

/** Get display name for stat */
const getStatDisplayName = (stat: keyof StatStages): string => {
  const names: Record<keyof StatStages, string> = {
    atk: "Attack",
    def: "Defense",
    spa: "Special Attack",
    spd: "Special Defense",
    spe: "Speed",
    acc: "Accuracy",
    eva: "Evasion"
  };
  return names[stat];
};

/** Build stat change message based on magnitude */
const buildStatChangeMessage = (name: string, stat: keyof StatStages, change: number): string => {
  const statName = getStatDisplayName(stat);
  const absChange = Math.abs(change);
  
  if (change > 0) {
    if (absChange >= 3) return `${name}'s ${statName} rose drastically!`;
    if (absChange === 2) return `${name}'s ${statName} rose sharply!`;
    return `${name}'s ${statName} rose!`;
  } else {
    if (absChange >= 3) return `${name}'s ${statName} severely fell!`;
    if (absChange === 2) return `${name}'s ${statName} harshly fell!`;
    return `${name}'s ${statName} fell!`;
  }
};

// ============================================
// PRIMARY STATUS HELPERS (immutable)
// ============================================

/** Check if Pokemon is immune to a status condition */
const isImmuneToStatus = (pokemon: Pokemon, status: PrimaryStatus): boolean => {
  switch (status) {
    case "psn":
    case "tox":
      return pokemon.types.includes("Poison") || pokemon.types.includes("Steel");
    case "brn":
      return pokemon.types.includes("Fire");
    case "par":
      return pokemon.types.includes("Electric");
    case "frz":
      return pokemon.types.includes("Ice");
    default:
      return false;
  }
};

/** Get status application message */
const getStatusMessage = (name: string, status: PrimaryStatus): string => {
  const messages: Record<PrimaryStatus, string> = {
    none: "",
    psn: `${name} was poisoned!`,
    tox: `${name} was badly poisoned!`,
    brn: `${name} was burned!`,
    par: `${name} was paralyzed! It may be unable to move!`,
    slp: `${name} fell asleep!`,
    frz: `${name} was frozen solid!`
  };
  return messages[status] || "";
};

/** Apply primary status immutably. Returns { newPokemon, message, success } */
export const applyPrimaryStatus = (
  pokemon: Pokemon,
  status: PrimaryStatus
): { pokemon: Pokemon; message: string; success: boolean } => {
  // Can't apply "none" as a status
  if (status === "none") {
    return { pokemon, message: "", success: false };
  }

  // Check if already has a status
  if (pokemon.status !== "none") {
    return {
      pokemon,
      message: `But it failed!`,
      success: false
    };
  }

  // Check type immunity
  if (isImmuneToStatus(pokemon, status)) {
    return {
      pokemon,
      message: `It doesn't affect ${pokemon.name}...`,
      success: false
    };
  }

  // Apply status
// Note: Some statuses need per-status counters stored in volatileStatus.
const vs = pokemon.volatileStatus ?? {};
const newVolatile: VolatileStatus = {
  ...vs,
  // Sleep lasts 1-5 turns (Gen III-style); store remaining turns.
  ...(status === "slp" ? { sleepTurns: Math.floor(Math.random() * 5) + 1 } : {}),
  // Badly poisoned counter starts at 1 (damage = 1/16 on first tick)
  ...(status === "tox" ? { toxicTurns: 1 } : {}),
};

const newPokemon: Pokemon = {
  ...pokemon,
  status,
  volatileStatus: newVolatile
};

  // Struggle: recoil is 1/4 of the user's max HP (not based on damage)
  if (move.name === "Struggle") {
    const recoil = Math.floor(attacker.maxHp / 4);
    attacker = { ...attacker, currentHp: Math.max(0, attacker.currentHp - recoil) };
    messages.push(`${attacker.name} was hurt by recoil!`);
  }

  return {
    pokemon: newPokemon,
    message: getStatusMessage(pokemon.name, status),
    success: true
  };
};

// ============================================
// VOLATILE STATUS HELPERS (immutable)
// ============================================

/** Apply volatile status immutably. Returns { newPokemon, message, success } */
export const applyVolatile = (
  pokemon: Pokemon,
  volatileType: keyof VolatileStatus,
  turns?: number
): { pokemon: Pokemon; message: string; success: boolean } => {
  // Check if already has this volatile status
  if (pokemon.volatileStatus[volatileType]) {
    return {
      pokemon,
      message: `But it failed!`,
      success: false
    };
  }

  const newVolatile: VolatileStatus = {
    ...pokemon.volatileStatus,
    [volatileType]: turns ?? true
  };

  const newPokemon: Pokemon = {
    ...pokemon,
    volatileStatus: newVolatile
  };

  let message = "";
  switch (volatileType) {
    case "confusion":
      message = `${pokemon.name} became confused!`;
      break;
    case "flinch":
      message = `${pokemon.name} flinched!`;
      break;
    case "leechSeed":
      message = `${pokemon.name} was seeded!`;
      break;
    case "trapped":
      message = `${pokemon.name} was trapped!`;
      break;
  }

  return { pokemon: newPokemon, message, success: true };
};

// ============================================
// MOVE EXECUTION (immutable)
// ============================================

/** Result of executing a move */
export interface MoveResult {
  attacker: Pokemon;
  defender: Pokemon;
  messages: string[];
  damageDealt: number;
  hits: number;
  fainted: boolean;
}

/** Execute a move and return immutable results */
export const executeMove = (
  attacker: Pokemon,
  defender: Pokemon,
  move: Move
): MoveResult => {
  const messages: string[] = [`${attacker.name} used ${move.name}!`];
  let damageDealt = 0;
  let hits = 0;

  // Check accuracy (moves with 0 accuracy always hit)
  if (move.accuracy > 0) {
    const accMultiplier = getStageMultiplier(attacker.statStages.acc);
    const evaMultiplier = getStageMultiplier(defender.statStages.eva);
    const hitChance = move.accuracy * (accMultiplier / evaMultiplier);
    
    if (Math.random() * 100 > hitChance) {
      messages.push(`${attacker.name}'s attack missed!`);
      return { attacker, defender, messages, damageDealt: 0, hits: 0, fainted: false };
    }
  }

  // Calculate damage for damaging moves FIRST
  if (move.power > 0) {
    const damageResult = calculateDamageWithMessages(attacker, defender, move);
    defender = { ...defender, currentHp: Math.max(0, defender.currentHp - damageResult.damage) };
    damageDealt = damageResult.damage;
    hits = 1;
    if (damageResult.message) messages.push(damageResult.message);
    if (damageResult.effectivenessMsg) messages.push(damageResult.effectivenessMsg);
  }

  // Apply additional effects (status, stat changes, etc.)
  if (move.effects) {
    for (const effect of move.effects) {
      // Skip drain/recoil effects - handled separately
      if (effect.type === "drain" && damageDealt > 0) {
        const healAmount = Math.floor(damageDealt * ((effect.percent || 50) / 100));
        attacker = { 
          ...attacker, 
          currentHp: Math.min(attacker.maxHp, attacker.currentHp + healAmount) 
        };
        messages.push(`${attacker.name} absorbed some HP!`);
        continue;
      }
      if (effect.type === "recoil" && damageDealt > 0) {
        // Struggle recoil is based on the user's max HP (Gen-style), handled after effects.
        if (move.name !== "Struggle") {
          const recoil = Math.floor(damageDealt * ((effect.percent || 25) / 100));
          attacker = { ...attacker, currentHp: Math.max(0, attacker.currentHp - recoil) };
          messages.push(`${attacker.name} was hurt by recoil!`);
        }
        continue;
      }
      
      const result = applyMoveEffect(attacker, defender, move, effect, messages);
      attacker = result.attacker;
      defender = result.defender;
    }
  }

  return { 
    attacker, 
    defender, 
    messages, 
    damageDealt, 
    hits,
    fainted: attacker.currentHp <= 0 || defender.currentHp <= 0
  };
};

/** Apply a single move effect (non-damage effects only) */
const applyMoveEffect = (
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  effect: MoveEffect,
  messages: string[]
): { attacker: Pokemon; defender: Pokemon } => {
  // Check effect chance
  if (effect.chance && Math.random() * 100 > effect.chance) {
    return { attacker, defender };
  }

  switch (effect.type) {
    case "status":
      if (effect.status) {
        const result = applyPrimaryStatus(defender, effect.status);
        defender = result.pokemon;
        if (result.message) messages.push(result.message);
      }
      break;

    case "volatile":
      if (effect.volatile) {
        const turns = effect.volatileTurns ?? Math.floor(Math.random() * 4) + 2; // 2-5 turns
        const result = applyVolatile(defender, effect.volatile, turns);
        defender = result.pokemon;
        if (result.message) messages.push(result.message);
      }
      break;

    case "statStage":
  if (effect.statChanges) {
    // Heuristic for missing "target" metadata:
    // - Default: negative stages affect defender, positive stages affect attacker (classic buff/debuff moves)
    // - Exception: guaranteed self-debuffs on damaging moves (e.g., Overheat, Close Combat) apply to attacker
    const isGuaranteed = !effect.chance || effect.chance >= 100;
    const hasPower = move.power > 0;
    const allNegative = effect.statChanges.every(c => c.stages < 0);
    const selfDebuffHeuristic = isGuaranteed && hasPower && allNegative;

    for (const change of effect.statChanges) {
      const targetIsAttacker =
        selfDebuffHeuristic ? true : (change.stages > 0);

      const target = targetIsAttacker ? attacker : defender;
      const result = applyStageChange(target, change.stat, change.stages);

      if (targetIsAttacker) attacker = result.pokemon;
      else defender = result.pokemon;

      if (result.message) messages.push(result.message);
    }
  }
  break;

    case "heal":
      if (effect.percent) {
        const healAmount = Math.floor(attacker.maxHp * (effect.percent / 100));
        attacker = { 
          ...attacker, 
          currentHp: Math.min(attacker.maxHp, attacker.currentHp + healAmount) 
        };
        messages.push(`${attacker.name} regained health!`);
      }
      break;

    case "leechSeed":
      const seedResult = applyVolatile(defender, "leechSeed", undefined);
      defender = seedResult.pokemon;
      messages.push(`${attacker.name} planted a seed on ${defender.name}!`);
      break;

    case "trap":
      const trapTurns = effect.trapTurns ?? Math.floor(Math.random() * 4) + 2;
      const trapResult = applyVolatile(defender, "trapped", trapTurns);
      defender = trapResult.pokemon;
      messages.push(`${defender.name} was trapped!`);
      break;
  }

  return { attacker, defender };
};

/** Get multiplier for a stat stage */
const getStageMultiplier = (stage: number): number => {
  const multipliers: Record<number, number> = {
    [-6]: 0.25, [-5]: 0.28, [-4]: 0.33, [-3]: 0.4, [-2]: 0.5, [-1]: 0.66,
    0: 1, 1: 1.5, 2: 2, 3: 2.5, 4: 3, 5: 3.5, 6: 4
  };
  return multipliers[clampStage(stage)] ?? 1;
};

/** Calculate damage with effectiveness messages */
const calculateDamageWithMessages = (attacker: Pokemon, defender: Pokemon, move: Move): { 
  damage: number; 
  message: string;
  effectivenessMsg: string;
} => {
  if (move.category === "Status" || move.power <= 0) {
    return { damage: 0, message: "", effectivenessMsg: "" };
  }

  const level = attacker.level;
  const power = move.power;

  const atkStage = move.category === "Physical" ? attacker.statStages.atk : attacker.statStages.spa;
  const defStage = move.category === "Physical" ? defender.statStages.def : defender.statStages.spd;

  const atk = Math.floor((move.category === "Physical" ? attacker.stats.attack : attacker.stats.spAttack) * getStageMultiplier(atkStage));
  const def = Math.floor((move.category === "Physical" ? defender.stats.defense : defender.stats.spDefense) * getStageMultiplier(defStage));

  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const effectiveness = getTypeEffectiveness(move.type, defender.types);
  
  // Critical hit chance (approx 6.25%)
  const isCritical = Math.random() < 0.0625;
  const critMultiplier = isCritical ? 1.5 : 1;
  
  const random = 0.85 + Math.random() * 0.15;

  const baseDamage = Math.floor(
    Math.floor(Math.floor((2 * level) / 5 + 2) * power * (atk / def)) / 50 + 2
  );

  const damage = Math.max(1, Math.floor(baseDamage * stab * effectiveness * critMultiplier * random));
  
  let message = "";
  if (isCritical) message = "A critical hit!";
  
  let effectivenessMsg = "";
  if (effectiveness === 0) effectivenessMsg = "It doesn't affect the target...";
  else if (effectiveness >= 2) effectivenessMsg = "It's super effective!";
  else if (effectiveness > 0 && effectiveness < 1) effectivenessMsg = "It's not very effective...";

  return { damage, message, effectivenessMsg };
};

// Generate random IVs (0-31 in modern, 0-15 in Gen 1)
export const generateIVs = (): Stats => ({
  hp: Math.floor(Math.random() * 16),
  attack: Math.floor(Math.random() * 16),
  defense: Math.floor(Math.random() * 16),
  spAttack: Math.floor(Math.random() * 16),
  spDefense: Math.floor(Math.random() * 16),
  speed: Math.floor(Math.random() * 16)
});

// Generate empty EVs
export const generateEVs = (): Stats => ({
  hp: 0,
  attack: 0,
  defense: 0,
  spAttack: 0,
  spDefense: 0,
  speed: 0
});

// Generate default stat stages (all at 0)
export const generateStatStages = (): StatStages => ({
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
  acc: 0,
  eva: 0
});

// Generate default volatile status (empty)
export const generateVolatileStatus = (): VolatileStatus => ({
  // All properties undefined by default
});

// Get starter moves based on species using learnset
export const getStarterMoves = (speciesId: number): Move[] => {
  const moveIds = getMovesForLevel(speciesId, 5);
  const moves: Move[] = [];
  for (const moveId of moveIds.slice(0, 4)) {
    const move = getMoveById(moveId);
    if (move) moves.push({ ...move, currentPp: move.maxPp });
  }
  // Fallback if no moves
  if (moves.length === 0) {
    const tackle = getMoveById(33);
    if (tackle) moves.push({ ...tackle, currentPp: tackle.maxPp });
  }
  return moves;
};

// Calculate HP stat
const calculateHP = (base: number, level: number, iv: number, ev: number): number => {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
};

// Calculate other stats
const calculateStat = (base: number, level: number, iv: number, ev: number): number => {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
};

// Create a new Pokemon
export const createPokemon = (
  speciesId: number,
  level: number,
  ivs?: Stats,
  evs?: Stats
): Pokemon => {
  const species = getPokemonById(speciesId);
  if (!species) throw new Error(`Pokemon ${speciesId} not found`);

  const finalIvs = ivs || generateIVs();
  const finalEvs = evs || generateEVs();

  const maxHp = calculateHP(species.stats.hp, level, finalIvs.hp, finalEvs.hp);

  return {
    speciesId,
    name: species.name,
    level,
    currentHp: maxHp,
    maxHp,
    stats: {
      attack: calculateStat(species.stats.atk, level, finalIvs.attack, finalEvs.attack),
      defense: calculateStat(species.stats.def, level, finalIvs.defense, finalEvs.defense),
      spAttack: calculateStat(species.stats.spa, level, finalIvs.spAttack, finalEvs.spAttack),
      spDefense: calculateStat(species.stats.spd, level, finalIvs.spDefense, finalEvs.spDefense),
      speed: calculateStat(species.stats.spe, level, finalIvs.speed, finalEvs.speed)
    },
    status: "none",
    volatileStatus: generateVolatileStatus(),
    statStages: generateStatStages(),
    moves: getStarterMoves(speciesId),
    exp: getExpForLevel(level, species.grow),
    types: species.types as import("@/types").PokemonType[],
    ivs: finalIvs,
    evs: finalEvs,
    ability: species.ab,
    heldItem: null
  };
};

// Stat stage multipliers (Gen 1)
const STAT_STAGE_MULTIPLIERS: Record<number, number> = {
  [-6]: 0.25, [-5]: 0.28, [-4]: 0.33, [-3]: 0.4, [-2]: 0.5, [-1]: 0.66,
  0: 1, 1: 1.5, 2: 2, 3: 2.5, 4: 3, 5: 3.5, 6: 4
};

// Get stat with modifiers applied
export const getModifiedStat = (baseStat: number, stage: number): number => {
  const multiplier = STAT_STAGE_MULTIPLIERS[Math.max(-6, Math.min(6, stage))] ?? 1;
  return Math.floor(baseStat * multiplier);
};

// Legacy: Apply stat stage change (redirects to new immutable version)
export const applyStatChange = (
  pokemon: Pokemon, 
  stat: keyof StatStages, 
  stages: number
): { success: boolean; message: string } => {
  const result = applyStageChange(pokemon, stat, stages);
  return { success: result.success, message: result.message };
};

// Reset stat stages (after battle) - immutable
export const resetStatStages = (pokemon: Pokemon): Pokemon => {
  return {
    ...pokemon,
    statStages: generateStatStages()
  };
};

// Legacy alias for backward compatibility
export const resetStatModifiers = resetStatStages;

// Calculate damage
export const calculateDamage = (
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  isCritical: boolean = false
): { damage: number; effectiveness: number; message: string; isCritical: boolean } => {
  if (move.category === "Status" || move.power <= 0) {
    return { damage: 0, effectiveness: 1, message: `${attacker.name} used ${move.name}!`, isCritical: false };
  }

  // Check accuracy with modifiers
  const accuracyMultiplier = STAT_STAGE_MULTIPLIERS[attacker.statStages.acc] ?? 1;
  const evasionMultiplier = STAT_STAGE_MULTIPLIERS[defender.statStages.eva] ?? 1;
  const modifiedAccuracy = move.accuracy * (accuracyMultiplier / evasionMultiplier);
  
  if (move.accuracy > 0 && Math.random() * 100 > modifiedAccuracy) {
    return { damage: 0, effectiveness: 1, message: `${attacker.name} used ${move.name}... but it missed!`, isCritical: false };
  }

  const level = attacker.level;
  const power = move.power;

  // Apply stat modifiers to attack/defense
  const atkStage = move.category === "Physical" ? attacker.statStages.atk : attacker.statStages.spa;
  const defStage = move.category === "Physical" ? defender.statStages.def : defender.statStages.spd;
  
  const atk = getModifiedStat(
    move.category === "Physical" ? attacker.stats.attack : attacker.stats.spAttack,
    atkStage
  );
  const def = getModifiedStat(
    move.category === "Physical" ? defender.stats.defense : defender.stats.spDefense,
    defStage
  );

  // Critical hit chance (approx 6.25%)
  const critChance = isCritical ? 1 : (Math.random() < 0.0625 ? 1.5 : 1);
  const actualCrit = critChance > 1;

  // STAB (Same Type Attack Bonus)
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;

  // Type effectiveness
  const effectiveness = getTypeEffectiveness(move.type, defender.types);

  // Random factor (0.85 to 1.0)
  const random = 0.85 + Math.random() * 0.15;

  // Base damage formula (simplified Gen 1)
  const baseDamage = Math.floor(
    Math.floor(Math.floor((2 * level) / 5 + 2) * power * (atk / def)) / 50 + 2
  );

  const damage = Math.max(1, Math.floor(baseDamage * stab * effectiveness * critChance * random));

  let message = `${attacker.name} used ${move.name}!`;
  if (actualCrit) message += " A critical hit!";
  if (effectiveness === 0) message += " It doesn't affect the target...";
  else if (effectiveness >= 2) message += " It's super effective!";
  else if (effectiveness > 0 && effectiveness < 1) message += " It's not very effective...";

  return { damage, effectiveness, message, isCritical: actualCrit };
};

// Apply status effect (legacy wrapper for backward compatibility)
export const applyStatus = (pokemon: Pokemon, status: PrimaryStatus): string => {
  const result = applyPrimaryStatus(pokemon, status);
  return result.message;
};

// Process status effects at end of turn (immutable)
export const processStatus = (pokemon: Pokemon): { pokemon: Pokemon; message: string } => {
  if (pokemon.status === "none") return { pokemon, message: "" };

  switch (pokemon.status) {
    case "psn":
      const poisonDamage = Math.floor(pokemon.maxHp / 8);
      return {
        pokemon: { ...pokemon, currentHp: Math.max(0, pokemon.currentHp - poisonDamage) },
        message: `${pokemon.name} was hurt by poison!`
      };

    case "tox":
      const toxicTurns = pokemon.volatileStatus.toxicTurns || 1;
      const toxicDamage = Math.floor((pokemon.maxHp * toxicTurns) / 16);
      return {
        pokemon: { 
          ...pokemon, 
          currentHp: Math.max(0, pokemon.currentHp - toxicDamage),
          volatileStatus: { ...pokemon.volatileStatus, toxicTurns: toxicTurns + 1 }
        },
        message: `${pokemon.name} was hurt by poison!`
      };

    case "brn":
      const burnDamage = Math.floor(pokemon.maxHp / 8);
      return {
        pokemon: { ...pokemon, currentHp: Math.max(0, pokemon.currentHp - burnDamage) },
        message: `${pokemon.name} was hurt by its burn!`
      };

    case "slp":
      const sleepTurns = pokemon.volatileStatus.sleepTurns || 1;
      if (sleepTurns > 0) {
        const newTurns = sleepTurns - 1;
        if (newTurns === 0) {
          return {
            pokemon: { 
              ...pokemon, 
              status: "none",
              volatileStatus: { ...pokemon.volatileStatus, sleepTurns: undefined }
            },
            message: `${pokemon.name} woke up!`
          };
        }
        return {
          pokemon: { 
            ...pokemon, 
            volatileStatus: { ...pokemon.volatileStatus, sleepTurns: newTurns }
          },
          message: `${pokemon.name} is fast asleep.`
        };
      }
      return { pokemon, message: `${pokemon.name} is fast asleep.` };

    case "frz":
      // 20% chance to thaw
      if (Math.random() < 0.2) {
        return {
          pokemon: { ...pokemon, status: "none" },
          message: `${pokemon.name} thawed out!`
        };
      }
      return { pokemon, message: `${pokemon.name} is frozen solid!` };

    case "par":
      return { pokemon, message: "" };

    default:
      return { pokemon, message: "" };
  }
};

// Check if Pokemon can move (not paralyzed/frozen/asleep/confused)
export const canMove = (pokemon: Pokemon): { canMove: boolean; message: string; hurtSelf?: boolean; pokemon?: Pokemon } => {
  if (pokemon.status === "par") {
    if (Math.random() < 0.25) {
      return { canMove: false, message: `${pokemon.name} is paralyzed! It can't move!` };
    }
  }
  if (pokemon.status === "slp") {
  const turns = pokemon.volatileStatus.sleepTurns ?? 1;
  const newTurns = Math.max(0, turns - 1);
  if (newTurns === 0) {
    const woke: Pokemon = {
      ...pokemon,
      status: "none",
      volatileStatus: { ...pokemon.volatileStatus, sleepTurns: undefined }
    };
    return { canMove: true, message: `${pokemon.name} woke up!`, pokemon: woke };
  }
  const stillAsleep: Pokemon = {
    ...pokemon,
    volatileStatus: { ...pokemon.volatileStatus, sleepTurns: newTurns }
  };
  return { canMove: false, message: `${pokemon.name} is fast asleep!`, pokemon: stillAsleep };
}
if (pokemon.status === "frz") {
  // 20% chance to thaw each turn. If thawed, can act immediately.
  if (Math.random() < 0.2) {
    const thawed: Pokemon = { ...pokemon, status: "none" };
    return { canMove: true, message: `${pokemon.name} thawed out!`, pokemon: thawed };
  }
  return { canMove: false, message: `${pokemon.name} is frozen solid!` };
}
  // Check confusion from volatile status
  if (pokemon.volatileStatus.confusion && pokemon.volatileStatus.confusion > 0) {
    // 50% chance to hurt self in confusion
    if (Math.random() < 0.5) {
      const confusionDamage = Math.floor(pokemon.maxHp / 16);
      const newPokemon = { ...pokemon, currentHp: Math.max(0, pokemon.currentHp - confusionDamage) };
      return { 
        canMove: false, 
        message: `${pokemon.name} is confused! It hurt itself in confusion!`, 
        hurtSelf: true,
        pokemon: newPokemon
      };
    }
    return { canMove: true, message: `${pokemon.name} is confused!` };
  }
  return { canMove: true, message: "" };
};

// Calculate catch rate
export const calculateCatchRate = (
  pokemon: Pokemon,
  ballType: string
): number => {
  const species = getPokemonById(pokemon.speciesId);
  if (!species) return 0;

  const ballBonus = 
    ballType === "Master Ball" ? 255 :
    ballType === "Ultra Ball" ? 2 :
    ballType === "Great Ball" ? 1.5 : 1;

  const statusBonus = 
    pokemon.status === "slp" || pokemon.status === "frz" ? 2 :
    pokemon.status !== "none" ? 1.5 : 1;

  // Simplified catch formula
  const baseChance = ((3 * pokemon.maxHp - 2 * pokemon.currentHp) * species.cr * ballBonus * statusBonus) / (3 * pokemon.maxHp);

  return Math.min(100, Math.max(1, Math.floor(baseChance)));
};

// Get experience needed for next level
export const getExpToNextLevel = (pokemon: Pokemon): { current: number; needed: number; toNext: number } => {
  const species = getPokemonById(pokemon.speciesId);
  if (!species) return { current: 0, needed: 100, toNext: 100 };
  
  const currentLevelExp = getExpForLevel(pokemon.level, species.grow);
  const nextLevelExp = getExpForLevel(pokemon.level + 1, species.grow);
  
  return {
    current: pokemon.exp - currentLevelExp,
    needed: nextLevelExp - currentLevelExp,
    toNext: nextLevelExp - pokemon.exp
  };
};

// Gain EVs from defeating a Pokemon
export const gainEVs = (winner: Pokemon, defeatedSpeciesId: number): string[] => {
  const species = getPokemonById(defeatedSpeciesId);
  if (!species) return [];
  
  const messages: string[] = [];
  
  // Gen 1 gives EVs based on defeated Pokemon's stats
  winner.evs.hp = Math.min(65535, winner.evs.hp + Math.floor(species.stats.hp / 10));
  winner.evs.attack = Math.min(65535, winner.evs.attack + Math.floor(species.stats.atk / 10));
  winner.evs.defense = Math.min(65535, winner.evs.defense + Math.floor(species.stats.def / 10));
  winner.evs.spAttack = Math.min(65535, winner.evs.spAttack + Math.floor(species.stats.spa / 10));
  winner.evs.spDefense = Math.min(65535, winner.evs.spDefense + Math.floor(species.stats.spd / 10));
  winner.evs.speed = Math.min(65535, winner.evs.speed + Math.floor(species.stats.spe / 10));
  
  return messages;
};

// Gain experience
export const gainExperience = (pokemon: Pokemon, exp: number, defeatedSpeciesId: number): { 
  leveledUp: boolean; 
  newMoves: Move[]; 
  messages: string[];
  evMessages: string[];
} => {
  const species = getPokemonById(pokemon.speciesId);
  if (!species) return { leveledUp: false, newMoves: [], messages: [], evMessages: [] };

  // Gain EVs first
  const evMessages = gainEVs(pokemon, defeatedSpeciesId);

  pokemon.exp += exp;
  const newLevel = getLevelFromExperience(pokemon.exp, species.grow);

  const messages: string[] = [`${pokemon.name} gained ${exp} EXP!`];
  const newMoves: Move[] = [];

  if (newLevel > pokemon.level) {
    const oldLevel = pokemon.level;
    pokemon.level = newLevel;
    messages.push(`${pokemon.name} grew to Level ${newLevel}!`);

    // Recalculate stats
    pokemon.maxHp = calculateHP(species.stats.hp, newLevel, pokemon.ivs.hp, pokemon.evs.hp);
    pokemon.stats.attack = calculateStat(species.stats.atk, newLevel, pokemon.ivs.attack, pokemon.evs.attack);
    pokemon.stats.defense = calculateStat(species.stats.def, newLevel, pokemon.ivs.defense, pokemon.evs.defense);
    pokemon.stats.spAttack = calculateStat(species.stats.spa, newLevel, pokemon.ivs.spAttack, pokemon.evs.spAttack);
    pokemon.stats.spDefense = calculateStat(species.stats.spd, newLevel, pokemon.ivs.spDefense, pokemon.evs.spDefense);
    pokemon.stats.speed = calculateStat(species.stats.spe, newLevel, pokemon.ivs.speed, pokemon.evs.speed);

    // Heal HP on level up
    pokemon.currentHp = pokemon.maxHp;

    // Check for new moves at each level gained
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      const moveIds = getNewMovesAtLevel(pokemon.speciesId, level);
      for (const moveId of moveIds) {
        const move = getMoveById(moveId);
        if (move) {
          newMoves.push({ ...move, currentPp: move.maxPp });
        }
      }
    }

    return { leveledUp: true, newMoves, messages, evMessages };
  }

  return { leveledUp: false, newMoves: [], messages, evMessages };
};

// Use item on Pokemon
export const useItemOnPokemon = (item: Item, pokemon: Pokemon): { success: boolean; message: string; pokemon?: Pokemon } => {
  switch (item.type) {
    case "Potion":
      if (pokemon.currentHp >= pokemon.maxHp) {
        return { success: false, message: "It won't have any effect!" };
      }
      const healAmount = typeof item.effect?.value === 'number' ? item.effect.value : 20;
      const newHp = Math.min(pokemon.maxHp, pokemon.currentHp + healAmount);
      return { 
        success: true, 
        message: `${pokemon.name} recovered ${newHp - pokemon.currentHp} HP!`,
        pokemon: { ...pokemon, currentHp: newHp }
      };

    case "StatusHeal":
      if (item.effect?.type === "cureAll") {
        if (pokemon.status === "none") {
          return { success: false, message: "It won't have any effect!" };
        }
        return { 
          success: true, 
          message: `${pokemon.name} was cured of all status problems!`,
          pokemon: { ...pokemon, status: "none" as PrimaryStatus }
        };
      }
      if (item.effect?.value === pokemon.status) {
        return { 
          success: true, 
          message: `${pokemon.name} was cured!`,
          pokemon: { ...pokemon, status: "none" as PrimaryStatus }
        };
      }
      return { success: false, message: "It won't have any effect!" };

    default:
      return { success: false, message: "Can't use that item here!" };
  }
};

// Check evolution
export const checkEvolution = (pokemon: Pokemon): number | null => {
  const species = getPokemonById(pokemon.speciesId);
  if (!species || !species.evo) return null;

  if (species.evo.m === "lvl" && pokemon.level >= (species.evo.r as number)) {
    return species.evo.t;
  }

  return null;
};
