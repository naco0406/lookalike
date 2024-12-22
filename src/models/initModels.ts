import * as faceapi from 'face-api.js';

let isInitialized = false;

export async function initializeModels() {
    if (isInitialized) {
        console.log('Models already initialized');
        return true;
    }

    try {
        console.log('Loading face-api.js models...');
        const MODEL_URL = '/models';

        await Promise.all([
            faceapi.nets.ssdMobilenetv1.load(MODEL_URL),
            faceapi.nets.faceLandmark68Net.load(MODEL_URL),
            faceapi.nets.faceRecognitionNet.load(MODEL_URL)
        ]);

        // 모델 로드 확인
        const modelsLoaded =
            faceapi.nets.ssdMobilenetv1.isLoaded &&
            faceapi.nets.faceLandmark68Net.isLoaded &&
            faceapi.nets.faceRecognitionNet.isLoaded;

        if (!modelsLoaded) {
            throw new Error('일부 모델 로드에 실패했습니다');
        }

        isInitialized = true;
        console.log('Model initialization completed successfully');
        return true;
    } catch (error) {
        console.error('Model initialization failed:', error);
        return false;
    }
}