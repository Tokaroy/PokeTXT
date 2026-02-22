import { useState, useCallback, useEffect, useRef } from 'react';
import type { Pokemon, Move, Item, BattleState, GameState, Trainer, PrimaryStatus, StatStages } from '@/types';
import { GEN1_ITEMS } from '@/data/items';
import { GYM_LEADERS, ELITE_FOUR, generateRouteTrainer } from '@/data/trainers';
import { 
  createPokemon, 
  calculateDamage, 
  canMove,
  processStatus,
  calculateCatchRate,
  gainExperience,
  useItemOnPokemon,
  getExpToNextLevel,
  clampStage,
  executeMove,
  generateStatStages
} from '@/lib/gameLogic';
import { getPokemonById } from '@/data/pokemon';
import { STRUGGLE } from '@/data/moves';
import { saveGame, loadGame, deleteSave, hasSave, getSaveInfo } from '@/lib/saveGame';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Swords, 
  Wind, 
  Backpack,
  Users,
  Sparkles,
  Trophy
} from 'lucide-react';

// Type color mapping
const typeColors: Record<string, string> = {
  Normal: 'bg-gray-400',
  Fire: 'bg-red-500',
  Water: 'bg-blue-500',
  Electric: 'bg-yellow-400',
  Grass: 'bg-green-500',
  Ice: 'bg-cyan-300',
  Fighting: 'bg-orange-700',
  Poison: 'bg-purple-500',
  Ground: 'bg-amber-600',
  Flying: 'bg-sky-400',
  Psychic: 'bg-pink-500',
  Bug: 'bg-lime-500',
  Rock: 'bg-stone-500',
  Ghost: 'bg-indigo-700',
  Dragon: 'bg-violet-600',
  Dark: 'bg-neutral-700',
  Steel: 'bg-slate-400',
  Fairy: 'bg-rose-300'
};

// Primary status badges (shown near HP)
const statusColors: Record<PrimaryStatus, string> = {
  none: '',
  psn: 'bg-purple-500 text-white',
  tox: 'bg-purple-700 text-white',
  brn: 'bg-red-500 text-white',
  par: 'bg-yellow-500 text-black',
  slp: 'bg-gray-500 text-white',
  frz: 'bg-cyan-500 text-white'
};

const statusIcons: Record<PrimaryStatus, string> = {
  none: '',
  psn: '☠️',
  tox: '☠️☠️',
  brn: '🔥',
  par: '⚡',
  slp: '💤',
  frz: '🧊'
};

// Stat stage icons
const statStageIcons: Record<keyof StatStages, string> = {
  atk: '⚔️',
  def: '🛡️',
  spa: '✨',
  spd: '🔮',
  spe: '💨',
  acc: '🎯',
  eva: '👻'
};

// Volatile status icons
const volatileIcons = {
  confusion: '😵',
  leechSeed: '🌱',
  trapped: '⛓️',
  flinch: '💫'
};

