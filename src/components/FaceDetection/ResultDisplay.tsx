// src/components/FaceDetection/ResultDisplay.tsx
import {
    Box,
    Grid,
    Heading,
    Image,
    Text,
    VStack,
} from '@chakra-ui/react';
import { MatchResult } from '../../types/types';

interface ResultDisplayProps {
    results: MatchResult[];
}

export const ResultDisplay = ({ results }: ResultDisplayProps) => {
    const borderColor = 'gray.200';
    const overlayBg = "rgba(0, 0, 0, 0.6)"; // 반투명한 검은색 배경

    if (!results.length) return null;

    return (
        <VStack gap={6} width="100%" mt={8}>
            <Heading size="md">닮은 선수 찾기 결과</Heading>

            <Grid
                templateColumns={['1fr', '1fr', 'repeat(3, 1fr)']}
                gap={6}
                width="100%"
            >
                {results.map((result, index) => (
                    <Box
                        key={result.player.id}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="lg"
                        overflow="hidden"
                        position="relative"
                        aspectRatio="1"
                    >
                        <Image
                            src={result.player.imageUrl}
                            alt={result.player.name}
                            width="100%"
                            height="100%"
                            objectFit="cover"
                        />

                        {/* Similarity Badge */}
                        {/* <Box
                            position="absolute"
                            top={2}
                            right={2}
                            bg="blackAlpha.700"
                            color="white"
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontSize="sm"
                            fontWeight="bold"
                        >
                            {result.similarity.toFixed(1)}% 일치
                        </Box> */}

                        {/* Text Overlay */}
                        <Box
                            position="absolute"
                            bottom={0}
                            left={0}
                            right={0}
                            bg={overlayBg}
                            p={4}
                        >
                            <Text
                                fontSize="xl"
                                fontWeight="bold"
                                color="white"
                                mb={1}
                            >
                                {index + 1}. {result.player.name}
                            </Text>
                            <Text
                                color="gray.300"
                            >
                                {result.player.team}
                            </Text>
                        </Box>
                    </Box>
                ))}
            </Grid>
        </VStack>
    );
};