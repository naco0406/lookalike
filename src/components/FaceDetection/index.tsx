// src/app/lookalike/components/FaceDetection.tsx
import React, { useEffect, useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { LoadingIndicator } from './LoadingIndicator';
import { ResultDisplay } from './ResultDisplay';
import { MatchResult } from '../../types/types';
import { calculateSimilarity, processImage } from '../../utils/imageUtils';
import { initializeModels } from '../../models/initModels';

// 임시 데이터 - 실제로는 데이터베이스나 API에서 가져와야 함
const dummyPlayers = [
    {
        id: '1',
        name: '이정후',
        team: '키움 히어로즈',
        imageUrl: '/players/lee-jung-hoo.jpg',
        descriptor: new Float32Array(128).fill(0.5), // 더미 descriptor
    },
    {
        id: '2',
        name: '양현종',
        team: 'KIA 타이거즈',
        imageUrl: '/players/yang-hyun-jong.jpg',
        descriptor: new Float32Array(128).fill(0.3), // 더미 descriptor
    },
];

const FaceDetection: React.FC = () => {
    const [isModelReady, setIsModelReady] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<MatchResult[]>([]);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            console.log('Starting initialization...');
            setStatus('loading');

            try {
                const success = await initializeModels();
                if (mounted) {
                    if (success) {
                        console.log('Initialization completed successfully');
                        setStatus('ready');
                        setIsModelReady(true);
                    } else {
                        console.error('Initialization failed');
                        setStatus('error');
                    }
                }
            } catch (error) {
                console.error('Initialization error:', error);
                if (mounted) {
                    setStatus('error');
                }
            }
        };

        init();
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
            const matches = dummyPlayers
                .map(player => {
                    const similarity = calculateSimilarity(descriptor, player.descriptor);
                    console.log(`Similarity with ${player.name}:`, similarity);
                    return {
                        player,
                        similarity: similarity * 100
                    };
                })
                .filter(match => {
                    const passes = match.similarity > 50;
                    console.log(`${match.player.name} passes threshold:`, passes);
                    return passes;
                })
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 5);

            console.log('Final matches:', matches);
            setResults(matches);
        } catch (error) {
            console.error('Image processing error:', error);
            // Toast나 다른 방식으로 사용자에게 에러 표시
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center mb-8">
                KBO 닮은꼴 찾기
            </h1>

            {status === 'loading' && (
                <LoadingIndicator message="모델을 로딩중입니다..." status={status} />
            )}

            {status === 'error' && (
                <div className="text-red-500 text-center">
                    모델 로딩에 실패했습니다. 페이지를 새로고침 해주세요.
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
    );
};

export default FaceDetection;