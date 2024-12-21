// src/models/modelLoader.ts
import * as tf from '@tensorflow/tfjs';
import * as faceapi from 'face-api.js';
import { CONFIG } from '../constants/config';

export class ModelLoader {
    private static instance: ModelLoader | null = null;
    private initialized: boolean = false;

    private constructor() { }

    public static getInstance(): ModelLoader {
        if (!this.instance) {
            this.instance = new ModelLoader();
        }
        return this.instance;
    }

    public async loadModels(): Promise<void> {
        if (this.initialized) return;

        try {
            // 1. TensorFlow 초기화
            await tf.ready();

            // 2. WebGL 설정
            const webglBackend = await tf.setBackend('webgl');
            if (webglBackend) {
                tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
                tf.env().set('WEBGL_PACK', true);
                tf.env().set('WEBGL_CHECK_NUMERICAL_PROBLEMS', false);
            }

            // 3. Face-API 모델 로딩
            const modelPath = CONFIG.MODELS.BASE_URL;
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
                faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelPath),
                faceapi.nets.faceRecognitionNet.loadFromUri(modelPath)
            ]);

            // 4. 초기화 완료 설정
            this.initialized = true;
        } catch (error) {
            console.error('Model loading failed:', error);
            throw error;
        }
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public async warmup(): Promise<void> {
        if (!this.initialized) return;

        try {
            // Create a small test tensor and run inference
            const dummyTensor = tf.zeros([1, 224, 224, 3]);
            await faceapi.detectSingleFace(
                dummyTensor as any,
                new faceapi.TinyFaceDetectorOptions()
            );
            dummyTensor.dispose();
        } catch (error) {
            console.error('Model warmup failed:', error);
        }
    }
}