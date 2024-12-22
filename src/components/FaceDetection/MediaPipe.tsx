import React, { useEffect, useRef, useState } from 'react';
import { loadMediapipeData } from '../../services/playerData';
import { KBOPlayer, MatchResult } from '../../types/types';
import { ImageUploader } from './ImageUploader';
import { LoadingIndicator } from './LoadingIndicator';
import { ResultDisplay } from './ResultDisplay';
import { calculateSimilarity, cleanupFaceMesh, createImageFromFile, initializeFaceMesh, processImage } from '../../utils/faceUtils';

const FaceDetection: React.FC = () => {
    const [isModelReady, setIsModelReady] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<MatchResult[]>([]);
    const [players, setPlayers] = useState<KBOPlayer[]>([]);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [dataLoadError, setDataLoadError] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 시각화를 위한 refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            console.log('Starting initialization...');
            setStatus('loading');

            try {
                const [modelSuccess, playerData] = await Promise.all([
                    initializeFaceMesh(),
                    loadMediapipeData()
                ]);

                if (!mounted) return;

                if (modelSuccess && playerData) {
                    setPlayers(playerData);
                    setStatus('ready');
                    setIsModelReady(true);
                } else {
                    throw new Error('초기화에 실패했습니다');
                }
            } catch (error) {
                console.error('Initialization error:', error);
                if (mounted) {
                    setStatus('error');
                    setDataLoadError(error instanceof Error ? error.message : '데이터 로드 실패');
                }
            }
        };

        initialize();
        return () => {
            mounted = false;
            cleanupFaceMesh();
        };
    }, []);

    const handleImageProcess = async (file: File) => {
        setIsProcessing(true);
        setResults([]);
        setErrorMessage(null);

        try {
            await cleanupFaceMesh();
            await initializeFaceMesh();

            const imageUrl = URL.createObjectURL(file);
            setCurrentImage(imageUrl);

            const img = await createImageFromFile(file);
            if (!canvasRef.current) {
                throw new Error('Canvas를 초기화할 수 없습니다');
            }

            const detectionResult = await processImage(img, canvasRef.current);

            const matches = players
                .map(player => ({
                    player,
                    similarity: calculateSimilarity(detectionResult.descriptor, player.descriptor!)
                }))
                .filter(match => match.similarity > 40)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 3);

            setResults(matches);
            setStatus('ready');
        } catch (error) {
            console.error('Image processing error:', error);
            setErrorMessage(error instanceof Error ? error.message : '이미지 처리 중 오류가 발생했습니다');
            setStatus('error');
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        return () => {
            cleanupFaceMesh();
        };
    }, []);

    if (dataLoadError) {
        return (
            <div className="text-red-500 text-center">
                선수 데이터를 불러오는데 실패했습니다: {dataLoadError}
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-center mb-4">
                KBO 닮은꼴 찾기
            </h1>
            <div className='text-xs mb-1'>* 아직 SSG 랜더스만 임베딩이 완료되었습니다</div>
            <div className='text-xs mb-6'>* 벡터 유사도 상위 3명을 보여줍니다</div>

            <div>
                {status === 'loading' && (
                    <LoadingIndicator message="모델과 데이터를 로딩중입니다..." status={status} />
                )}

                {status === 'error' && !currentImage && (
                    <div className="text-red-500 text-center">
                        초기화에 실패했습니다. 페이지를 새로고침 해주세요.
                    </div>
                )}

                {errorMessage && (
                    <div className="text-red-500 text-center mb-4">
                        {errorMessage}
                    </div>
                )}

                {status === 'ready' && (
                    <>
                        <ImageUploader
                            isModelReady={isModelReady}
                            onImageSelect={handleImageProcess}
                            isProcessing={isProcessing}
                        />

                        {currentImage && (
                            <div className="mt-6 mb-6">
                                <h3 className="text-lg font-semibold mb-2">얼굴 인식 결과</h3>
                                <div className="relative">
                                    <img
                                        ref={imageRef}
                                        src={currentImage}
                                        alt="Original"
                                        className="hidden"
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="w-full h-auto border rounded"
                                    />
                                </div>
                            </div>
                        )}

                        <ResultDisplay
                            results={results}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default FaceDetection;