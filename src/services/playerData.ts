// src/services/playerData.ts

import { KBOPlayer } from "../types/types";

export async function loadPlayerData(): Promise<KBOPlayer[]> {
  try {
    const response = await fetch('/data/player-embeddings.json');
    const data = await response.json();
    
    // JSON으로 저장된 descriptor를 Float32Array로 변환
    return data.map((player: any) => ({
      ...player,
      descriptor: new Float32Array(player.descriptor)
    }));
  } catch (error) {
    console.error('Failed to load player data:', error);
    return [];
  }
}