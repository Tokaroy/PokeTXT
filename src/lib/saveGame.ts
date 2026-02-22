// Save/Load game system using localStorage
import type { GameState } from "@/types";

const SAVE_KEY = 'pokemon-game-save';

export interface SaveData {
  gameState: GameState;
  version: string;
  savedAt: string;
}

// Check if save exists
export function hasSave(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SAVE_KEY) !== null;
}

// Save game
export function saveGame(gameState: GameState): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const saveData: SaveData = {
      gameState: JSON.parse(JSON.stringify(gameState)),
      version: '1.0',
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (e) {
    console.error('Failed to save game:', e);
    return false;
  }
}

// Load game
export function loadGame(): GameState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saveJson = localStorage.getItem(SAVE_KEY);
    if (!saveJson) return null;
    
    const saveData: SaveData = JSON.parse(saveJson);
    return saveData.gameState;
  } catch (e) {
    console.error('Failed to load game:', e);
    return null;
  }
}

// Delete save
export function deleteSave(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (e) {
    console.error('Failed to delete save:', e);
    return false;
  }
}

// Get save info
export function getSaveInfo(): { exists: boolean; savedAt?: string } {
  if (typeof window === 'undefined') return { exists: false };
  
  try {
    const saveJson = localStorage.getItem(SAVE_KEY);
    if (!saveJson) return { exists: false };
    
    const saveData: SaveData = JSON.parse(saveJson);
    return { 
      exists: true, 
      savedAt: new Date(saveData.savedAt).toLocaleString() 
    };
  } catch (e) {
    return { exists: false };
  }
}
