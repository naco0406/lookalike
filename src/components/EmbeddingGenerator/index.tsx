import React, { useEffect, useRef, useState } from 'react';
import { initializeFaceMesh, processImage } from '../../utils/faceUtils';
import { KBOPlayer } from '../../types/types';

const EmbeddingGenerator = () => {
    const [status, setStatus] = useState<string>('idle');
    const [players, setPlayers] = useState<KBOPlayer[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);
    const [isFaceMeshReady, setIsFaceMeshReady] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const loadImagesFromPublic = async () => {
        try {
            setStatus('이미지 목록 가져오는 중...');

            const imageModules = import.meta.glob('/public/images/*.{jpg,jpeg}', {
                eager: true,
                as: 'url'
            });

            const imageFiles = Object.keys(imageModules)
                .map(path => {
                    const fileName = path.split('/').pop() || '';
                    return {
                        fileName,
                        url: imageModules[path]
                    };
                })
                .filter(file => file.fileName);

            if (imageFiles.length === 0) {
                throw new Error('이미지 파일을 찾을 수 없습니다.');
            }

            const initialPlayers: KBOPlayer[] = imageFiles.map(({ fileName, url }) => ({
                id: Math.random().toString(36).substr(2, 9),
                imageUrl: url,
                name: fileName.replace(/\.(jpeg|jpg)$/i, '').replace(/-/g, ' '),
                team: 'SSG 랜더스',
                descriptor: new Float32Array()
            }));

            setPlayers(initialPlayers);
            setStatus(`${initialPlayers.length}명의 선수 이미지를 불러왔습니다.`);
        } catch (error) {
            setStatus('이미지 목록 로드 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const initialize = async () => {
            try {
                const success = await initializeFaceMesh();
                if (success) {
                    setIsFaceMeshReady(true);
                    await loadImagesFromPublic();
                } else {
                    throw new Error('FaceMesh 초기화 실패');
                }
            } catch (error) {
                setStatus('초기화 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
                setIsLoading(false);
            }
        };

        initialize();
    }, []);

    const handlePlayerInfoUpdate = (index: number, field: keyof KBOPlayer, value: string) => {
        setPlayers(prev => prev.map((player, i) =>
            i === index ? { ...player, [field]: value } : player
        ));
    };

    const processPlayer = async (player: KBOPlayer, canvas: HTMLCanvasElement): Promise<KBOPlayer> => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        return new Promise((resolve, reject) => {
            img.onload = async () => {
                try {
                    const result = await processImage(img, canvas);
                    resolve({
                        ...player,
                        descriptor: result.descriptor
                    });
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => reject(new Error(`이미지 로드 실패: ${player.imageUrl}`));
            img.src = player.imageUrl;
        });
    };

    const generateEmbeddings = async () => {
        if (!isFaceMeshReady || !canvasRef.current) {
            setStatus('FaceMesh 또는 Canvas가 준비되지 않았습니다.');
            return;
        }

        const incompletePlayer = players.find(p => !p.name || !p.team);
        if (incompletePlayer) {
            setStatus('모든 선수의 이름과 팀 정보를 입력해주세요.');
            return;
        }

        setIsProcessing(true);
        const processedPlayers: KBOPlayer[] = [];
        let failCount = 0;

        try {
            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                setCurrentProcessingIndex(i);
                setStatus(`${player.name} 처리 중... (${i + 1}/${players.length})`);

                try {
                    const processedPlayer = await processPlayer(player, canvasRef.current);
                    processedPlayers.push(processedPlayer);
                    setStatus(`${player.name} 처리 완료 (${i + 1}/${players.length})`);
                } catch (error) {
                    console.error(`${player.name} 처리 실패:`, error);
                    failCount++;
                    continue;
                }
            }

            if (processedPlayers.length === 0) {
                throw new Error('처리에 성공한 선수가 없습니다.');
            }

            // Prepare for JSON
            const playersForJson = processedPlayers.map(player => {
                if (!player.descriptor) {
                    console.error(`${player.name}의 descriptor가 없습니다`);
                    return null;
                }
                return {
                    id: player.id,
                    name: player.name,
                    team: player.team,
                    imageUrl: player.imageUrl,
                    descriptor: Array.from(player.descriptor)
                };
            }).filter((player): player is NonNullable<typeof player> => player !== null);

            // Create and download JSON
            const blob = new Blob([JSON.stringify(playersForJson, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'player-embeddings-mediapipe.json';
            link.click();
            URL.revokeObjectURL(url);

            setStatus(`임베딩 생성 완료! (성공: ${processedPlayers.length}, 실패: ${failCount})`);
        } catch (error) {
            setStatus('임베딩 생성 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
        } finally {
            setIsProcessing(false);
            setCurrentProcessingIndex(-1);
        }
    };

    if (isLoading) {
        return <div className="container mx-auto p-4">초기화 중...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">KBO 선수 임베딩 생성기 (MediaPipe)</h1>

            <div className="mb-4 p-2 border rounded">
                <div>Status: {status}</div>
                <div>FaceMesh: {isFaceMeshReady ? '✅' : '❌'}</div>
            </div>

            <div className="mb-6">
                <canvas
                    ref={canvasRef}
                    width="640"
                    height="480"
                    className="w-full max-w-xl mx-auto border rounded"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {players.map((player, index) => (
                    <div key={player.id} className="border p-4 rounded">
                        <img
                            src={player.imageUrl}
                            alt={player.name || '선수'}
                            className="w-full h-48 object-cover rounded mb-2"
                            crossOrigin="anonymous"
                        />
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="선수 이름"
                                value={player.name}
                                onChange={(e) => handlePlayerInfoUpdate(index, 'name', e.target.value)}
                                className="block w-full p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="소속 팀"
                                value={player.team}
                                onChange={(e) => handlePlayerInfoUpdate(index, 'team', e.target.value)}
                                className="block w-full p-2 border rounded"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-4 right-4">
                <button
                    onClick={generateEmbeddings}
                    disabled={!isFaceMeshReady || players.length === 0 || isProcessing}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-600 disabled:bg-gray-300"
                >
                    {isProcessing ? '처리중...' : `임베딩 생성하기 (${players.length}명)`}
                </button>
            </div>
        </div>
    );
};

export default EmbeddingGenerator;