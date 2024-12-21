// src/types/index.ts
import * as faceapi from 'face-api.js';

export interface FaceDetectionResult {
    detection: faceapi.FaceDetection;
    landmarks: faceapi.FaceLandmarks68;
    descriptor: Float32Array;
}

export interface ProcessedImage {
    element: HTMLImageElement;
    tensor: any; // tf.Tensor3D
    url: string;
}

export interface KBOPlayer {
    id: string;
    name: string;
    team: string;
    imageUrl: string;
    descriptor?: Float32Array;
}

export interface MatchResult {
    player: KBOPlayer;
    similarity: number;
}

export interface ModelStatus {
    faceDetection: boolean;
    faceLandmark: boolean;
    faceRecognition: boolean;
}

export type ModelLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface KBOPlayer {
  id: string;
  name: string;
  team: string;
  imageUrl: string;
  descriptor?: Float32Array;
}

export interface MatchResult {
  player: KBOPlayer;
  similarity: number;
}

export interface ProcessedImage {
  element: HTMLImageElement;
  data: ImageData;
  width: number;
  height: number;
  cleanup?: () => void;
}

// Interface for the FaceApiService
export interface IFaceApiService {
  detectFace(image: ProcessedImage): Promise<FaceDetectionResult | null>;
  computeSimilarity(descriptor1: Float32Array, descriptor2: Float32Array): number;
}

// Interface for the ImageProcessor
export interface IImageProcessor {
  processImage(file: File): Promise<ProcessedImage>;
  cleanup(image: ProcessedImage): void;
}
