// multiModelUtils.ts
import * as faceapi from 'face-api.js';
import {
    FaceMesh, FACEMESH_TESSELATION, FACEMESH_RIGHT_EYE, FACEMESH_RIGHT_EYEBROW,
    FACEMESH_LEFT_EYE, FACEMESH_LEFT_EYEBROW, FACEMESH_FACE_OVAL, FACEMESH_LIPS
} from '@mediapipe/face_mesh';
import { drawConnectors } from '@mediapipe/drawing_utils';

// Constants for weighting the two methods
const MEDIAPIPE_METHOD_RATE = 0.5;
const FACE_API_METHOD_RATE = 0.5;

// Types
interface FaceMeshInstance extends FaceMesh {
    initialize(): Promise<void>;
    setOptions(options: Record<string, any>): Promise<void>;
}

export interface MultiModelDetectionResult {
    mediapipeDescriptor: Float32Array;
    faceApiDescriptor: Float32Array;
}

// MediaPipe initialization
let faceMesh: FaceMeshInstance | null = null;
let isMediapipeInitialized = false;

const MEDIAPIPE_VERSION = '0.4.1633559619';
const BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${MEDIAPIPE_VERSION}/`;

export async function initializeModels(): Promise<boolean> {
    try {
        // Initialize MediaPipe
        if (!isMediapipeInitialized) {
            faceMesh = new FaceMesh({
                locateFile: (file: string) => `${BASE_URL}${file}`
            }) as FaceMeshInstance;

            await faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7,
                enableFaceGeometry: false
            });

            await faceMesh.initialize();
            isMediapipeInitialized = true;
        }

        // Initialize Face-API.js
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);

        return true;
    } catch (error) {
        console.error('Model initialization error:', error);
        return false;
    }
}

export async function processImageWithMultiModel(
    img: HTMLImageElement,
    canvas: HTMLCanvasElement
): Promise<MultiModelDetectionResult> {
    if (!faceMesh) {
        throw new Error('Models not initialized');
    }

    // MediaPipe processing
    const mediapipeResult = await new Promise<Float32Array>((resolve, reject) => {
        const currentFaceMesh = faceMesh;
        if (!currentFaceMesh) {
            throw new Error('Models not initialized');
        }
        const onResults = (results: any) => {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
                reject(new Error('얼굴을 찾을 수 없습니다'));
                return;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const landmarks = results.multiFaceLandmarks[0];
            drawConnectors(ctx, landmarks, FACEMESH_TESSELATION, {
                color: '#C0C0C070',
                lineWidth: 1
            });
            drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYE, { color: '#FF3030' });
            drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYEBROW, { color: '#FF3030' });
            drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYE, { color: '#30FF30' });
            drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYEBROW, { color: '#30FF30' });
            drawConnectors(ctx, landmarks, FACEMESH_FACE_OVAL, { color: '#E0E0E0' });
            drawConnectors(ctx, landmarks, FACEMESH_LIPS, { color: '#E0E0E0' });

            const descriptor = new Float32Array(landmarks.length * 3);
            landmarks.forEach((landmark: any, i: number) => {
                descriptor[i * 3] = landmark.x;
                descriptor[i * 3 + 1] = landmark.y;
                descriptor[i * 3 + 2] = landmark.z;
            });

            resolve(descriptor);
        };

        currentFaceMesh.onResults(onResults);
        currentFaceMesh.send({ image: img });
    });

    // Face-API.js processing
    const faceApiResult = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!faceApiResult) {
        throw new Error('Face-API.js could not detect a face');
    }

    return {
        mediapipeDescriptor: mediapipeResult,
        faceApiDescriptor: faceApiResult.descriptor
    };
}

export function calculateCombinedSimilarity(
    mediapipeDesc1: Float32Array,
    faceApiDesc1: Float32Array,
    mediapipeDesc2: Float32Array,
    faceApiDesc2: Float32Array
): number {
    // Calculate MediaPipe similarity
    const mediapipeSimilarity = calculateMediapipeSimilarity(mediapipeDesc1, mediapipeDesc2);

    // Calculate Face-API.js similarity
    const faceApiSimilarity = calculateFaceApiSimilarity(faceApiDesc1, faceApiDesc2);

    // Combine the two similarities using their respective weights
    return Math.round(
        (mediapipeSimilarity * MEDIAPIPE_METHOD_RATE) +
        (faceApiSimilarity * FACE_API_METHOD_RATE)
    );
}

// MediaPipe similarity calculation (using Euclidean distance-based similarity)
function calculateMediapipeSimilarity(desc1: Float32Array, desc2: Float32Array): number {
    let distance = 0;

    for (let i = 0; i < desc1.length; i++) {
        const diff = desc1[i] - desc2[i];
        distance += diff * diff;
    }

    const maxDistance = desc1.length * Math.pow(Math.max(...desc1, ...desc2), 2);
    const normalizedDistance = Math.sqrt(distance) / Math.sqrt(maxDistance);

    // 비선형 스케일링으로 더 큰 차이를 강조
    const similarity = 1 - Math.pow(normalizedDistance, 0.5); // 0.5로 비선형 스케일링
    return Math.max(0, similarity * 100);
}



// Face-API.js similarity calculation (using cosine similarity)
function calculateFaceApiSimilarity(desc1: Float32Array, desc2: Float32Array): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < desc1.length; i++) {
        dotProduct += desc1[i] * desc2[i];
        norm1 += desc1[i] * desc1[i];
        norm2 += desc2[i] * desc2[i];
    }

    const normalizedDotProduct = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    const cosSim = Math.max(-1, Math.min(1, normalizedDotProduct));

    // 비선형 변환으로 유사도 범위를 더 넓힘
    const similarity = Math.pow((cosSim + 1) / 2, 3); // 제곱 또는 세제곱으로 조정
    return Math.round(similarity * 100);
}



export async function createImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('이미지 로드에 실패했습니다'));
        };
        img.src = URL.createObjectURL(file);
    });
}