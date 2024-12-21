// scripts/prepare-dataset.ts
import { generateEmbeddings } from '../src/utils/embeddings-generator';
import { initializeModels } from '../src/models/initModels';
import fs from 'fs/promises';
import path from 'path';

const players = [
    {
        id: '1',
        name: '이정후',
        team: '키움 히어로즈',
        imageUrl: '/images/players/lee-jung-hoo.jpg'
    },
    // ... 더 많은 선수 데이터
];

async function prepareDataset() {
    try {
        // 모델 초기화
        await initializeModels();

        // 임베딩 생성
        const processedPlayers = await generateEmbeddings(players);

        // 결과 저장
        await fs.writeFile(
            path.join(__dirname, '../public/data/player-embeddings.json'),
            JSON.stringify(processedPlayers, null, 2)
        );

        console.log(`Successfully processed ${processedPlayers.length} players`);
    } catch (error) {
        console.error('Failed to prepare dataset:', error);
    }
}

prepareDataset();