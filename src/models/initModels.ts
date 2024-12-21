// src/app/lookalike/models/initModels.ts
import * as tf from '@tensorflow/tfjs';
import * as faceapi from 'face-api.js';

let isInitialized = false;

export async function initializeModels() {
    if (isInitialized) {
        console.log('Models already initialized');
        return true;
    }

    try {
        console.log('Starting model initialization...');

        // 1. TensorFlow.js setup
        console.log('Configuring TensorFlow.js...');
        if (tf.env().get('IS_BROWSER')) {
            console.log('Setting WebGL parameters...');
            tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
            tf.env().set('WEBGL_FLUSH_THRESHOLD', 0);
            tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
            tf.env().set('WEBGL_VERSION', 2);
        }

        // 2. TensorFlow Backend
        console.log('Setting up TensorFlow backend...');
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TensorFlow.js initialized with backend:', tf.getBackend());
        console.log('WebGL version:', tf.env().get('WEBGL_VERSION'));

        // 3. Load face-api.js models
        console.log('Loading face-api.js models...');
        const MODEL_URL = '/models';

        try {
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.load(`${MODEL_URL}/ssd_mobilenetv1_model-weights_manifest.json`).then(() => {
                    console.log('SSD MobileNet model loaded');
                }),
                faceapi.nets.faceLandmark68Net.load(`${MODEL_URL}/face_landmark_68_model-weights_manifest.json`).then(() => {
                    console.log('Face Landmark model loaded');
                }),
                faceapi.nets.faceRecognitionNet.load(`${MODEL_URL}/face_recognition_model-weights_manifest.json`).then(() => {
                    console.log('Face Recognition model loaded');
                })
            ]);
        } catch (modelError) {
            console.error('Error loading specific model:', modelError);
            throw modelError;
        }

        // 4. Verify models are loaded
        console.log('Verifying model loads...');
        console.log('SSD MobileNet loaded:', faceapi.nets.ssdMobilenetv1.isLoaded);
        console.log('Face Landmark loaded:', faceapi.nets.faceLandmark68Net.isLoaded);
        console.log('Face Recognition loaded:', faceapi.nets.faceRecognitionNet.isLoaded);

        // 5. Warmup run
        console.log('Performing warmup inference...');
        const dummyTensor = tf.zeros([1, 224, 224, 3]);
        try {
            await faceapi.detectSingleFace(dummyTensor as any);
            console.log('Warmup inference completed');
        } catch (warmupError) {
            console.error('Warmup inference failed:', warmupError);
        } finally {
            dummyTensor.dispose();
        }

        isInitialized = true;
        console.log('Model initialization completed successfully');
        return true;
    } catch (error) {
        console.error('Model initialization failed:', error);
        return false;
    }
}