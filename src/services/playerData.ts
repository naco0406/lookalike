// playerData.ts
import { KBOPlayer } from "../types/types";

export async function loadMediapipeData(): Promise<KBOPlayer[]> {
    try {
        const response = await fetch('/data/player-embeddings-mediapipe.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.map((player: any) => ({
            ...player,
            descriptor: new Float32Array(player.descriptor)
        }));
    } catch (error) {
        console.error('Failed to load mediapipe data:', error);
        throw error;
    }
}

export async function loadFaceApiData(): Promise<KBOPlayer[]> {
    try {
        const response = await fetch('/data/player-embeddings.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.map((player: any) => ({
            ...player,
            descriptor: new Float32Array(player.descriptor)
        }));
    } catch (error) {
        console.error('Failed to load face-api data:', error);
        throw error;
    }
}