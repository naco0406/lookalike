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
    // const cardBg = useColorModeValue('white', 'gray.700');
    // const borderColor = useColorModeValue('gray.200', 'gray.600');
    const cardBg = 'white';
    const borderColor = 'gray.200';

    if (!results.length) return null;

    return (
        <VStack gap={6} width="100%" mt={8}>
            <Heading size="md">닮은 선수 찾기 결과</Heading>

            <Grid
                templateColumns={['1fr', '1fr', 'repeat(2, 1fr)']}
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
                        bg={cardBg}
                        position="relative"
                    >
                        <Box position="relative" paddingTop="100%">
                            <Image
                                src={result.player.imageUrl}
                                alt={result.player.name}
                                position="absolute"
                                top={0}
                                left={0}
                                width="100%"
                                height="100%"
                                objectFit="cover"
                            />

                            {/* Similarity Score Badge */}
                            <Box
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
                            </Box>
                        </Box>

                        <VStack p={4} alignItems="flex-start" gap={1}>
                            <Text fontSize="xl" fontWeight="bold">
                                {index + 1}. {result.player.name}
                            </Text>
                            <Text color="gray.500">
                                {result.player.team}
                            </Text>
                        </VStack>
                    </Box>
                ))}
            </Grid>
        </VStack>
    );
};