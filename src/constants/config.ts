// src/constants/config.ts
export const CONFIG = {
    MODELS: {
        BASE_URL: '/models',
        FACE_DETECTION: 'face_detection_model',
        FACE_LANDMARK: 'face_landmark_model',
        FACE_RECOGNITION: 'face_recognition_model',
    },
    IMAGE: {
        MAX_SIZE: 640,
        MIN_FACE_SIZE: 100,
        SCORE_THRESHOLD: 0.5,
    },
    STORAGE: {
        DESCRIPTORS_KEY: 'kbo-face-descriptors',
        PLAYERS_KEY: 'kbo-players-data',
        VERSION: '1.0',
    },
    TENSORFLOW: {
        BACKEND: 'webgl',
        MEMORY_CONFIG: {
            weightsBytesLimit: 4194304, // 4MB
            weightsBytesInitial: 2097152, // 2MB
        },
    },
} as const;

export const MODEL_OPTIONS = {
    SSD_MOBILENETV1: {
        minConfidence: 0.5,
        maxResults: 1,
    },
    TINY_FACE_DETECTOR: {
        inputSize: 416,
        scoreThreshold: 0.5,
    },
} as const;