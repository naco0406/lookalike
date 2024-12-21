// src/services/tensorflowService.ts
import * as tf from '@tensorflow/tfjs';
import { CONFIG } from '../constants/config';

export class TensorflowService {
    private static instance: TensorflowService;
    private initialized: boolean = false;

    private constructor() { }

    static getInstance(): TensorflowService {
        if (!TensorflowService.instance) {
            TensorflowService.instance = new TensorflowService();
        }
        return TensorflowService.instance;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await tf.setBackend(CONFIG.TENSORFLOW.BACKEND);
            await tf.ready();

            // Configure memory
            if (tf.env().get('WEBGL_VERSION') === 2) {
                tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
                tf.env().set('WEBGL_PACK', true);
            }

            this.initialized = true;
        } catch (error) {
            console.error('TensorFlow initialization failed:', error);
            throw error;
        }
    }

    cleanup(): void {
        // Clean up tensors and free memory
        tf.dispose();
        tf.engine().endScope();
    }
}
