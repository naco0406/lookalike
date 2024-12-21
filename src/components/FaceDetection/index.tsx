// src/app/lookalike/components/FaceDetection.tsx
import React, { useEffect, useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { LoadingIndicator } from './LoadingIndicator';
import { ResultDisplay } from './ResultDisplay';
import { KBOPlayer, MatchResult } from '../../types/types';
import { calculateSimilarity, processImage } from '../../utils/imageUtils';
import { initializeModels } from '../../models/initModels';
import { loadPlayerData } from '../../services/playerData';

const FaceDetection: React.FC = () => {
    const [isModelReady, setIsModelReady] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<MatchResult[]>([]);
    const [players, setPlayers] = useState<KBOPlayer[]>([]);
    const [dataLoadError, setDataLoadError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            console.log('Starting initialization...');
            setStatus('loading');

            try {
                // 모델과 선수 데이터 동시에 로드
                const [modelSuccess, playerData] = await Promise.all([
                    initializeModels(),
                    loadPlayerData()
                ]);

                if (!mounted) return;

                if (modelSuccess && playerData) {
                    console.log('Initialization completed successfully');
                    setPlayers(playerData);
                    setStatus('ready');
                    setIsModelReady(true);
                    console.log(playerData)
                } else {
                    console.error('Initialization failed');
                    setStatus('error');
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
        };
    }, []);

    const handleImageProcess = async (file: File) => {
        console.log('Starting image processing:', file.name);
        setIsProcessing(true);
        setResults([]);

        try {
            console.log('Processing image...');
            const { descriptor } = await processImage(file);

            console.log('Image processed successfully, calculating similarities...');
            const matches = players
                .map(player => {
                    const similarity = player.descriptor ? calculateSimilarity(descriptor, player.descriptor) : 0;
                    console.log(`Similarity with ${player.name}:`, similarity);
                    return {
                        player,
                        similarity: similarity * 100
                    };
                })
                .filter(match => {
                    const passes = match.similarity > 40;
                    console.log(`${match.player.name} passes threshold:`, passes);
                    return passes;
                })
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 3);

            console.log('Final matches:', matches);
            setResults(matches);
        } catch (error) {
            console.error('Image processing error:', error);
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
            <div className='text-xs mb-6'>* 벡터 유사도 상위 3명을 보여줍니다</div>

            <div>
                {status === 'loading' && (
                    <LoadingIndicator message="모델과 데이터를 로딩중입니다..." status={status} />
                )}

                {status === 'error' && (
                    <div className="text-red-500 text-center">
                        초기화에 실패했습니다. 페이지를 새로고침 해주세요.
                    </div>
                )}

                {status === 'ready' && (
                    <>
                        <ImageUploader
                            isModelReady={isModelReady}
                            onImageSelect={handleImageProcess}
                            isProcessing={isProcessing}
                        />
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