// src/app/lookalike/components/ImageUploader.tsx
import {
    Box,
    Button,
    Image,
    Input,
    VStack
} from '@chakra-ui/react';
import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
    isModelReady: boolean;
    isProcessing: boolean;
    onImageSelect: (file: File) => Promise<void>;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
    isModelReady,
    isProcessing,
    onImageSelect,
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // const toast = useToast();

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            // toast({
            //     title: '잘못된 파일 형식',
            //     description: '이미지 파일만 업로드 가능합니다.',
            //     status: 'error',
            //     duration: 3000,
            // });
            console.log('이미지 파일만 업로드 가능합니다.');
            return;
        }

        try {
            // Create preview
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);

            // Process image
            await onImageSelect(file);
        } catch (error) {
            // toast({
            //     title: '이미지 처리 실패',
            //     description: error instanceof Error ? error.message : '이미지 처리 중 오류가 발생했습니다.',
            //     status: 'error',
            //     duration: 3000,
            // });
            console.log('이미지 처리 중 오류가 발생했습니다.');
            console.error('Image processing failed:', error);
        }
    };

    return (
        <VStack gap={4} width="100%">
            <Input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                display="none"
                disabled={!isModelReady || isProcessing}
            />

            <Button
                colorScheme="blue"
                onClick={() => fileInputRef.current?.click()}
                // isDisabled={!isModelReady || isProcessing}
                // isLoading={isProcessing}
            >
                {isProcessing ? '처리중...' : '사진 선택하기'}
            </Button>

            {previewUrl && (
                <Box
                    width="100%"
                    maxW="400px"
                    position="relative"
                    borderRadius="md"
                    overflow="hidden"
                >
                    <Image
                        src={previewUrl}
                        alt="Preview"
                        width="100%"
                        height="auto"
                        objectFit="contain"
                        opacity={isProcessing ? 0.5 : 1}
                        transition="opacity 0.2s"
                    />
                </Box>
            )}
        </VStack>
    );
};