import * as faceapi from 'face-api.js';
import { KBOPlayer } from '../types/types';

interface RawPlayer {
    id: string;
    name: string;
    team: string;
    imageUrl: string;
}

export async function generateEmbeddings(players: RawPlayer[]): Promise<KBOPlayer[]> {
    const processedPlayers: KBOPlayer[] = [];

    for (const player of players) {
        try {
            console.log(`Processing ${player.name}...`);

            // 이미지 URL을 로컬 경로로 변환
            const localImageUrl = `/images/${player.imageUrl}`;

            // 이미지 로드
            const img = await loadImage(localImageUrl);

            // 얼굴 감지 및 디스크립터 추출
            const detection = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                console.warn(`No face detected for ${player.name}`);
                continue;
            }

            processedPlayers.push({
                ...player,
                imageUrl: localImageUrl, // 저장할 때도 로컬 경로로 저장
                descriptor: detection.descriptor
            });

            console.log(`Successfully processed ${player.name}`);
        } catch (error) {
            console.error(`Error processing ${player.name}:`, error);
        }
    }

    return processedPlayers;
}

async function loadImage(url: string): Promise<HTMLImageElement> {
    const img = new Image();
    return new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
        // 로컬 이미지를 사용하므로 crossOrigin 설정 제거
    });
}