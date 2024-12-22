// MultiModelFaceDetection.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { LoadingIndicator } from './LoadingIndicator';
import { ResultDisplay } from './ResultDisplay';
import { KBOPlayer, MatchResult } from '../../types/types';
import { initializeModels, processImageWithMultiModel } from '../../utils/multiModelUtils';
import { loadFaceApiData, loadMediapipeData } from '../../services/playerData';
import { cleanupFaceMesh, initializeFaceMesh } from '../../utils/faceUtils';
import { Box, VStack } from '@chakra-ui/react';

const MultiModelFaceDetection: React.FC = () => {
    const [isModelReady, setIsModelReady] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<MatchResult[]>([]);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [dataLoadError, setDataLoadError] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Separate states for each model's data
    const [mediapipePlayers, setMediapipePlayers] = useState<KBOPlayer[]>([]);
    const [faceApiPlayers, setFaceApiPlayers] = useState<KBOPlayer[]>([]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            console.log('Starting initialization...');
            setStatus('loading');

            try {
                // Load both models and player data
                const [modelSuccess, mediapipeData, faceApiData] = await Promise.all([
                    initializeModels(),
                    loadMediapipeData(),
                    loadFaceApiData()
                ]);

                if (!mounted) return;

                if (modelSuccess && mediapipeData && faceApiData) {
                    console.log('Data loaded:', {
                        mediapipeCount: mediapipeData.length,
                        faceApiCount: faceApiData.length
                    });
                    setMediapipePlayers(mediapipeData);
                    setFaceApiPlayers(faceApiData);
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

    const calculateSimilarity = (
        inputMediapipe: Float32Array,
        inputFaceApi: Float32Array,
        playerIndex: number
    ): number => {
        const mediapipePlayer = mediapipePlayers[playerIndex];
        const faceApiPlayer = faceApiPlayers[playerIndex];

        if (!mediapipePlayer?.descriptor || !faceApiPlayer?.descriptor) {
            return 0;
        }

        // MediaPipe similarity calculation
        const mediapipeSimilarity = (() => {
            let distance = 0;
            const desc2 = new Float32Array(mediapipePlayer.descriptor);

            if (inputMediapipe.length !== desc2.length) {
                console.error('MediaPipe descriptor length mismatch');
                return 0;
            }

            for (let i = 0; i < inputMediapipe.length; i++) {
                const diff = inputMediapipe[i] - desc2[i];
                distance += diff * diff;
            }

            const maxDistance = inputMediapipe.length;
            return Math.max(0, 100 * (1 - Math.sqrt(distance) / Math.sqrt(maxDistance)));
        })();

        // Face-API similarity calculation
        const faceApiSimilarity = (() => {
            const desc2 = new Float32Array(faceApiPlayer.descriptor);

            if (inputFaceApi.length !== desc2.length) {
                console.error('Face-API descriptor length mismatch');
                return 0;
            }

            let dotProduct = 0;
            let norm1 = 0;
            let norm2 = 0;

            for (let i = 0; i < inputFaceApi.length; i++) {
                dotProduct += inputFaceApi[i] * desc2[i];
                norm1 += inputFaceApi[i] * inputFaceApi[i];
                norm2 += desc2[i] * desc2[i];
            }

            const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
            if (denominator === 0) {
                return 0;
            }

            const similarity = dotProduct / denominator;
            return Math.round(((similarity + 1) / 2) * 100);
        })();

        // Combine similarities with 50:50 ratio
        console.log('Similarities:', mediapipeSimilarity, faceApiSimilarity);
        return Math.round(mediapipeSimilarity * 0.5 + faceApiSimilarity * 0.5);
    };

    const handleImageProcess = async (file: File) => {
        setIsProcessing(true);
        setResults([]);
        setErrorMessage(null);

        try {
            await cleanupFaceMesh();
            await initializeFaceMesh();

            const imageUrl = URL.createObjectURL(file);
            setCurrentImage(imageUrl);

            // Create image element
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
            });

            if (!canvasRef.current) {
                throw new Error('Canvas를 초기화할 수 없습니다');
            }

            // Process image with both models
            const { mediapipeDescriptor, faceApiDescriptor } = await processImageWithMultiModel(img, canvasRef.current);

            // Calculate similarities and create matches
            const matches = mediapipePlayers
                .map((player, index) => ({
                    player,
                    similarity: calculateSimilarity(mediapipeDescriptor, faceApiDescriptor, index)
                }))
                .filter(match => match.similarity > 40)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 3);

            console.log('Matches found:', matches);
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
            <div className='text-xs mb-6'>* MediaPipe와 Face-API.js의 결과를 조합하여 분석합니다</div>

            <div>
                {status === 'loading' && (
                    <LoadingIndicator message="모델과 데이터를 로딩중입니다..." status={status} />
                )}

                {status === 'error' && !currentImage && (
                    <>
                        <div className="text-red-500 text-center">
                            초기화에 실패했습니다.
                        </div>
                        <div className="text-center mb-4 text-xs">
                            페이지를 새로고침 해주세요.
                        </div>
                    </>
                )}

                {errorMessage && (
                    <>
                        <div className="text-red-500 text-center ">
                            문제가 발생했습니다.
                            {/* {errorMessage} */}
                        </div>
                        <div className="text-center mb-4 text-xs">
                            페이지를 새로고침 해주세요.
                        </div>
                    </>
                )}

                {status === 'ready' && !errorMessage && (
                    <>
                        <ImageUploader
                            isModelReady={isModelReady}
                            onImageSelect={handleImageProcess}
                            isProcessing={isProcessing}
                        />

                        {currentImage && (
                            <VStack gap={4} width="100%">
                                <Box
                                    width="100%"
                                    maxW="400px"
                                    borderRadius="md"
                                    overflow="hidden"
                                    className="mt-6 mb-6"
                                >
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
                                </Box>
                            </VStack>
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

export default MultiModelFaceDetection;