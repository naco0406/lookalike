// src/services/faceApi.ts
import * as faceapi from 'face-api.js';
import { FaceDetectionResult, ProcessedImage } from '../types';
import { CONFIG } from '../constants/config';

export class FaceApiService {
    private static instance: FaceApiService | null = null;

    private constructor() { }

    public static getInstance(): FaceApiService {
        if (!this.instance) {
            this.instance = new FaceApiService();
        }
        return this.instance;
    }

    public async detectFace(image: ProcessedImage): Promise<FaceDetectionResult | null> {
        try {
            const options = new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,
                scoreThreshold: 0.5
            });

            const detection = await faceapi.detectSingleFace(
                image.element,
                options
            ).withFaceLandmarks(true).withFaceDescriptor();

            if (!detection) return null;

            return {
                detection: detection.detection,
                landmarks: detection.landmarks,
                descriptor: detection.descriptor
            };
        } catch (error) {
            console.error('Face detection failed:', error);
            throw error;
        }
    }

    public computeSimilarity(descriptor1: Float32Array, descriptor2: Float32Array): number {
        return 1 - faceapi.euclideanDistance(descriptor1, descriptor2);
    }
}