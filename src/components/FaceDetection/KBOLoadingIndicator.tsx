import { FC, useEffect, useState } from 'react';
import { ModelLoadingStatus } from '../../types/types';

interface LoadingIndicatorProps {
    status: ModelLoadingStatus;
}

const KBOLoadingIndicator: FC<LoadingIndicatorProps> = ({ status }) => {
    const [messageIndex, setMessageIndex] = useState(0);

    const loadingMessages = [
        "얼굴 인식 모델을 다운받는 중...",
        "KBO 선수 명단을 살펴보는 중...",
        "선수들의 사진을 정리하는 중...",
        "AI의 안경을 닦는 중...",
        "선수들의 베스트 각도를 찾는 중...",
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    if (status !== 'loading') return null;

    return (
        <div className="w-full max-w-md mx-auto my-8 text-center">
            {/* <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div> */}
            <div className="min-h-[24px] transition-opacity duration-500">
                <p className="text-gray-600 animate-pulse">
                    {loadingMessages[messageIndex]}
                </p>
            </div>
        </div>
    );
};

export default KBOLoadingIndicator;