function App() {
  // Check for existing save
  const [saveExists, setSaveExists] = useState(false);
  const [saveInfo, setSaveInfo] = useState<{ exists: boolean; savedAt?: string }>({ exists: false });
  
  useEffect(() => {
    setSaveExists(hasSave());
    setSaveInfo(getSaveInfo());
  }, []);

  // Game State
  const [gameState, setGameState] = useState<GameState>({
    screen: 'title',
    playerName: 'Red',
    playerParty: [],
    pcStorage: {
      currentBoxIndex: 0,
      boxes: Array(12).fill(null).map(() => [])  // 12 boxes, each can hold Pokemon
    },
    bag: [
      { item: GEN1_ITEMS[0], quantity: 5 },
      { item: GEN1_ITEMS[4], quantity: 3 },
      { item: GEN1_ITEMS[9], quantity: 2 }
    ],
    badges: [],
    money: 3000,
    currentLocation: 'Pallet Town',
    defeatedTrainers: [],
    gameProgress: 0,
    selectedPokemonIndex: 0,
    pendingMoveLearn: null
  });

  const [martMessage, setMartMessage] = useState<string>('');

  const [battleState, setBattleState] = useState<BattleState | null>(null);
  // Keep latest state in refs for timeouts / async turn resolution
  const battleStateRef = useRef<BattleState | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  useEffect(() => { battleStateRef.current = battleState; }, [battleState]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const [messageLog, setMessageLog] = useState<string[]>([]);
  const [showBag, setShowBag] = useState(false);
  const [showParty, setShowParty] = useState(false);
  const [showPokemonDetail, setShowPokemonDetail] = useState<Pokemon | null>(null);
  const [battleMenu, setBattleMenu] = useState<'main' | 'moves' | 'bag'>('main');
  const [moveLearnDialog, setMoveLearnDialog] = useState<{ pokemon: Pokemon; newMove: Move } | null>(null);
  const [currentRoute, setCurrentRoute] = useState(1);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [showPC, setShowPC] = useState(false);
  const [partyReorderMode, setPartyReorderMode] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState<number | null>(null);

  // Add message to log
  const addMessage = useCallback((message: string) => {
    setMessageLog(prev => [...prev.slice(-19), message]);
  }, []);

  // Immutable PP decrement helper (never mutate move objects in-place)
  const decrementMovePP = (pokemon: Pokemon, moveId: number): Pokemon => {
    return {
      ...pokemon,
      moves: pokemon.moves.map(m =>
        m.id === moveId ? { ...m, currentPp: Math.max(0, m.currentPp - 1) } : m
      )
    };
  };

  // Start new game
  const startNewGame = () => {
    setGameState(prev => ({ ...prev, screen: 'starter' }));
  };

  // Select starter
  const selectStarter = (speciesId: number) => {
    const starter = createPokemon(speciesId, 5);
    setGameState(prev => ({
      ...prev,
      screen: 'overworld',
      playerParty: [starter]
    }));
    addMessage(`You received a ${starter.name}!`);
  };

  // ============================================
  // PARTY REORDERING SYSTEM
  // ============================================

  // Swap two Pokemon in the party
  const swapPartySlots = (index1: number, index2: number) => {
    if (index1 === index2) return;
    
    setGameState(prev => {
      const newParty = [...prev.playerParty];
      [newParty[index1], newParty[index2]] = [newParty[index2], newParty[index1]];
      return { ...prev, playerParty: newParty };
    });
    
    addMessage(`Swapped party positions!`);
  };

  // Handle party slot click for reordering
  const handlePartySlotClick = (index: number) => {
    if (!partyReorderMode) {
      // Normal mode - show Pokemon detail
      setShowPokemonDetail(gameState.playerParty[index]);
      return;
    }
    
    // Reorder mode
    if (selectedForSwap === null) {
      setSelectedForSwap(index);
    } else {
      swapPartySlots(selectedForSwap, index);
      setSelectedForSwap(null);
    }
  };

  // Move Pokemon up in party order
  const movePartyUp = (index: number) => {
    if (index <= 0) return;
    swapPartySlots(index, index - 1);
  };

  // Move Pokemon down in party order
  const movePartyDown = (index: number) => {
    if (index >= gameState.playerParty.length - 1) return;
    swapPartySlots(index, index + 1);
  };

  // ============================================
  // PC STORAGE SYSTEM
  // ============================================

  // Deposit Pokemon to PC
  const depositToPC = (partyIndex: number) => {
    const pokemon = gameState.playerParty[partyIndex];
    if (!pokemon) return;
    
    // Prevent depositing last Pokemon
    const healthyPokemon = gameState.playerParty.filter(p => p.currentHp > 0);
    if (healthyPokemon.length <= 1 && pokemon.currentHp > 0) {
      addMessage("You need at least one healthy Pokemon!");
      return;
    }
    
    const { currentBoxIndex, boxes } = gameState.pcStorage;
    const currentBox = boxes[currentBoxIndex];
    
    // Check if box has space (max 30 per box)
    if (currentBox.length >= 30) {
      addMessage("This box is full!");
      return;
    }
    
    setGameState(prev => {
      const newParty = prev.playerParty.filter((_, i) => i !== partyIndex);
      const newBoxes = [...prev.pcStorage.boxes];
      newBoxes[currentBoxIndex] = [...newBoxes[currentBoxIndex], pokemon];
      
      return {
        ...prev,
        playerParty: newParty,
        pcStorage: {
          ...prev.pcStorage,
          boxes: newBoxes
        }
      };
    });
    
    addMessage(`${pokemon.name} was deposited in Box ${currentBoxIndex + 1}!`);
  };

  // Withdraw Pokemon from PC
  const withdrawFromPC = (boxIndex: number, pokemonIndex: number) => {
    const pokemon = gameState.pcStorage.boxes[boxIndex][pokemonIndex];
    if (!pokemon) return;
    
    // Check if party is full
    if (gameState.playerParty.length >= 6) {
      addMessage("Your party is full!");
      return;
    }
    
    setGameState(prev => {
      const newBoxes = [...prev.pcStorage.boxes];
      newBoxes[boxIndex] = newBoxes[boxIndex].filter((_, i) => i !== pokemonIndex);
      
      return {
        ...prev,
        playerParty: [...prev.playerParty, pokemon],
        pcStorage: {
          ...prev.pcStorage,
          boxes: newBoxes
        }
      };
    });
    
    addMessage(`${pokemon.name} was added to your party!`);
  };

  // Release Pokemon from PC
  const releaseFromPC = (boxIndex: number, pokemonIndex: number) => {
    const pokemon = gameState.pcStorage.boxes[boxIndex][pokemonIndex];
    if (!pokemon) return;
    
    if (!confirm(`Release ${pokemon.name}? It will be gone forever!`)) {
      return;
    }
    
    setGameState(prev => {
      const newBoxes = [...prev.pcStorage.boxes];
      newBoxes[boxIndex] = newBoxes[boxIndex].filter((_, i) => i !== pokemonIndex);
      
      return {
        ...prev,
        pcStorage: {
          ...prev.pcStorage,
          boxes: newBoxes
        }
      };
    });
    
    addMessage(`${pokemon.name} was released. Bye bye!`);
  };

  // Switch to next PC box
  const switchPCBox = (direction: 'next' | 'prev') => {
    setGameState(prev => {
      const totalBoxes = prev.pcStorage.boxes.length;
      let newIndex = prev.pcStorage.currentBoxIndex;
      
      if (direction === 'next') {
        newIndex = (newIndex + 1) % totalBoxes;
      } else {
        newIndex = (newIndex - 1 + totalBoxes) % totalBoxes;
      }
      
      return {
        ...prev,
        pcStorage: {
          ...prev.pcStorage,
          currentBoxIndex: newIndex
        }
      };
    });
  };

  // ============================================
  // MOVE LEARN SYSTEM
  // ============================================

  // Check if Pokemon already knows a move
  const pokemonKnowsMove = (pokemon: Pokemon, moveId: number): boolean => {
    return pokemon.moves.some(m => m.id === moveId);
  };

  // Learn a new move (called from level up or TM)
  const learnMove = (pokemon: Pokemon, newMove: Move, source: 'levelup' | 'tm'): boolean => {
    // Check if already knows move
    if (pokemonKnowsMove(pokemon, newMove.id)) {
      if (source === 'tm') {
        addMessage(`${pokemon.name} already knows ${newMove.name}!`);
      }
      return false;
    }
    
    // If less than 4 moves, learn automatically
    if (pokemon.moves.length < 4) {
      const updatedPokemon = {
        ...pokemon,
        moves: [...pokemon.moves, { ...newMove, currentPp: newMove.maxPp }]
      };
      
      updatePokemonInParty(updatedPokemon);
      addMessage(`${pokemon.name} learned ${newMove.name}!`);
      return true;
    }
    
    // Need to replace a move - show dialog
    setMoveLearnDialog({ pokemon, newMove });
    setGameState(prev => ({
      ...prev,
      pendingMoveLearn: { pokemon, newMove, source }
    }));
    return true;
  };

  // Update a Pokemon in the party
  const updatePokemonInParty = (updatedPokemon: Pokemon) => {
    setGameState(prev => ({
      ...prev,
      playerParty: prev.playerParty.map(p => 
        p === updatedPokemon || p.name === updatedPokemon.name ? updatedPokemon : p
      )
    }));
  };

  // Replace a move
  const replaceMove = (moveIndex: number) => {
    if (!moveLearnDialog) return;
    const { pokemon, newMove } = moveLearnDialog;
    
    const oldMoveName = pokemon.moves[moveIndex]?.name;
    const updatedPokemon = {
      ...pokemon,
      moves: pokemon.moves.map((m, i) => 
        i === moveIndex ? { ...newMove, currentPp: newMove.maxPp } : m
      )
    };
    
    updatePokemonInParty(updatedPokemon);
    addMessage(`${pokemon.name} forgot ${oldMoveName} and learned ${newMove.name}!`);
    
    setMoveLearnDialog(null);
    setGameState(prev => ({ ...prev, pendingMoveLearn: null }));
  };

  // Skip learning move
  const skipMoveLearn = () => {
    if (!moveLearnDialog) return;
    const { pokemon, newMove } = moveLearnDialog;
    
    addMessage(`${pokemon.name} did not learn ${newMove.name}.`);
    setMoveLearnDialog(null);
    setGameState(prev => ({ ...prev, pendingMoveLearn: null }));
  };

  // Get wild Pokemon for current route
  const getWildPokemonForRoute = (route: number): { ids: number[]; minLevel: number; maxLevel: number } => {
    const routeData: Record<number, { ids: number[]; minLevel: number; maxLevel: number }> = {
      1: { ids: [16, 19, 29], minLevel: 2, maxLevel: 5 },
      2: { ids: [16, 17, 19, 20, 29], minLevel: 3, maxLevel: 7 },
      3: { ids: [21, 23, 27, 29, 32], minLevel: 6, maxLevel: 11 },
      4: { ids: [23, 24, 27, 28, 35], minLevel: 8, maxLevel: 13 },
      5: { ids: [16, 17, 52, 56], minLevel: 10, maxLevel: 15 },
      6: { ids: [16, 17, 43, 52, 56], minLevel: 12, maxLevel: 17 },
      7: { ids: [19, 20, 37, 39, 52, 58], minLevel: 15, maxLevel: 20 },
      8: { ids: [23, 24, 37, 39, 52, 56], minLevel: 17, maxLevel: 22 },
      9: { ids: [19, 20, 21, 22, 50, 51], minLevel: 15, maxLevel: 20 },
      10: { ids: [21, 22, 81, 82, 100], minLevel: 17, maxLevel: 23 },
      11: { ids: [16, 17, 20, 21, 96], minLevel: 20, maxLevel: 25 },
      12: { ids: [16, 17, 43, 69, 70], minLevel: 22, maxLevel: 27 },
      13: { ids: [16, 17, 43, 48, 49], minLevel: 24, maxLevel: 29 },
      14: { ids: [17, 22, 43, 44, 48, 49], minLevel: 25, maxLevel: 30 },
      15: { ids: [16, 17, 29, 30, 32, 33], minLevel: 26, maxLevel: 31 },
      16: { ids: [19, 20, 21, 22, 84, 85], minLevel: 27, maxLevel: 32 },
      17: { ids: [20, 22, 84, 85], minLevel: 28, maxLevel: 33 },
      18: { ids: [17, 22, 84, 85], minLevel: 29, maxLevel: 34 },
      19: { ids: [72, 73, 116, 117, 120, 121], minLevel: 30, maxLevel: 35 },
      20: { ids: [72, 73, 86, 87, 90, 91, 116, 117], minLevel: 32, maxLevel: 37 },
      21: { ids: [72, 73, 116, 117, 129, 130], minLevel: 33, maxLevel: 38 },
      22: { ids: [19, 20, 21, 22, 29, 32], minLevel: 35, maxLevel: 40 },
      23: { ids: [20, 22, 42, 49, 57, 67], minLevel: 38, maxLevel: 43 },
      24: { ids: [13, 14, 16, 17, 43, 63], minLevel: 12, maxLevel: 17 },
      25: { ids: [10, 11, 13, 14, 16, 17], minLevel: 10, maxLevel: 15 },
    };
    return routeData[route] || { ids: [16, 19, 29], minLevel: 2, maxLevel: 5 };
  };

  // Start wild battle - use first non-fainted Pokemon in party order
  const startWildBattle = () => {
    const routeData = getWildPokemonForRoute(currentRoute);
    const randomId = routeData.ids[Math.floor(Math.random() * routeData.ids.length)];
    const level = Math.floor(Math.random() * (routeData.maxLevel - routeData.minLevel + 1)) + routeData.minLevel;
    const wildPokemon = createPokemon(randomId, level);
    
    // Find first non-fainted Pokemon in party order
    const activePokemon = gameState.playerParty.find(p => p.currentHp > 0);
    if (!activePokemon) {
      addMessage("You have no healthy Pokemon!");
      return;
    }

    const newBattleState: BattleState = {
      playerActive: activePokemon,
      opponentActive: wildPokemon,
      playerParty: gameState.playerParty,
      opponentParty: [wildPokemon],
      turn: 1,
      isWild: true,
      messageLog: [`A wild ${wildPokemon.name} appeared!`, `Go! ${activePokemon.name}!`],
      canEscape: true,
      battleType: 'wild'
    };

    setBattleState(newBattleState);
    setGameState(prev => ({ ...prev, screen: 'battle' }));
    setBattleMenu('main');
    setMessageLog(newBattleState.messageLog);
  };

  // Start trainer battle - use first non-fainted Pokemon in party order
  const startTrainerBattle = (trainer: Trainer) => {
    // Find first non-fainted Pokemon in party order
    const activePokemon = gameState.playerParty.find(p => p.currentHp > 0);
    if (!activePokemon) {
      addMessage("You have no healthy Pokemon!");
      return;
    }

    const opponentParty = trainer.party.map(p => createPokemon(p.speciesId, p.level));
    
    const newBattleState: BattleState = {
      playerActive: activePokemon,
      opponentActive: opponentParty[0],
      playerParty: gameState.playerParty,
      opponentParty,
      turn: 1,
      isWild: false,
      messageLog: [trainer.beforeBattleText, `${trainer.class} ${trainer.name} sent out ${opponentParty[0].name}!`, `Go! ${activePokemon.name}!`],
      canEscape: false,
      opponentTrainerName: trainer.name,
      battleType: trainer.isGymLeader ? 'gym' : trainer.isElite4 ? 'elite4' : 'trainer'
    };

    setBattleState(newBattleState);
    setGameState(prev => ({ ...prev, screen: 'battle' }));
    setBattleMenu('main');
    setMessageLog(newBattleState.messageLog);
  };

  // Determine turn order based on priority and speed (Gen 1 style)
  const determineTurnOrder = (
    playerPokemon: Pokemon,
    opponentPokemon: Pokemon,
    playerMove: Move,
    opponentMove: Move
  ): { first: 'player' | 'opponent'; playerMove: Move; opponentMove: Move } => {
    const playerPriority = playerMove.priority || 0;
    const opponentPriority = opponentMove.priority || 0;
    
    // Higher priority goes first
    if (playerPriority > opponentPriority) {
      return { first: 'player', playerMove, opponentMove };
    }
    if (opponentPriority > playerPriority) {
      return { first: 'opponent', playerMove, opponentMove };
    }
    
    // Same priority - compare Speed (with stat stages)
    const getSpeedWithStage = (pokemon: Pokemon) => {
      const stage = clampStage(pokemon.statStages.spe);
      const multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
      return Math.floor(pokemon.stats.speed * multiplier);
    };
    const playerSpeed = getSpeedWithStage(playerPokemon);
    const opponentSpeed = getSpeedWithStage(opponentPokemon);
    
    if (playerSpeed > opponentSpeed) {
      return { first: 'player', playerMove, opponentMove };
    }
    if (opponentSpeed > playerSpeed) {
      return { first: 'opponent', playerMove, opponentMove };
    }
    
    // Speed tie - 50/50 random
    return { first: Math.random() < 0.5 ? 'player' : 'opponent', playerMove, opponentMove };
  };

// Execute both moves in priority order
const executeTurn = (playerMove: Move, opponentMove: Move) => {
  if (!battleState) return;

  setIsProcessingTurn(true);

  let playerPokemon = battleState.playerActive;
  let opponentPokemon = battleState.opponentActive;

  // Determine turn order
  const turnOrder = determineTurnOrder(playerPokemon, opponentPokemon, playerMove, opponentMove);

  // Use PP for both moves (immutable)
  const playerMoveUsed: Move = { ...playerMove, currentPp: Math.max(0, playerMove.currentPp - 1) };
  const opponentMoveUsed: Move = { ...opponentMove, currentPp: Math.max(0, opponentMove.currentPp - 1) };
  playerPokemon = decrementMovePP(playerPokemon, playerMove.id);
  opponentPokemon = decrementMovePP(opponentPokemon, opponentMove.id);

  let playerFainted = false;
  let opponentFainted = false;
  const allMessages: string[] = [];

  // Check if Pokemon can act (sleep/freeze/paralysis/confusion).
  // canMove() may return an updated Pokemon (e.g., thawing, waking, confusion self-damage).
  const attemptAct = (pkmn: Pokemon): { pkmn: Pokemon; canAct: boolean } => {
    const check = canMove(pkmn);
    const updated = check.pokemon ?? pkmn;
    if (check.message) allMessages.push(check.message);
    if (!check.canMove) return { pkmn: updated, canAct: false };
    return { pkmn: updated, canAct: true };
  };

  const runMove = (attacker: Pokemon, defender: Pokemon, usedMove: Move): { attacker: Pokemon; defender: Pokemon } => {
    const act = attemptAct(attacker);
    attacker = act.pkmn;
    if (!act.canAct) return { attacker, defender };
    const res = executeMove(attacker, defender, usedMove);
    allMessages.push(...res.messages);
    return { attacker: res.attacker, defender: res.defender };
  };

  // Execute first move
  if (turnOrder.first === 'player') {
    const r1 = runMove(playerPokemon, opponentPokemon, playerMoveUsed);
    playerPokemon = r1.attacker;
    opponentPokemon = r1.defender;
    opponentFainted = opponentPokemon.currentHp <= 0;
    playerFainted = playerPokemon.currentHp <= 0;

    if (!opponentFainted && !playerFainted) {
      const r2 = runMove(opponentPokemon, playerPokemon, opponentMoveUsed);
      opponentPokemon = r2.attacker;
      playerPokemon = r2.defender;
      opponentFainted = opponentPokemon.currentHp <= 0;
      playerFainted = playerPokemon.currentHp <= 0;
    }
  } else {
    const r1 = runMove(opponentPokemon, playerPokemon, opponentMoveUsed);
    opponentPokemon = r1.attacker;
    playerPokemon = r1.defender;
    opponentFainted = opponentPokemon.currentHp <= 0;
    playerFainted = playerPokemon.currentHp <= 0;

    if (!opponentFainted && !playerFainted) {
      const r2 = runMove(playerPokemon, opponentPokemon, playerMoveUsed);
      playerPokemon = r2.attacker;
      opponentPokemon = r2.defender;
      opponentFainted = opponentPokemon.currentHp <= 0;
      playerFainted = playerPokemon.currentHp <= 0;
    }
  }

  // Update battle state AND party with new Pokemon data (player + opponent parties)
  setBattleState(prev => {
    if (!prev) return null;
    const pIndex = prev.playerParty.findIndex(p => p === prev.playerActive);
    const oIndex = prev.opponentParty.findIndex(p => p === prev.opponentActive);
    return {
      ...prev,
      playerActive: playerPokemon,
      opponentActive: opponentPokemon,
      playerParty: pIndex >= 0 ? prev.playerParty.map((p, i) => (i === pIndex ? playerPokemon : p)) : prev.playerParty,
      opponentParty: oIndex >= 0 ? prev.opponentParty.map((p, i) => (i === oIndex ? opponentPokemon : p)) : prev.opponentParty,
    };
  });

  // Also update the main party array so damage persists after battle
  setGameState(prev => {
    const currentBs = battleStateRef.current;
    if (!currentBs) return prev;
    const activeIndex = prev.playerParty.findIndex(p => p === currentBs.playerActive);
    if (activeIndex === -1) return prev;
    return {
      ...prev,
      playerParty: prev.playerParty.map((p, i) => (i === activeIndex ? playerPokemon : p))
    };
  });

  // Add all messages to log
  allMessages.forEach(msg => addMessage(msg));

  // Check faints and end turn
  setTimeout(() => {
    if (opponentFainted) {
      addMessage(`${opponentPokemon.name} fainted!`);
      handleOpponentFainted(opponentPokemon, playerPokemon);
    } else if (playerFainted) {
      addMessage(`${playerPokemon.name} fainted!`);
      handlePlayerFainted(playerPokemon);
    } else {
      endTurn(playerPokemon, opponentPokemon);
    }
    setIsProcessingTurn(false);
  }, 500);
};

  // Execute player move selection
  const executePlayerMove = (move: Move) => {
    if (!battleState || isProcessingTurn) return;

    // Check if player has any PP left on any move
    const playerPokemon = battleState.playerActive;
    const hasAnyPP = playerPokemon.moves.some(m => m.currentPp > 0);

    // If the player still has PP on SOME move, you cannot select a move with 0 PP
    if (hasAnyPP && move.name !== 'Struggle' && move.currentPp <= 0) {
      addMessage(`${playerPokemon.name} has no PP left for ${move.name}!`);
      return;
    }

    // If no PP left on ANY move, use Struggle
    const actualMove = hasAnyPP ? move : STRUGGLE;
    if (!hasAnyPP && move.name !== 'Struggle') {
      addMessage(`${playerPokemon.name} has no PP left!`);
    }
    
    // Select opponent's move (smart AI - avoids status moves if target already has status)
    const opponentPokemon = battleState.opponentActive;
    const opponentHasPP = opponentPokemon.moves.some(m => m.currentPp > 0);
    let opponentMove: Move;
    
    if (opponentHasPP) {
      // Get all moves with PP
      let availableMoves = opponentPokemon.moves.filter(m => m.currentPp > 0);
      
      // Smart AI: Don't use status moves if player already has a status condition
      if (playerPokemon.status !== 'none') {
        const nonStatusMoves = availableMoves.filter(m => {
          // Check if move has status effect in effects array
          if (!m.effects) return true;
          return !m.effects.some(e => e.type === 'status');
        });
        // If there are non-status moves available, use those instead
        if (nonStatusMoves.length > 0) {
          availableMoves = nonStatusMoves;
        }
      }
      
      // Smart AI: Don't use stat-lowering moves if target already has max negative stages
      const usefulMoves = availableMoves.filter(m => {
        if (!m.effects) return true;
        // Check if any stat is already at -6
        for (const effect of m.effects) {
          if (effect.type === 'statStage' && effect.statChanges) {
            for (const change of effect.statChanges) {
              if (change.stages < 0) {
                const targetStat = playerPokemon.statStages[change.stat];
                if (targetStat <= -6) return false;
              }
            }
          }
        }
        return true;
      });
      
      if (usefulMoves.length > 0) {
        availableMoves = usefulMoves;
      }
      
      opponentMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else {
      opponentMove = STRUGGLE;
    }
    
    // Execute both moves in priority order
    executeTurn(actualMove, opponentMove);
  };

  // End turn
  const endTurn = (playerPkmn?: Pokemon, opponentPkmn?: Pokemon) => {
    if (!battleState) return;
    
    let playerPokemon = playerPkmn || battleState.playerActive;
    let opponentPokemon = opponentPkmn || battleState.opponentActive;
    
    // Process Leech Seed (player seeded)
    if (playerPokemon.volatileStatus.leechSeed) {
      const leechDamage = Math.floor(playerPokemon.maxHp / 16);
      playerPokemon = { 
        ...playerPokemon, 
        currentHp: Math.max(0, playerPokemon.currentHp - leechDamage) 
      };
      opponentPokemon = { 
        ...opponentPokemon, 
        currentHp: Math.min(opponentPokemon.maxHp, opponentPokemon.currentHp + leechDamage) 
      };
      addMessage(`${playerPokemon.name}'s health was sapped by Leech Seed!`);
      setBattleState(prev => prev ? { ...prev, playerActive: playerPokemon, opponentActive: opponentPokemon } : null);
      
      if (playerPokemon.currentHp <= 0) {
        handlePlayerFainted();
        return;
      }
    }
    
    // Process Leech Seed (opponent seeded)
    if (opponentPokemon.volatileStatus.leechSeed) {
      const leechDamage = Math.floor(opponentPokemon.maxHp / 16);
      opponentPokemon = { 
        ...opponentPokemon, 
        currentHp: Math.max(0, opponentPokemon.currentHp - leechDamage) 
      };
      playerPokemon = { 
        ...playerPokemon, 
        currentHp: Math.min(playerPokemon.maxHp, playerPokemon.currentHp + leechDamage) 
      };
      addMessage(`${opponentPokemon.name}'s health was sapped by Leech Seed!`);
      setBattleState(prev => prev ? { ...prev, playerActive: playerPokemon, opponentActive: opponentPokemon } : null);
      
      if (opponentPokemon.currentHp <= 0) {
        addMessage(`${opponentPokemon.name} fainted!`);
        handleOpponentFainted();
        return;
      }
    }
    
    // Process confusion (player)
    if (playerPokemon.volatileStatus.confusion && playerPokemon.volatileStatus.confusion > 0) {
      const newTurns = playerPokemon.volatileStatus.confusion - 1;
      playerPokemon = {
        ...playerPokemon,
        volatileStatus: {
          ...playerPokemon.volatileStatus,
          confusion: newTurns > 0 ? newTurns : undefined
        }
      };
      if (newTurns === 0) {
        addMessage(`${playerPokemon.name} snapped out of confusion!`);
      }
    }
    
    // Process confusion (opponent)
    if (opponentPokemon.volatileStatus.confusion && opponentPokemon.volatileStatus.confusion > 0) {
      const newTurns = opponentPokemon.volatileStatus.confusion - 1;
      opponentPokemon = {
        ...opponentPokemon,
        volatileStatus: {
          ...opponentPokemon.volatileStatus,
          confusion: newTurns > 0 ? newTurns : undefined
        }
      };
      if (newTurns === 0) {
        addMessage(`${opponentPokemon.name} snapped out of confusion!`);
      }
    }
    
// Process primary status damage (burn/poison/toxic) at end of turn
const ps1 = processStatus(playerPokemon);
if (ps1.message) addMessage(ps1.message);
playerPokemon = ps1.pokemon;

const ps2 = processStatus(opponentPokemon);
if (ps2.message) addMessage(ps2.message);
opponentPokemon = ps2.pokemon;

// Check faints from end-of-turn status
if (playerPokemon.currentHp <= 0) {
  addMessage(`${playerPokemon.name} fainted!`);
  handlePlayerFainted(playerPokemon);
  return;
}
if (opponentPokemon.currentHp <= 0) {
  addMessage(`${opponentPokemon.name} fainted!`);
  handleOpponentFainted(opponentPokemon, playerPokemon);
  return;
}

    // Update battle state with any changes (player + opponent parties)
    setBattleState(prev => {
      if (!prev) return null;
      const pIndex = prev.playerParty.findIndex(p => p === prev.playerActive);
      const oIndex = prev.opponentParty.findIndex(p => p === prev.opponentActive);
      return {
        ...prev,
        playerActive: playerPokemon,
        opponentActive: opponentPokemon,
        turn: prev.turn + 1,
        playerParty: pIndex >= 0 ? prev.playerParty.map((p, i) => (i === pIndex ? playerPokemon : p)) : prev.playerParty,
        opponentParty: oIndex >= 0 ? prev.opponentParty.map((p, i) => (i === oIndex ? opponentPokemon : p)) : prev.opponentParty,
      };
    });

    // Also update main party to persist end-of-turn effects
    setGameState(prev => {
      const currentBs = battleStateRef.current;
      if (!currentBs) return prev;
      const activeIndex = prev.playerParty.findIndex(p => p === currentBs.playerActive);
      if (activeIndex === -1) return prev;
      return {
        ...prev,
        playerParty: prev.playerParty.map((p, i) => (i === activeIndex ? playerPokemon : p))
      };
    });
    
    setBattleMenu('main');
  };

  // Handle opponent faint
  const handleOpponentFainted = (faintedOpponent?: Pokemon, activePlayer?: Pokemon) => {
    const bs = battleStateRef.current;
    if (!bs) return;
    const opponent = faintedOpponent ?? bs.opponentActive;
    const species = getPokemonById(opponent.speciesId);
    
    if (species) {
      const expGain = Math.floor((species.xp * opponent.level) / 7);
      const playerBase = activePlayer ?? bs.playerActive;
      const playerAfterExp: Pokemon = structuredClone(playerBase);
      const result = gainExperience(playerAfterExp, expGain, opponent.speciesId);
      result.messages.forEach(msg => addMessage(msg));
      
      // Update the Pokemon in party with new stats/level
      updatePokemonInParty(playerAfterExp);
      
      // Handle new moves
      if (result.newMoves.length > 0) {
        for (const newMove of result.newMoves) {
          const pokemon = playerAfterExp;
          const learned = learnMove(pokemon, newMove, 'levelup');
          if (!learned) continue; // Already knows move
          
          // If move learn dialog is shown, stop here and wait
          if (gameState.pendingMoveLearn) {
            return;
          }
        }
      }
    }

    // Check for more opponent Pokemon
    const remainingOpponents = bs.opponentParty.filter(p => p.currentHp > 0);
    
    if (remainingOpponents.length > 0) {
      setTimeout(() => {
        const nextOpponent = remainingOpponents[0];
        setBattleState(prev => prev ? {
          ...prev,
          opponentActive: nextOpponent
        } : null);
        addMessage(`${bs.opponentTrainerName || 'Wild'} sent out ${nextOpponent.name}!`);
      }, 1500);
    } else {
      // Battle won
      setTimeout(() => endBattle(true), 1500);
    }
  };

  // Handle player faint - auto-switch to next healthy Pokemon
  const handlePlayerFainted = (faintedPlayer?: Pokemon) => {
    const bs = battleStateRef.current;
    if (!bs) return;
    
    // Find next healthy Pokemon in party order
    const nextHealthyIndex = gameStateRef.current.playerParty.findIndex(p => p.currentHp > 0);
    
    if (nextHealthyIndex === -1) {
      // No healthy Pokemon left - white out
      addMessage('You whited out!');
      
      // Calculate money loss for trainer battles
      if (!bs.isWild && bs.opponentTrainerName) {
        const trainer = GYM_LEADERS.find(g => g.name === bs.opponentTrainerName) ||
                       ELITE_FOUR.find(e => e.name === bs.opponentTrainerName);
        const potentialReward = trainer?.reward || 2000;
        const moneyLost = Math.floor(potentialReward * 0.25);
        setGameState(prev => ({ ...prev, money: Math.max(0, prev.money - moneyLost) }));
        addMessage(`You lost ${moneyLost} to the winner!`);
      }
      
      setTimeout(() => {
        setGameState(prev => ({ 
          ...prev, 
          screen: 'overworld',
          playerParty: prev.playerParty.map(p => ({
            ...p,
            currentHp: p.maxHp,
            status: 'none' as PrimaryStatus,
            volatileStatus: {},
            statStages: generateStatStages(),
            moves: p.moves.map(m => ({ ...m, currentPp: m.maxPp }))
          }))
        }));
        setBattleState(null);
        addMessage('Your Pokemon were healed at the Pokemon Center!');
      }, 2000);
    } else {
      // Auto-switch to next healthy Pokemon
      const nextPokemon = gameStateRef.current.playerParty[nextHealthyIndex];
      addMessage(`${(faintedPlayer ?? bs.playerActive).name} fainted!`);
      
      setTimeout(() => {
        addMessage(`Go! ${nextPokemon.name}!`);
        setBattleState(prev => prev ? {
          ...prev,
          playerActive: nextPokemon
        } : null);
      }, 1000);
    }
  };

  // End battle
  const endBattle = (won: boolean) => {
    // Use ref snapshot to avoid stale closures in timeouts
    const bs = battleStateRef.current ?? battleState;
    if (!bs) return;
    
    if (won && !bs.isWild && bs.opponentTrainerName) {
      // Find trainer in Gym Leaders, Elite Four, or check if it's a route trainer
      const gymLeader = GYM_LEADERS.find(g => g.name === bs.opponentTrainerName);
      const eliteFour = ELITE_FOUR.find(e => e.name === bs.opponentTrainerName);
      
      if (gymLeader?.badge && !gameState.badges.includes(gymLeader.badge)) {
        // Gym leader with badge reward
        setGameState(prev => ({
          ...prev,
          badges: [...prev.badges, gymLeader.badge!],
          money: prev.money + gymLeader.reward
        }));
        addMessage(`Received the ${gymLeader.badge}!`);
        addMessage(`${gymLeader.class} ${gymLeader.name} paid out ${gymLeader.reward}!`);
      } else if (gymLeader) {
        // Rematch with gym leader
        setGameState(prev => ({ ...prev, money: prev.money + gymLeader.reward }));
        addMessage(`${gymLeader.class} ${gymLeader.name} paid out ${gymLeader.reward}!`);
      } else if (eliteFour) {
        // Elite Four member
        setGameState(prev => ({ ...prev, money: prev.money + eliteFour.reward }));
        addMessage(`${eliteFour.class} ${eliteFour.name} paid out ${eliteFour.reward}!`);
      } else {
        // Route trainer - reward was set when battle started
        const trainerReward = bs.battleType === 'trainer' ? 1500 : 2000;
        setGameState(prev => ({ ...prev, money: prev.money + trainerReward }));
        addMessage(`Got ${trainerReward} for winning!`);
      }
    }
    
    // Reset stat stages for all Pokemon after battle (status conditions persist)
    setGameState(prev => ({
      ...prev,
      playerParty: prev.playerParty.map(p => ({ ...p, statStages: generateStatStages() }))
    }));

    setGameState(prev => ({ ...prev, screen: 'overworld' }));
    setBattleState(null);
    setBattleMenu('main');
    setIsProcessingTurn(false);
  };

  // Use item in battle
  const useItemInBattle = (bagItem: { item: Item; quantity: number }) => {
    if (!battleState || isProcessingTurn) return;
    
    const { item } = bagItem;
    
    if (item.type === 'PokeBall' && battleState.isWild) {
      setIsProcessingTurn(true);
      const catchRate = calculateCatchRate(battleState.opponentActive, item.name);
      const roll = Math.random() * 100;
      
      addMessage(`You used a ${item.name}!`);
      
      if (roll <= catchRate || item.name === 'Master Ball') {
        addMessage(`Gotcha! ${battleState.opponentActive.name} was caught!`);
        
        const caughtPokemon = battleState.opponentActive;
        
        // Add to party or PC
        if (gameState.playerParty.length < 6) {
          setGameState(prev => ({
            ...prev,
            playerParty: [...prev.playerParty, caughtPokemon]
          }));
          addMessage(`${caughtPokemon.name} was added to your party!`);
        } else {
          // Send to PC
          setGameState(prev => {
            const { currentBoxIndex, boxes } = prev.pcStorage;
            const newBoxes = [...boxes];
            newBoxes[currentBoxIndex] = [...newBoxes[currentBoxIndex], caughtPokemon];
            return {
              ...prev,
              pcStorage: {
                ...prev.pcStorage,
                boxes: newBoxes
              }
            };
          });
          addMessage(`${caughtPokemon.name} was sent to Box ${gameState.pcStorage.currentBoxIndex + 1}!`);
        }
        
        setTimeout(() => {
          endBattle(true);
          setIsProcessingTurn(false);
        }, 1500);
      } else {
        addMessage(`Oh no! The Pokemon broke free!`);
        
        // Opponent gets a free attack after failed catch
        setTimeout(() => {
          const bs = battleStateRef.current;
          if (!bs) {
            setIsProcessingTurn(false);
            return;
          }

          const opponentPokemonBase = bs.opponentActive;
          const playerPokemonBase = bs.playerActive;
          const availableMoves = opponentPokemonBase.moves.filter(m => m.currentPp > 0);
          const opponentMove = availableMoves.length > 0
            ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
            : opponentPokemonBase.moves[0];

          const oppMoveCheck = canMove(opponentPokemonBase);
          if (oppMoveCheck.canMove) {
            const opponentPokemon = decrementMovePP(opponentPokemonBase, opponentMove.id);
            const opponentMoveUsed: Move = { ...opponentMove, currentPp: Math.max(0, opponentMove.currentPp - 1) };
            const res = executeMove(opponentPokemon, playerPokemonBase, opponentMoveUsed);
            res.messages.forEach(msg => addMessage(msg));

            setBattleState(prev => {
              if (!prev) return null;
              const pIndex = prev.playerParty.findIndex(p => p === prev.playerActive);
              const oIndex = prev.opponentParty.findIndex(p => p === prev.opponentActive);
              return {
                ...prev,
                playerActive: res.defender,
                opponentActive: res.attacker,
                playerParty: pIndex >= 0 ? prev.playerParty.map((p, i) => (i === pIndex ? res.defender : p)) : prev.playerParty,
                opponentParty: oIndex >= 0 ? prev.opponentParty.map((p, i) => (i === oIndex ? res.attacker : p)) : prev.opponentParty,
              };
            });

            setGameState(prev => {
              const currentBs = battleStateRef.current;
              if (!currentBs) return prev;
              const activeIndex = prev.playerParty.findIndex(p => p === currentBs.playerActive);
              if (activeIndex === -1) return prev;
              return { ...prev, playerParty: prev.playerParty.map((p, i) => (i === activeIndex ? res.defender : p)) };
            });

            if (res.defender.currentHp <= 0) {
              addMessage(`${res.defender.name} fainted!`);
              handlePlayerFainted(res.defender);
            } else {
              endTurn(res.defender, res.attacker);
            }
          } else {
            addMessage(oppMoveCheck.message);
            endTurn();
          }
          setIsProcessingTurn(false);
        }, 1500);
      }
      
      // Decrease item quantity
      setGameState(prev => ({
        ...prev,
        bag: prev.bag.map(bi => 
          bi.item.id === item.id 
            ? { ...bi, quantity: bi.quantity - 1 }
            : bi
        ).filter(bi => bi.quantity > 0)
      }));
      
      setShowBag(false);
    } else if (item.type === 'Potion') {
      const bs = battleStateRef.current;
      if (!bs) return;
      const result = useItemOnPokemon(item, bs.playerActive);
      addMessage(result.message);

      if (result.success && result.pokemon) {
        // Apply the healing immediately (immutable)
        const healed = result.pokemon;
        setBattleState(prev => {
          if (!prev) return null;
          const pIndex = prev.playerParty.findIndex(p => p === prev.playerActive);
          return {
            ...prev,
            playerActive: healed,
            playerParty: pIndex >= 0 ? prev.playerParty.map((p, i) => (i === pIndex ? healed : p)) : prev.playerParty,
          };
        });
        setGameState(prev => {
          const currentBs = battleStateRef.current;
          if (!currentBs) return prev;
          const activeIndex = prev.playerParty.findIndex(p => p === currentBs.playerActive);
          if (activeIndex === -1) return prev;
          return { ...prev, playerParty: prev.playerParty.map((p, i) => (i === activeIndex ? healed : p)) };
        });

        setIsProcessingTurn(true);
        setGameState(prev => ({
          ...prev,
          bag: prev.bag.map(bi => 
            bi.item.id === item.id 
              ? { ...bi, quantity: bi.quantity - 1 }
              : bi
          ).filter(bi => bi.quantity > 0)
        }));
        setShowBag(false);
        
        // Opponent gets a free attack after using item
        setTimeout(() => {
          const bs = battleStateRef.current;
          if (!bs) {
            setIsProcessingTurn(false);
            return;
          }

          const opponentPokemonBase = bs.opponentActive;
          const playerPokemonBase = bs.playerActive;
          const availableMoves = opponentPokemonBase.moves.filter(m => m.currentPp > 0);
          const opponentMove = availableMoves.length > 0
            ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
            : opponentPokemonBase.moves[0];

          const oppMoveCheck = canMove(opponentPokemonBase);
          if (oppMoveCheck.canMove) {
            const opponentPokemon = decrementMovePP(opponentPokemonBase, opponentMove.id);
            const opponentMoveUsed: Move = { ...opponentMove, currentPp: Math.max(0, opponentMove.currentPp - 1) };
            const res = executeMove(opponentPokemon, playerPokemonBase, opponentMoveUsed);
            res.messages.forEach(msg => addMessage(msg));

            setBattleState(prev => {
              if (!prev) return null;
              const pIndex = prev.playerParty.findIndex(p => p === prev.playerActive);
              const oIndex = prev.opponentParty.findIndex(p => p === prev.opponentActive);
              return {
                ...prev,
                playerActive: res.defender,
                opponentActive: res.attacker,
                playerParty: pIndex >= 0 ? prev.playerParty.map((p, i) => (i === pIndex ? res.defender : p)) : prev.playerParty,
                opponentParty: oIndex >= 0 ? prev.opponentParty.map((p, i) => (i === oIndex ? res.attacker : p)) : prev.opponentParty,
              };
            });

            setGameState(prev => {
              const currentBs = battleStateRef.current;
              if (!currentBs) return prev;
              const activeIndex = prev.playerParty.findIndex(p => p === currentBs.playerActive);
              if (activeIndex === -1) return prev;
              return { ...prev, playerParty: prev.playerParty.map((p, i) => (i === activeIndex ? res.defender : p)) };
            });

            if (res.defender.currentHp <= 0) {
              addMessage(`${res.defender.name} fainted!`);
              handlePlayerFainted(res.defender);
            } else {
              endTurn(res.defender, res.attacker);
            }
          } else {
            addMessage(oppMoveCheck.message);
            endTurn();
          }
          setIsProcessingTurn(false);
        }, 1000);
      }
    } else {
      addMessage("Can't use that item here!");
    }
  };

  // Switch Pokemon
  const switchPokemon = (index: number) => {
    if (!battleState || isProcessingTurn) return;
    
    const newPokemon = gameState.playerParty[index];
    if (newPokemon.currentHp <= 0) {
      addMessage(`${newPokemon.name} has no energy left to battle!`);
      return;
    }
    
    if (newPokemon === battleState.playerActive) {
      addMessage(`${newPokemon.name} is already in battle!`);
      return;
    }
    
    setIsProcessingTurn(true);
    addMessage(`Come back! ${battleState.playerActive.name}!`);
    addMessage(`Go! ${newPokemon.name}!`);
    
    setBattleState(prev => prev ? {
      ...prev,
      playerActive: newPokemon
    } : null);
    
    setShowParty(false);
    
    // Opponent gets a free attack after switch
    setTimeout(() => {
      const bs = battleStateRef.current;
      if (!bs) {
        setIsProcessingTurn(false);
        return;
      }

      const opponentPokemonBase = bs.opponentActive;
      const availableMoves = opponentPokemonBase.moves.filter(m => m.currentPp > 0);
      const opponentMove = availableMoves.length > 0
        ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
        : opponentPokemonBase.moves[0];

      const oppMoveCheck = canMove(opponentPokemonBase);
      if (oppMoveCheck.canMove) {
        const opponentPokemon = decrementMovePP(opponentPokemonBase, opponentMove.id);
        const opponentMoveUsed: Move = { ...opponentMove, currentPp: Math.max(0, opponentMove.currentPp - 1) };
        const res = executeMove(opponentPokemon, newPokemon, opponentMoveUsed);
        res.messages.forEach(msg => addMessage(msg));

        // Persist the damage + PP updates
        setBattleState(prev => {
          if (!prev) return null;
          const pIndex = prev.playerParty.findIndex(p => p === prev.playerActive);
          const oIndex = prev.opponentParty.findIndex(p => p === prev.opponentActive);
          return {
            ...prev,
            playerActive: res.defender,
            opponentActive: res.attacker,
            playerParty: pIndex >= 0 ? prev.playerParty.map((p, i) => (i === pIndex ? res.defender : p)) : prev.playerParty,
            opponentParty: oIndex >= 0 ? prev.opponentParty.map((p, i) => (i === oIndex ? res.attacker : p)) : prev.opponentParty,
          };
        });

        // Update main party
        setGameState(prev => {
          const activeIdx = prev.playerParty.findIndex(p => p === newPokemon);
          if (activeIdx === -1) return prev;
          return { ...prev, playerParty: prev.playerParty.map((p, i) => (i === activeIdx ? res.defender : p)) };
        });

        if (res.defender.currentHp <= 0) {
          addMessage(`${res.defender.name} fainted!`);
          handlePlayerFainted(res.defender);
        } else {
          endTurn(res.defender, res.attacker);
        }
      } else {
        addMessage(oppMoveCheck.message);
        endTurn();
      }
      setIsProcessingTurn(false);
    }, 1000);
  };

  // Try to escape
  const tryEscape = () => {
    if (!battleState || isProcessingTurn) return;
    
    if (!battleState.canEscape) {
      addMessage("Can't escape from a trainer battle!");
      return;
    }
    
    setIsProcessingTurn(true);
    
    const playerSpeed = battleState.playerActive.stats.speed;
    const opponentSpeed = battleState.opponentActive.stats.speed;
    
    const escapeChance = (playerSpeed * 32) / 
      ((opponentSpeed / 4) % 256) + 30 * battleState.turn;
    
    if (Math.random() * 256 < escapeChance) {
      addMessage('Got away safely!');
      setTimeout(() => {
        endBattle(false);
        setIsProcessingTurn(false);
      }, 1500);
    } else {
      addMessage("Can't escape!");
      
      // Opponent gets a free attack after failed escape
      setTimeout(() => {
        const opponentPokemon = battleState.opponentActive;
        const playerPokemon = battleState.playerActive;
        const availableMoves = opponentPokemon.moves.filter(m => m.currentPp > 0);
        const opponentMove = availableMoves.length > 0 
          ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
          : opponentPokemon.moves[0];
        
        const oppMoveCheck = canMove(opponentPokemon);
        if (oppMoveCheck.canMove) {
          const oppResult = calculateDamage(opponentPokemon, playerPokemon, opponentMove);
          addMessage(oppResult.message);
          
          if (oppResult.damage > 0) {
            playerPokemon.currentHp = Math.max(0, playerPokemon.currentHp - oppResult.damage);
          }
          
          if (playerPokemon.currentHp <= 0) {
            addMessage(`${playerPokemon.name} fainted!`);
            handlePlayerFainted();
          } else {
            endTurn();
          }
        } else {
          addMessage(oppMoveCheck.message);
          endTurn();
        }
        setIsProcessingTurn(false);
      }, 1000);
    }
  };

  // Save game
  const handleSaveGame = () => {
    if (saveGame(gameState)) {
      addMessage('Game saved!');
      setSaveExists(true);
      setSaveInfo(getSaveInfo());
    } else {
      addMessage('Failed to save game.');
    }
  };
  
  // Load game
  const handleLoadGame = () => {
    const loaded = loadGame();
    if (loaded) {
      setGameState(loaded);
      addMessage('Game loaded!');
    } else {
      addMessage('No save file found.');
    }
  };
  
  // Delete save
  const handleDeleteSave = () => {
    if (deleteSave()) {
      setSaveExists(false);
      setSaveInfo({ exists: false });
      addMessage('Save deleted!');
    }
  };

  // Render functions
  const renderTitleScreen = () => (
    <div className="min-h-screen bg-gradient-to-b from-red-600 to-red-800 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">Pokémon</h1>
        <h2 className="text-3xl text-yellow-300 mb-2">Red & Blue</h2>
        <p className="text-white/80">Text Adventure</p>
      </div>
      
      <div className="space-y-4 w-64">
        {saveExists && (
          <Button 
            size="lg" 
            onClick={handleLoadGame}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
          >
            Continue
            {saveInfo.savedAt && (
              <span className="text-xs block font-normal">Saved: {saveInfo.savedAt}</span>
            )}
          </Button>
        )}
        
        <Button 
          size="lg" 
          onClick={startNewGame}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
        >
          New Game
        </Button>
        
        {saveExists && (
          <Button 
            size="lg" 
            onClick={handleDeleteSave}
            variant="destructive"
            className="w-full"
          >
            Delete Save
          </Button>
        )}
      </div>
      
      <div className="mt-12 text-white/60 text-sm text-center">
        <p>All 151 Gen 1 Pokémon • Full Battle System</p>
        <p>IVs/EVs • Status Effects • Gyms & Elite 4</p>
        <p>Save System • Route Trainers • Class-Based Payouts</p>
      </div>
    </div>
  );

  const renderStarterSelection = () => (
    <div className="min-h-screen bg-gradient-to-b from-green-600 to-blue-600 flex flex-col items-center justify-center p-8">
      <h2 className="text-3xl font-bold text-white mb-8">Choose Your Starter!</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:scale-105 transition-transform bg-green-500 border-4 border-green-700"
          onClick={() => selectStarter(1)}
        >
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">🌿</div>
            <h3 className="text-2xl font-bold text-white">Bulbasaur</h3>
            <p className="text-white/80 text-sm mt-2">Grass/Poison</p>
            <p className="text-white/60 text-xs mt-1">The Seed Pokémon</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:scale-105 transition-transform bg-orange-500 border-4 border-orange-700"
          onClick={() => selectStarter(4)}
        >
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">🔥</div>
            <h3 className="text-2xl font-bold text-white">Charmander</h3>
            <p className="text-white/80 text-sm mt-2">Fire</p>
            <p className="text-white/60 text-xs mt-1">The Lizard Pokémon</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:scale-105 transition-transform bg-blue-500 border-4 border-blue-700"
          onClick={() => selectStarter(7)}
        >
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">💧</div>
            <h3 className="text-2xl font-bold text-white">Squirtle</h3>
            <p className="text-white/80 text-sm mt-2">Water</p>
            <p className="text-white/60 text-xs mt-1">The Tiny Turtle Pokémon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderOverworld = () => (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{gameState.playerName}</h2>
            <p className="text-gray-600">💰 {gameState.money}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{gameState.badges.length} Badges</Badge>
            <Badge variant="outline">{gameState.currentLocation}</Badge>
          </div>
        </div>

        {/* Badges */}
        {gameState.badges.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="font-bold mb-2">Badges</h3>
            <div className="flex flex-wrap gap-2">
              {gameState.badges.map((badge, i) => (
                <Badge key={i} className="bg-yellow-500">{badge}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Party Preview */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="font-bold mb-2">Your Party</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {gameState.playerParty.map((pokemon, i) => (
              <div 
                key={i} 
                className="border rounded p-2 cursor-pointer hover:bg-gray-50"
                onClick={() => setShowPokemonDetail(pokemon)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{pokemon.name}</span>
                  <span className="text-sm text-gray-500">Lv.{pokemon.level}</span>
                </div>
                <div className="flex gap-1 mt-1">
                  {pokemon.types.map((t, j) => (
                    <span key={j} className={`text-xs px-1 rounded text-white ${typeColors[t]}`}>
                      {t}
                    </span>
                  ))}
                </div>
                <Progress 
                  value={(pokemon.currentHp / pokemon.maxHp) * 100} 
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Location & Route Info */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Route {currentRoute}</h3>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setCurrentRoute(Math.max(1, currentRoute - 1))}
                disabled={currentRoute <= 1}
              >
                ← Prev
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setCurrentRoute(Math.min(25, currentRoute + 1))}
                disabled={currentRoute >= 25}
              >
                Next →
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {currentRoute === 1 && "A peaceful route with weak wild Pokemon."}
            {currentRoute === 2 && "A grassy route with more diverse Pokemon."}
            {currentRoute >= 3 && currentRoute <= 5 && "Trainers are getting tougher here."}
            {currentRoute >= 6 && currentRoute <= 10 && "Stronger wild Pokemon roam these areas."}
            {currentRoute >= 11 && currentRoute <= 15 && "Experienced trainers battle here."}
            {currentRoute >= 16 && currentRoute <= 20 && "High-level Pokemon territory."}
            {currentRoute >= 21 && "The toughest routes in the region."}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button onClick={startWildBattle} className="h-20">
            <Swords className="mr-2" />
            Wild Battle
          </Button>
          <Button onClick={() => startTrainerBattle(generateRouteTrainer(currentRoute))} variant="secondary" className="h-20">
            <Trophy className="mr-2" />
            Trainer Battle
          </Button>
          <Button onClick={() => { setShowParty(true); setPartyReorderMode(false); }} variant="outline" className="h-20">
            <Users className="mr-2" />
            Party
          </Button>
          <Button onClick={() => setShowBag(true)} variant="outline" className="h-20">
            <Backpack className="mr-2" />
            Bag
          </Button>
          <Button 
            onClick={() => {
              setGameState(prev => ({
                ...prev,
                playerParty: prev.playerParty.map(p => ({
                  ...p,
                  currentHp: p.maxHp,
                  status: 'none' as PrimaryStatus,
                  volatileStatus: {},
                  statStages: generateStatStages(),
                  moves: p.moves.map(m => ({ ...m, currentPp: m.maxPp }))
                }))
              }));
              addMessage('Your Pokemon were fully healed!');
              addMessage('All PP was restored!');
              addMessage('All status conditions were cured!');
            }} 
            variant="default" 
            className="h-20 bg-pink-500 hover:bg-pink-600"
          >
            <span className="mr-2">🏥</span>
            PokeCenter
          </Button>
          <Button 
            onClick={() => setGameState(prev => ({ ...prev, screen: 'pokemart' }))} 
            variant="default" 
            className="h-20 bg-blue-500 hover:bg-blue-600"
          >
            <span className="mr-2">🏪</span>
            PokeMart
          </Button>
          <Button 
            onClick={() => startTrainerBattle(GYM_LEADERS[Math.min(gameState.badges.length, 7)])} 
            variant="default" 
            className="h-20 bg-gradient-to-r from-yellow-500 to-orange-500"
          >
            <Trophy className="mr-2" />
            Gym {gameState.badges.length + 1}
          </Button>
          <Button 
            onClick={() => setShowPC(true)} 
            variant="outline" 
            className="h-20 bg-blue-100 hover:bg-blue-200"
          >
            <span className="mr-2">💻</span>
            PC Storage
          </Button>
        </div>
        
        {/* Save Game */}
        <div className="mt-4">
          <Button 
            onClick={handleSaveGame}
            className="w-full h-16 bg-green-600 hover:bg-green-700"
          >
            💾 Save Game
          </Button>
        </div>

        {/* Elite 4 (if all badges) */}
        {gameState.badges.length === 8 && (
          <div className="mt-4">
            <Button 
              onClick={() => startTrainerBattle(ELITE_FOUR[0])} 
              className="w-full h-16 bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="mr-2" />
              Challenge Elite Four
            </Button>
          </div>
        )}
      </div>

      {/* Party Dialog */}
      <Dialog open={showParty} onOpenChange={(open) => { setShowParty(open); if (!open) { setPartyReorderMode(false); setSelectedForSwap(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Your Party {partyReorderMode && <span className="text-sm text-blue-600">(Reorder Mode)</span>}</span>
              <Button 
                size="sm" 
                variant={partyReorderMode ? "default" : "outline"}
                onClick={() => { setPartyReorderMode(!partyReorderMode); setSelectedForSwap(null); }}
              >
                {partyReorderMode ? "Done" : "Reorder"}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {gameState.playerParty.map((pokemon, i) => (
              <Card 
                key={i} 
                className={`${partyReorderMode ? 'cursor-pointer' : 'cursor-pointer'} ${selectedForSwap === i ? 'ring-2 ring-blue-500' : ''} ${i === 0 ? 'border-l-4 border-l-yellow-500' : ''}`}
                onClick={() => handlePartySlotClick(i)}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {/* Slot number */}
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold">{pokemon.name} <span className="text-gray-500">Lv.{pokemon.level}</span></h4>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {pokemon.types.map((t, j) => (
                          <Badge key={j} className={typeColors[t]}>{t}</Badge>
                        ))}
                        {pokemon.status !== 'none' && (
                          <Badge className={`${statusColors[pokemon.status]} bg-white border`}>
                            {statusIcons[pokemon.status]} {pokemon.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p>HP: {pokemon.currentHp}/{pokemon.maxHp}</p>
                    <Progress value={(pokemon.currentHp / pokemon.maxHp) * 100} className="w-32 mt-1" />
                    {partyReorderMode && (
                      <div className="flex gap-1 mt-2 justify-end">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled={i === 0}
                          onClick={(e) => { e.stopPropagation(); movePartyUp(i); }}
                        >
                          ↑
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled={i === gameState.playerParty.length - 1}
                          onClick={(e) => { e.stopPropagation(); movePartyDown(i); }}
                        >
                          ↓
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {partyReorderMode && (
            <p className="text-sm text-gray-500 text-center">
              Click two Pokemon to swap them, or use arrows to move up/down
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Bag Dialog */}
      <Dialog open={showBag} onOpenChange={setShowBag}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your Bag</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {gameState.bag.map((bagItem, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">{bagItem.item.name}</span>
                    <span className="text-gray-500">x{bagItem.quantity}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{bagItem.item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* PC Storage Dialog */}
      <Dialog open={showPC} onOpenChange={setShowPC}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>PC Storage - Box {gameState.pcStorage.currentBoxIndex + 1}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => switchPCBox('prev')}>← Prev</Button>
                <Button size="sm" variant="outline" onClick={() => switchPCBox('next')}>Next →</Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Current Box */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Box {gameState.pcStorage.currentBoxIndex + 1} ({gameState.pcStorage.boxes[gameState.pcStorage.currentBoxIndex].length}/30)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {gameState.pcStorage.boxes[gameState.pcStorage.currentBoxIndex].map((pokemon, i) => (
                <Card key={i} className="relative">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm">{pokemon.name}</p>
                        <p className="text-xs text-gray-500">Lv.{pokemon.level}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 text-green-600"
                          onClick={() => withdrawFromPC(gameState.pcStorage.currentBoxIndex, i)}
                          disabled={gameState.playerParty.length >= 6}
                          title="Withdraw"
                        >
                          ↓
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 text-red-600"
                          onClick={() => releaseFromPC(gameState.pcStorage.currentBoxIndex, i)}
                          title="Release"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {pokemon.types.map((t, j) => (
                        <span key={j} className={`text-xs px-1 rounded text-white ${typeColors[t]}`}>{t}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {gameState.pcStorage.boxes[gameState.pcStorage.currentBoxIndex].length === 0 && (
                <p className="text-gray-500 text-sm col-span-3 text-center py-4">This box is empty</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Party - can deposit from here */}
          <div className="mt-4">
            <h4 className="font-medium mb-2">Your Party ({gameState.playerParty.length}/6)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {gameState.playerParty.map((pokemon, i) => (
                <Card key={i} className="relative">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm">{pokemon.name}</p>
                        <p className="text-xs text-gray-500">Lv.{pokemon.level}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0 text-blue-600"
                        onClick={() => depositToPC(i)}
                        disabled={gameState.playerParty.filter(p => p.currentHp > 0).length <= 1 && pokemon.currentHp > 0}
                        title="Deposit"
                      >
                        ↑
                      </Button>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {pokemon.types.map((t, j) => (
                        <span key={j} className={`text-xs px-1 rounded text-white ${typeColors[t]}`}>{t}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pokemon Detail Dialog */}
      <Dialog open={!!showPokemonDetail} onOpenChange={() => setShowPokemonDetail(null)}>
        {showPokemonDetail && (
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{showPokemonDetail.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Level: {showPokemonDetail.level}</span>
                {showPokemonDetail.status !== 'none' && (
                  <span className={`${statusColors[showPokemonDetail.status]} font-bold`}>
                    {statusIcons[showPokemonDetail.status]} {showPokemonDetail.status.toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* HP Bar */}
              <div>
                <p className="font-medium">HP: {showPokemonDetail.currentHp}/{showPokemonDetail.maxHp}</p>
                <Progress value={(showPokemonDetail.currentHp / showPokemonDetail.maxHp) * 100} />
              </div>
              
              {/* Experience Bar */}
              {(() => {
                const expInfo = getExpToNextLevel(showPokemonDetail);
                const expPercent = (expInfo.current / expInfo.needed) * 100;
                return (
                  <div>
                    <p className="font-medium text-sm">EXP: {expInfo.current}/{expInfo.needed} (Next: {expInfo.toNext})</p>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all" 
                        style={{ width: `${expPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Stats with Stages */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(() => {
                  const p = showPokemonDetail;
                  const getStageDisplay = (stage: number) => {
                    if (stage > 0) return <span className="text-green-600 font-bold">+{stage}</span>;
                    if (stage < 0) return <span className="text-red-600 font-bold">{stage}</span>;
                    return null;
                  };
                  return (
                    <>
                      <div>Attack: {p.stats.attack} {getStageDisplay(p.statStages.atk)}</div>
                      <div>Defense: {p.stats.defense} {getStageDisplay(p.statStages.def)}</div>
                      <div>Sp. Attack: {p.stats.spAttack} {getStageDisplay(p.statStages.spa)}</div>
                      <div>Sp. Defense: {p.stats.spDefense} {getStageDisplay(p.statStages.spd)}</div>
                      <div>Speed: {p.stats.speed} {getStageDisplay(p.statStages.spe)}</div>
                      {p.statStages.acc !== 0 && (
                        <div>Accuracy: {getStageDisplay(p.statStages.acc)}</div>
                      )}
                      {p.statStages.eva !== 0 && (
                        <div>Evasion: {getStageDisplay(p.statStages.eva)}</div>
                      )}
                    </>
                  );
                })()}
              </div>

              <Separator />

              <div>
                <p className="font-medium mb-2">IVs (Individual Values)</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>HP: {showPokemonDetail.ivs.hp}</div>
                  <div>Atk: {showPokemonDetail.ivs.attack}</div>
                  <div>Def: {showPokemonDetail.ivs.defense}</div>
                  <div>SpA: {showPokemonDetail.ivs.spAttack}</div>
                  <div>SpD: {showPokemonDetail.ivs.spDefense}</div>
                  <div>Spe: {showPokemonDetail.ivs.speed}</div>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2">EVs (Effort Values)</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>HP: {showPokemonDetail.evs.hp}</div>
                  <div>Atk: {showPokemonDetail.evs.attack}</div>
                  <div>Def: {showPokemonDetail.evs.defense}</div>
                  <div>SpA: {showPokemonDetail.evs.spAttack}</div>
                  <div>SpD: {showPokemonDetail.evs.spDefense}</div>
                  <div>Spe: {showPokemonDetail.evs.speed}</div>
                </div>
              </div>

              {showPokemonDetail.ability && (
                <div>
                  <p className="font-medium">Ability: {showPokemonDetail.ability}</p>
                </div>
              )}

              <div>
                <p className="font-medium mb-2">Moves</p>
                <div className="space-y-1">
                  {showPokemonDetail.moves.map((move, i) => (
                    <div key={i} className="flex justify-between text-sm border-b pb-1">
                      <span>{move.name}</span>
                      <span className="text-gray-500">{move.currentPp}/{move.maxPp} PP • {move.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Move Learn Dialog */}
      <Dialog open={!!moveLearnDialog} onOpenChange={() => setMoveLearnDialog(null)}>
        {moveLearnDialog && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Learn New Move</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>{moveLearnDialog.pokemon.name} wants to learn <strong>{moveLearnDialog.newMove.name}</strong>!</p>
              <p className="text-sm text-gray-600">{moveLearnDialog.newMove.description}</p>
              <p className="text-sm">But {moveLearnDialog.pokemon.name} already knows 4 moves. Which move should be forgotten?</p>
              
              <div className="space-y-2">
                {moveLearnDialog.pokemon.moves.map((move, i) => (
                  <Button 
                    key={i} 
                    onClick={() => replaceMove(i)}
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <span>Forget {move.name}</span>
                    <span className="text-xs text-gray-500">{move.type} • {move.power || 'Status'}</span>
                  </Button>
                ))}
              </div>
              
              <Button onClick={skipMoveLearn} variant="ghost" className="w-full">
                Don't learn {moveLearnDialog.newMove.name}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );

const renderPokeMart = () => {
  const martItems = GEN1_ITEMS.filter(i =>
    i.price > 0 &&
    (i.type === "PokeBall" || i.type === "Potion" || i.type === "StatusHeal" || i.type === "Other")
  );

  const getQty = (itemId: number) => {
    const found = gameState.bag.find(b => b.item.id === itemId);
    return found ? found.quantity : 0;
  };

  const buyItem = (item: Item) => {
    setGameState(prev => {
      if (prev.money < item.price) {
        setMartMessage(`Not enough money for ${item.name}!`);
        return prev;
      }
      const existing = prev.bag.find(b => b.item.id === item.id);
      const newBag = existing
        ? prev.bag.map(b => b.item.id === item.id ? { ...b, quantity: b.quantity + 1 } : b)
        : [...prev.bag, { item, quantity: 1 }];

      setMartMessage(`Bought 1 ${item.name} for $${item.price}.`);
      return { ...prev, money: prev.money - item.price, bag: newBag };
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">🏪 Poké Mart</h2>
            <p className="text-gray-600">Money: <span className="font-bold">${gameState.money}</span></p>
          </div>
          <Button
            onClick={() => {
              setMartMessage('');
              setGameState(prev => ({ ...prev, screen: 'overworld' }));
            }}
            variant="outline"
          >
            Back
          </Button>
        </div>

        {martMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-3 mb-4">
            {martMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {martItems.map(item => (
            <Card key={item.id} className="bg-white">
              <CardContent className="p-4 flex justify-between items-start">
                <div className="pr-4">
                  <div className="font-bold">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                  <div className="text-sm mt-2">
                    <span className="font-semibold">Price:</span> ${item.price}
                    <span className="ml-3 text-gray-500">In Bag: {getQty(item.id)}</span>
                  </div>
                </div>
                <Button onClick={() => buyItem(item)} className="shrink-0">
                  Buy
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};



  const renderBattle = () => {
    if (!battleState) return null;
    
    const playerPokemon = battleState.playerActive;
    const opponentPokemon = battleState.opponentActive;
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Battle Scene */}
          <div className="bg-gradient-to-b from-sky-300 to-green-300 rounded-lg p-6 mb-4 min-h-[300px] relative">
            {/* Opponent */}
            <div className="flex justify-end mb-8">
              <div className="bg-white/90 rounded-lg p-4 min-w-[220px]">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{opponentPokemon.name}</span>
                  <span className="text-sm">Lv.{opponentPokemon.level}</span>
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {/* Primary Status */}
                  {opponentPokemon.status !== 'none' && (
                    <Badge className={`${statusColors[opponentPokemon.status]}`}>
                      {statusIcons[opponentPokemon.status]} {opponentPokemon.status.toUpperCase()}
                    </Badge>
                  )}
                  {/* Volatile Status */}
                  {opponentPokemon.volatileStatus.confusion && (
                    <Badge className="bg-pink-500 text-white">
                      {volatileIcons.confusion} {opponentPokemon.volatileStatus.confusion}
                    </Badge>
                  )}
                  {opponentPokemon.volatileStatus.leechSeed && (
                    <Badge className="bg-green-500 text-white">
                      {volatileIcons.leechSeed}
                    </Badge>
                  )}
                  {/* Stat Stages */}
                  {opponentPokemon.statStages.atk !== 0 && (
                    <Badge className={opponentPokemon.statStages.atk > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.atk} {opponentPokemon.statStages.atk > 0 ? '▲' : '▼'}{Math.abs(opponentPokemon.statStages.atk)}
                    </Badge>
                  )}
                  {opponentPokemon.statStages.def !== 0 && (
                    <Badge className={opponentPokemon.statStages.def > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.def} {opponentPokemon.statStages.def > 0 ? '▲' : '▼'}{Math.abs(opponentPokemon.statStages.def)}
                    </Badge>
                  )}
                  {opponentPokemon.statStages.spa !== 0 && (
                    <Badge className={opponentPokemon.statStages.spa > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.spa} {opponentPokemon.statStages.spa > 0 ? '▲' : '▼'}{Math.abs(opponentPokemon.statStages.spa)}
                    </Badge>
                  )}
                  {opponentPokemon.statStages.spd !== 0 && (
                    <Badge className={opponentPokemon.statStages.spd > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.spd} {opponentPokemon.statStages.spd > 0 ? '▲' : '▼'}{Math.abs(opponentPokemon.statStages.spd)}
                    </Badge>
                  )}
                  {opponentPokemon.statStages.spe !== 0 && (
                    <Badge className={opponentPokemon.statStages.spe > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.spe} {opponentPokemon.statStages.spe > 0 ? '▲' : '▼'}{Math.abs(opponentPokemon.statStages.spe)}
                    </Badge>
                  )}
                  {opponentPokemon.statStages.acc !== 0 && (
                    <Badge className={opponentPokemon.statStages.acc > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.acc} {opponentPokemon.statStages.acc > 0 ? '▲' : '▼'}{Math.abs(opponentPokemon.statStages.acc)}
                    </Badge>
                  )}
                  {opponentPokemon.statStages.eva !== 0 && (
                    <Badge className={opponentPokemon.statStages.eva > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.eva} {opponentPokemon.statStages.eva > 0 ? '▲' : '▼'}{Math.abs(opponentPokemon.statStages.eva)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs">HP</span>
                  <Progress 
                    value={(opponentPokemon.currentHp / opponentPokemon.maxHp) * 100}
                    className="flex-1"
                  />
                </div>
                <p className="text-right text-sm mt-1">{opponentPokemon.currentHp}/{opponentPokemon.maxHp}</p>
              </div>
            </div>

            {/* Player */}
            <div className="flex justify-start">
              <div className="bg-white/90 rounded-lg p-4 min-w-[220px]">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{playerPokemon.name}</span>
                  <span className="text-sm">Lv.{playerPokemon.level}</span>
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {/* Primary Status */}
                  {playerPokemon.status !== 'none' && (
                    <Badge className={`${statusColors[playerPokemon.status]}`}>
                      {statusIcons[playerPokemon.status]} {playerPokemon.status.toUpperCase()}
                    </Badge>
                  )}
                  {/* Volatile Status */}
                  {playerPokemon.volatileStatus.confusion && (
                    <Badge className="bg-pink-500 text-white">
                      {volatileIcons.confusion} {playerPokemon.volatileStatus.confusion}
                    </Badge>
                  )}
                  {playerPokemon.volatileStatus.leechSeed && (
                    <Badge className="bg-green-500 text-white">
                      {volatileIcons.leechSeed}
                    </Badge>
                  )}
                  {/* Stat Stages */}
                  {playerPokemon.statStages.atk !== 0 && (
                    <Badge className={playerPokemon.statStages.atk > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.atk} {playerPokemon.statStages.atk > 0 ? '▲' : '▼'}{Math.abs(playerPokemon.statStages.atk)}
                    </Badge>
                  )}
                  {playerPokemon.statStages.def !== 0 && (
                    <Badge className={playerPokemon.statStages.def > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.def} {playerPokemon.statStages.def > 0 ? '▲' : '▼'}{Math.abs(playerPokemon.statStages.def)}
                    </Badge>
                  )}
                  {playerPokemon.statStages.spa !== 0 && (
                    <Badge className={playerPokemon.statStages.spa > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.spa} {playerPokemon.statStages.spa > 0 ? '▲' : '▼'}{Math.abs(playerPokemon.statStages.spa)}
                    </Badge>
                  )}
                  {playerPokemon.statStages.spd !== 0 && (
                    <Badge className={playerPokemon.statStages.spd > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.spd} {playerPokemon.statStages.spd > 0 ? '▲' : '▼'}{Math.abs(playerPokemon.statStages.spd)}
                    </Badge>
                  )}
                  {playerPokemon.statStages.spe !== 0 && (
                    <Badge className={playerPokemon.statStages.spe > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.spe} {playerPokemon.statStages.spe > 0 ? '▲' : '▼'}{Math.abs(playerPokemon.statStages.spe)}
                    </Badge>
                  )}
                  {playerPokemon.statStages.acc !== 0 && (
                    <Badge className={playerPokemon.statStages.acc > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.acc} {playerPokemon.statStages.acc > 0 ? '▲' : '▼'}{Math.abs(playerPokemon.statStages.acc)}
                    </Badge>
                  )}
                  {playerPokemon.statStages.eva !== 0 && (
                    <Badge className={playerPokemon.statStages.eva > 0 ? 'bg-green-500' : 'bg-red-500'}>
                      {statStageIcons.eva} {playerPokemon.statStages.eva > 0 ? '▲' : '▼'}{Math.abs(playerPokemon.statStages.eva)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs">HP</span>
                  <Progress 
                    value={(playerPokemon.currentHp / playerPokemon.maxHp) * 100}
                    className="flex-1"
                  />
                </div>
                <p className="text-right text-sm mt-1">{playerPokemon.currentHp}/{playerPokemon.maxHp}</p>
                
                {/* Experience Bar */}
                {(() => {
                  const expInfo = getExpToNextLevel(playerPokemon);
                  const expPercent = (expInfo.current / expInfo.needed) * 100;
                  return (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">EXP</span>
                        <div className="flex-1 bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all" 
                            style={{ width: `${expPercent}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-right text-xs mt-1 text-gray-500">{expInfo.toNext} to Lv.{playerPokemon.level + 1}</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Message Log */}
          <Card className="mb-4 bg-black text-green-400 font-mono">
            <CardContent className="p-4">
              <ScrollArea className="h-32">
                {messageLog.slice(-5).map((msg, i) => (
                  <p key={i} className="mb-1">{msg}</p>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Battle Menu */}
          <Card>
            <CardContent className="p-4">
              {battleMenu === 'main' && (
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => setBattleMenu('moves')} className="h-16" disabled={isProcessingTurn}>
                    <Swords className="mr-2" />
                    Fight
                  </Button>
                  <Button onClick={() => setShowBag(true)} variant="secondary" className="h-16" disabled={isProcessingTurn}>
                    <Backpack className="mr-2" />
                    Bag
                  </Button>
                  <Button onClick={() => setShowParty(true)} variant="outline" className="h-16" disabled={isProcessingTurn}>
                    <Users className="mr-2" />
                    Pokémon
                  </Button>
                  {battleState.isWild && (
                    <Button onClick={tryEscape} variant="destructive" className="h-16" disabled={isProcessingTurn}>
                      <Wind className="mr-2" />
                      Run
                    </Button>
                  )}
                </div>
              )}

              {battleMenu === 'moves' && (
                <div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {playerPokemon.moves.every(m => m.currentPp <= 0) ? (
                      <Button
                        onClick={() => executePlayerMove(STRUGGLE)}
                        disabled={isProcessingTurn}
                        variant="destructive"
                        className="h-16 justify-between col-span-2"
                      >
                        <div className="text-left">
                          <div className="font-bold">{STRUGGLE.name}</div>
                          <div className="text-xs opacity-80">{STRUGGLE.type} • {STRUGGLE.category}</div>
                        </div>
                        <div className="text-right text-sm">
                          ∞
                        </div>
                      </Button>
                    ) : (
                      playerPokemon.moves.map((move, i) => (
                        <Button
                          key={i}
                          onClick={() => executePlayerMove(move)}
                          disabled={move.currentPp <= 0 || isProcessingTurn}
                          variant={move.currentPp > 0 ? 'default' : 'ghost'}
                          className="h-16 justify-between"
                        >
                          <div className="text-left">
                            <div className="font-bold">{move.name}</div>
                            <div className="text-xs opacity-80">{move.type} • {move.category}</div>
                          </div>
                          <div className="text-right text-sm">
                            {move.currentPp}/{move.maxPp}
                          </div>
                        </Button>
                      ))
                    )}
                  </div>
                  <Button onClick={() => setBattleMenu('main')} variant="outline" className="w-full" disabled={isProcessingTurn}>
                    Back
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bag Dialog (Battle) */}
        <Dialog open={showBag} onOpenChange={setShowBag}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bag</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              {gameState.bag.map((bagItem, i) => (
                <Card key={i} className="cursor-pointer" onClick={() => useItemInBattle(bagItem)}>
                  <CardContent className="p-3">
                    <div className="flex justify-between">
                      <span className="font-medium">{bagItem.item.name}</span>
                      <span className="text-gray-500">x{bagItem.quantity}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{bagItem.item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Party Dialog (Battle) */}
        <Dialog open={showParty} onOpenChange={setShowParty}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Switch Pokémon</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {gameState.playerParty.map((pokemon, i) => (
                <Card 
                  key={i} 
                  className={`cursor-pointer ${pokemon.currentHp <= 0 ? 'opacity-50' : ''}`}
                  onClick={() => pokemon.currentHp > 0 && switchPokemon(i)}
                >
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{pokemon.name} <span className="text-gray-500">Lv.{pokemon.level}</span></h4>
                      <div className="flex gap-1 mt-1">
                        {pokemon.types.map((t, j) => (
                          <Badge key={j} className={typeColors[t]}>{t}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p>HP: {pokemon.currentHp}/{pokemon.maxHp}</p>
                      {pokemon.status !== 'none' && (
                        <span className={statusColors[pokemon.status]}>
                          {statusIcons[pokemon.status]} {pokemon.status}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Main render
  return (
    <div className="min-h-screen bg-gray-100">
      {gameState.screen === 'title' && renderTitleScreen()}
      {gameState.screen === 'starter' && renderStarterSelection()}
      {gameState.screen === 'overworld' && renderOverworld()}
      {gameState.screen === 'pokemart' && renderPokeMart()}
      {gameState.screen === 'battle' && renderBattle()}
    </div>
  );
}

export default App;
