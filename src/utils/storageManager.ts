// src/utils/storageManager.ts
import { CONFIG } from '../constants/config';
import { IStorageManager, KBOPlayer } from '../types/types';

export class StorageManager implements IStorageManager {
    private static instance: StorageManager | null = null;

    private constructor() { }

    public static getInstance(): StorageManager {
        if (!this.instance) {
            this.instance = new StorageManager();
        }
        return this.instance;
    }

    public async savePlayerData(players: KBOPlayer[]): Promise<void> {
        try {
            const serializedData = players.map(player => ({
                ...player,
                descriptor: player.descriptor ? Array.from(player.descriptor) : undefined
            }));

            localStorage.setItem(
                CONFIG.STORAGE.PLAYERS_KEY,
                JSON.stringify({
                    version: CONFIG.STORAGE.VERSION,
                    data: serializedData,
                    timestamp: Date.now()
                })
            );
        } catch (error) {
            console.error('Failed to save player data:', error);
            throw error;
        }
    }

    public async loadPlayerData(): Promise<KBOPlayer[]> {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE.PLAYERS_KEY);
            if (!stored) return [];

            const { version, data } = JSON.parse(stored);

            if (version !== CONFIG.STORAGE.VERSION) {
                localStorage.removeItem(CONFIG.STORAGE.PLAYERS_KEY);
                return [];
            }

            return data.map((player: any) => ({
                ...player,
                descriptor: player.descriptor ? new Float32Array(player.descriptor) : undefined
            }));
        } catch (error) {
            console.error('Failed to load player data:', error);
            return [];
        }
    }

    public clearStorage(): void {
        localStorage.removeItem(CONFIG.STORAGE.PLAYERS_KEY);
    }

    public async initializeDummyData(): Promise<void> {
        const dummyPlayers: KBOPlayer[] = [
            {
                id: '1',
                name: '이정후',
                team: '키움 히어로즈',
                imageUrl: '/players/lee-jung-hoo.jpg',
                descriptor: new Float32Array(128).fill(0.5)
            },
            {
                id: '2',
                name: '양현종',
                team: 'KIA 타이거즈',
                imageUrl: '/players/yang-hyun-jong.jpg',
                descriptor: new Float32Array(128).fill(0.3)
            },
        ];

        await this.savePlayerData(dummyPlayers);
    }
}