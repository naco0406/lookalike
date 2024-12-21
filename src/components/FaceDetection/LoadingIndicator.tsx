// src/components/FaceDetection/LoadingIndicator.tsx
import { Text, VStack } from '@chakra-ui/react';
import { ModelLoadingStatus } from '../../types/types';

interface LoadingIndicatorProps {
    status: ModelLoadingStatus;
    message?: string;
}

export const LoadingIndicator = ({ status, message }: LoadingIndicatorProps) => {
    console.log('status:', status);
    return (
        <VStack gap={4} w="100%">
            {/* <Progress 
        size="xs" 
        width="100%" 
        isIndeterminate={status === 'loading'}
        value={status === 'loaded' ? 100 : 0}
        colorScheme={status === 'error' ? 'red' : 'blue'}
      /> */}
            <Text color={status === 'error' ? 'red.500' : 'gray.600'}>
                {message || getStatusMessage(status)}
            </Text>
        </VStack>
    );
};

const getStatusMessage = (status: ModelLoadingStatus): string => {
    switch (status) {
        case 'loading':
            return '모델을 로딩하고 있습니다...';
        case 'loaded':
            return '모델 로딩이 완료되었습니다.';
        case 'error':
            return '모델 로딩에 실패했습니다.';
        default:
            return '초기화 중...';
    }
};