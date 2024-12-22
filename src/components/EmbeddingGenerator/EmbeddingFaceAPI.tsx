// components/EmbeddingGenerator.tsx
import * as faceapi from 'face-api.js';
import { useEffect, useState, useRef } from 'react';
import { ModelLoadingStatus, KBOPlayer, ModelStatus, FaceDetectionResult } from '../../types/types';

const FaceAPIEmbeddingGenerator = () => {
    const [modelStatus, setModelStatus] = useState<ModelLoadingStatus>('idle');
    const [status, setStatus] = useState<string>('');
    const [players, setPlayers] = useState<KBOPlayer[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [modelLoadStatus, setModelLoadStatus] = useState<ModelStatus>({
        faceDetection: false,
        faceLandmark: false,
        faceRecognition: false
    });

    const loadImagesFromPublic = async () => {
        try {
            console.log('이미지 목록 가져오기 시작...');
            setStatus('이미지 목록 가져오는 중...');

            // Vite의 import.meta.glob을 사용하여 이미지 파일 목록을 가져옵니다
            const imageModules = import.meta.glob('/public/images/*.{jpg,jpeg}', {
                eager: true,
                as: 'url'
            });

            console.log('찾은 이미지 모듈:', imageModules);

            // 파일 경로에서 파일 이름만 추출
            const imageFiles = Object.keys(imageModules).map(path => {
                // '/public/images/파일명.jpg' 형식에서 파일명만 추출
                return path.split('/').pop() || '';
            });

            console.log('처리된 이미지 파일 목록:', imageFiles);

            if (imageFiles.length === 0) {
                setStatus('이미지 파일을 찾을 수 없습니다. /public/images 디렉토리에 .jpg 또는 .jpeg 파일이 있는지 확인해주세요.');
                setIsLoading(false);
                return;
            }

            // 각 이미지에 대한 플레이어 객체 생성
            const initialPlayers: KBOPlayer[] = imageFiles
                .filter(fileName => fileName) // 빈 파일명 제거
                .map(fileName => ({
                    id: Math.random().toString(36).substr(2, 9),
                    imageUrl: `/images/${fileName}`,
                    name: formatPlayerName(fileName),
                    team: ''
                }));

            console.log('생성된 플레이어 객체:', initialPlayers);

            setPlayers(initialPlayers);
            setStatus(`${initialPlayers.length}명의 선수 이미지를 불러왔습니다. 정보를 입력해주세요.`);
        } catch (error) {
            console.error('이미지 목록 로드 에러:', error);
            setStatus('이미지 목록 로드 실패: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const formatPlayerName = (fileName: string): string => {
        // 파일 확장자 제거
        const nameWithoutExt = fileName.replace(/\.(jpeg|jpg)$/i, '');
        // 하이픈을 공백으로 변환
        return nameWithoutExt.replace(/-/g, ' ');
    };

    const loadModels = async () => {
        try {
            setModelStatus('loading');
            setStatus('모델 로딩 중...');

            // Load models sequentially and update status
            await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
            setModelLoadStatus(prev => ({ ...prev, faceDetection: true }));

            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            setModelLoadStatus(prev => ({ ...prev, faceLandmark: true }));

            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            setModelLoadStatus(prev => ({ ...prev, faceRecognition: true }));

            setModelStatus('loaded');
            setStatus('모델 로딩 완료! 팀 정보를 입력해주세요.');
        } catch (error) {
            setModelStatus('error');
            setStatus('모델 로딩 실패: ' + (error as Error).message);
        }
    };

    useEffect(() => {
        const initializeApp = async () => {
            await loadModels();
            await loadImagesFromPublic();
        };

        initializeApp();
    }, []);

    const handlePlayerInfoUpdate = (index: number, field: keyof KBOPlayer, value: string) => {
        const updatedPlayers = [...players];
        updatedPlayers[index] = {
            ...updatedPlayers[index],
            [field]: value
        };
        setPlayers(updatedPlayers);
    };

    const visualizeFaceDetection = async (
        canvas: HTMLCanvasElement,
        img: HTMLImageElement,
        detection: faceapi.FaceDetection,
        landmarks: faceapi.FaceLandmarks68
    ) => {
        // 캔버스 크기를 이미지에 맞게 조정
        const displaySize = { width: img.width, height: img.height };
        faceapi.matchDimensions(canvas, displaySize);

        // 캔버스 초기화
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        // 이미지 그리기
        ctx?.drawImage(img, 0, 0);

        // 감지된 얼굴 박스 그리기
        const detectionDrawBox = new faceapi.draw.DrawBox(detection.box, {
            label: 'Face',
            boxColor: '#00ff00'
        });
        detectionDrawBox.draw(canvas);

        // 랜드마크 그리기
        faceapi.draw.drawFaceLandmarks(canvas, landmarks);
    };

    const detectFace = async (img: HTMLImageElement): Promise<FaceDetectionResult | null> => {
        const detection = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) return null;

        // 캔버스가 있다면 시각화
        if (canvasRef.current) {
            await visualizeFaceDetection(
                canvasRef.current,
                img,
                detection.detection,
                detection.landmarks
            );
        }

        return {
            detection: detection.detection,
            landmarks: detection.landmarks,
            descriptor: detection.descriptor
        };
    };

    const [processedPlayers, setProcessedPlayers] = useState<KBOPlayer[]>([]);
    // @ts-expect-error
    const [processingComplete, setProcessingComplete] = useState<boolean>(false);
    // @ts-expect-error
    const [processedCount, setProcessedCount] = useState<number>(0);

    const processNextPlayer = async () => {
        if (modelStatus !== 'loaded') {
            setStatus('모델이 아직 로드되지 않았습니다.');
            return;
        }

        const incompletePlayer = players.find(p => !p.name || !p.team);
        if (incompletePlayer) {
            setStatus('모든 선수의 이름과 팀 정보를 입력해주세요.');
            return;
        }

        if (currentProcessingIndex >= players.length - 1) {
            setProcessingComplete(true);
            setStatus('모든 선수 처리가 완료되었습니다. 임베딩을 저장해주세요.');
            return;
        }

        const nextIndex = currentProcessingIndex + 1;
        setCurrentProcessingIndex(nextIndex);
        const player = players[nextIndex];

        try {
            setStatus(`${player.name} 처리 중...`);

            // 이미지 로드
            const img = await faceapi.fetchImage(player.imageUrl);

            // 이미지 참조 업데이트
            if (imageRef.current) {
                imageRef.current.src = player.imageUrl;
            }

            // 얼굴 감지 및 디스크립터 추출
            const faceData = await detectFace(img);

            if (!faceData) {
                setStatus(`${player.name}의 얼굴을 찾을 수 없습니다. 다음 선수로 넘어가려면 '다음' 버튼을 클릭하세요.`);
                return;
            }

            const descriptorArray = Array.from(faceData.descriptor);
            const fileName = player.imageUrl.split('/').pop() || '';

            const newPlayer = {
                id: player.id,
                name: player.name,
                team: player.team,
                imageUrl: `/images/${fileName}`,
                descriptor: new Float32Array(descriptorArray)
            };

            setProcessedPlayers(prev => [...prev, newPlayer]);
            setProcessedCount(prev => prev + 1);
            setStatus(`${player.name} 처리 완료. 다음 선수로 넘어가려면 '다음' 버튼을 클릭하세요.`);
        } catch (error) {
            console.error(`Error processing ${player.name}:`, error);
            setStatus(`${player.name} 처리 중 오류 발생: ${(error as Error).message}. 다음 선수로 넘어가려면 '다음' 버튼을 클릭하세요.`);
        }
    };

    const generateEmbeddings = async () => {
        if (modelStatus !== 'loaded') {
            setStatus('모델이 아직 로드되지 않았습니다.');
            return;
        }

        const incompletePlayer = players.find(p => !p.name || !p.team);
        if (incompletePlayer) {
            setStatus('모든 선수의 이름과 팀 정보를 입력해주세요.');
            return;
        }

        setStatus('임베딩 생성 시작...');
        setCurrentProcessingIndex(-1);
        setProcessedPlayers([]);
        setProcessedCount(0);
        setProcessingComplete(false);
        await processNextPlayer();
        let totalProcessed = 0;

        try {
            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                setCurrentProcessingIndex(i);

                try {
                    // 이미지 로드
                    const img = await faceapi.fetchImage(player.imageUrl);

                    // 이미지 참조 업데이트
                    if (imageRef.current) {
                        imageRef.current.src = player.imageUrl;
                    }

                    // 얼굴 감지 및 디스크립터 추출
                    const faceData = await detectFace(img);

                    if (!faceData) {
                        setStatus(`${player.name}의 얼굴을 찾을 수 없습니다.`);
                        continue;
                    }

                    const descriptorArray = Array.from(faceData.descriptor);

                    const fileName = player.imageUrl.split('/').pop() || '';
                    processedPlayers.push({
                        id: player.id,
                        name: player.name,
                        team: player.team,
                        imageUrl: `/images/${fileName}`,
                        descriptor: new Float32Array(descriptorArray)
                    });

                    totalProcessed++;
                    setStatus(`${totalProcessed}/${players.length} - ${player.name} 처리 완료`);
                } catch (error) {
                    console.error(`Error processing ${player.name}:`, error);
                    setStatus(`${player.name} 처리 중 오류 발생: ${(error as Error).message}`);
                }
            }

            const outputData = processedPlayers.map(player => ({
                ...player,
                descriptor: Array.from(player.descriptor as Float32Array)
            }));

            // Create and download JSON file
            const jsonContent = JSON.stringify(outputData, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'player-embeddings.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setStatus(`임베딩 생성 완료! (${totalProcessed}/${players.length}명) JSON 파일이 다운로드됩니다.`);
        } catch (error) {
            setStatus('임베딩 생성 실패: ' + (error as Error).message);
        } finally {
            setCurrentProcessingIndex(-1);
        }
    };

    if (isLoading) {
        return <div className="container mx-auto p-4">이미지 로딩 중...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">KBO 선수 임베딩 생성기</h1>

            <div className="mb-4 p-2 border rounded">
                <div>Status:</div>
                <div className="text-sm">
                    <div>Face Detection: {modelLoadStatus.faceDetection ? '✅' : '❌'}</div>
                    <div>Face Landmark: {modelLoadStatus.faceLandmark ? '✅' : '❌'}</div>
                    <div>Face Recognition: {modelLoadStatus.faceRecognition ? '✅' : '❌'}</div>
                </div>
                <div className="mt-2">{status}</div>
            </div>

            {/* 현재 처리 중인 이미지 시각화 영역 */}
            {currentProcessingIndex >= 0 && (
                <div className="mb-6 p-4 border rounded bg-gray-50">
                    <h2 className="text-lg font-semibold mb-2">
                        현재 처리 중: {players[currentProcessingIndex]?.name}
                    </h2>
                    <div className="relative">
                        <img
                            ref={imageRef}
                            src={players[currentProcessingIndex]?.imageUrl}
                            alt="Processing"
                            className="max-w-full h-auto"
                            style={{ display: 'none' }}
                        />
                        <canvas
                            ref={canvasRef}
                            className="max-w-full h-auto"
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {players.map((player, index) => (
                    <div key={player.id} className="border p-4 rounded">
                        <img
                            src={player.imageUrl}
                            alt={`${player.name || '선수'} 이미지`}
                            className="w-full h-48 object-cover rounded mb-2"
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
                            <div className="text-sm text-gray-500">
                                파일명: {player.imageUrl.split('/').pop()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-4 right-4">
                <button
                    onClick={generateEmbeddings}
                    disabled={modelStatus !== 'loaded' || players.length === 0}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:hover:bg-gray-300"
                >
                    임베딩 생성하기 ({players.length}명)
                </button>
            </div>
        </div>
    );
};

export default FaceAPIEmbeddingGenerator;