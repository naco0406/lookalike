import { FaceMesh, FACEMESH_TESSELATION, FACEMESH_RIGHT_EYE, FACEMESH_RIGHT_EYEBROW, FACEMESH_LEFT_EYE, FACEMESH_LEFT_EYEBROW, FACEMESH_FACE_OVAL, FACEMESH_LIPS } from '@mediapipe/face_mesh';
import { drawConnectors } from '@mediapipe/drawing_utils';


export interface DetectionResult {
    landmarks: any;
    descriptor: Float32Array;
}

interface FaceMeshInstance extends FaceMesh {
    initialize(): Promise<void>;
    setOptions(options: Record<string, any>): Promise<void>;
}

let faceMesh: FaceMeshInstance | null = null;
let isInitialized = false;

const MEDIAPIPE_VERSION = '0.4.1633559619';
const BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${MEDIAPIPE_VERSION}/`;

// WASM 모듈 초기화를 위한 전역 설정
const moduleScript = document.createElement('script');
moduleScript.textContent = `
    let arguments_ = [];
    Object.defineProperty(self, 'Module', {
        configurable: true,
        get: function() {
            return {
                arguments_: arguments_,
                locateFile: function(path) {
                    return "${BASE_URL}" + path;
                }
            };
        },
        set: function(value) {
            arguments_ = value.arguments_ || [];
            Object.defineProperty(self, 'Module', {
                value: value,
                configurable: true,
                writable: true
            });
        }
    });
`;
document.head.insertBefore(moduleScript, document.head.firstChild);

// FaceMesh 초기화 함수
export async function initializeFaceMesh(): Promise<boolean> {
    if (isInitialized && faceMesh) {
        console.log('[FaceMesh] Already initialized');
        return true;
    }

    console.log('[FaceMesh] Starting initialization...');

    try {
        // FaceMesh 인스턴스 생성 전 지연
        await new Promise(resolve => setTimeout(resolve, 500));

        // 인스턴스 생성
        console.log('[FaceMesh] Creating instance...');
        faceMesh = new FaceMesh({
            locateFile: (file: string) => {
                console.log('[FaceMesh] Requesting file:', file);
                return `${BASE_URL}${file}`;
            }
        }) as FaceMeshInstance;

        // 초기화 처리를 위한 Promise
        return new Promise<boolean>((resolve) => {
            if (!faceMesh) {
                console.error('[FaceMesh] Failed to create instance');
                resolve(false);
                return;
            }

            // 옵션 설정과 초기화를 순차적으로 실행
            const initialize = async () => {
                try {
                    console.log('[FaceMesh] Setting options...');
                    if (!faceMesh) {
                        throw new Error('FaceMesh instance is null');
                    }

                    await faceMesh.setOptions({
                        maxNumFaces: 1,
                        refineLandmarks: true,
                        minDetectionConfidence: 0.7,
                        minTrackingConfidence: 0.7,
                        enableFaceGeometry: false
                    });

                    console.log('[FaceMesh] Options set successfully');
                    await faceMesh.initialize();

                    console.log('[FaceMesh] Model initialized successfully');
                    isInitialized = true;
                    resolve(true);
                } catch (error: unknown) {
                    console.error('[FaceMesh] Initialization failed:', error);
                    resolve(false);
                }
            };

            initialize();
        });

    } catch (error: unknown) {
        console.error('[FaceMesh] Fatal initialization error:', error);
        return false;
    }
}

export async function cleanupFaceMesh() {
    if (faceMesh) {
        try {
            faceMesh.close();
            faceMesh = null;
            isInitialized = false;
            console.log('[FaceMesh] Cleanup successful');
        } catch (error) {
            console.error('[FaceMesh] Cleanup error:', error);
        }
    }
}

export async function processImage(
    img: HTMLImageElement,
    canvas: HTMLCanvasElement
): Promise<DetectionResult> {
    console.log('[FaceMesh] Starting image processing...');

    if (!faceMesh) {
        console.error('[FaceMesh] FaceMesh not initialized');
        throw new Error('FaceMesh가 초기화되지 않았습니다');
    }

    return new Promise((resolve, reject) => {
        let processed = false;

        const onResults = (results: any) => {
            console.log('[FaceMesh] Processing results:', results);

            if (processed) {
                console.log('[FaceMesh] Skipping duplicate processing');
                return;
            }
            processed = true;

            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
                console.error('[FaceMesh] No face landmarks detected');
                reject(new Error('얼굴을 찾을 수 없습니다'));
                return;
            }

            try {
                console.log('[FaceMesh] Drawing results on canvas...');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('[FaceMesh] Canvas context not available');
                    reject(new Error('Canvas context not available'));
                    return;
                }

                // 캔버스 설정
                canvas.width = img.width;
                canvas.height = img.height;
                console.log('[FaceMesh] Canvas dimensions set to:', { width: img.width, height: img.height });

                // 이미지 그리기
                ctx.drawImage(img, 0, 0);
                console.log('[FaceMesh] Base image drawn');

                // 랜드마크 그리기
                const landmarks = results.multiFaceLandmarks[0];
                console.log('[FaceMesh] Drawing landmarks...');

                drawConnectors(ctx, landmarks, FACEMESH_TESSELATION, {
                    color: '#C0C0C070',
                    lineWidth: 1
                });
                drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYE, {
                    color: '#FF3030'
                });
                drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYEBROW, {
                    color: '#FF3030'
                });
                drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYE, {
                    color: '#30FF30'
                });
                drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYEBROW, {
                    color: '#30FF30'
                });
                drawConnectors(ctx, landmarks, FACEMESH_FACE_OVAL, {
                    color: '#E0E0E0'
                });
                drawConnectors(ctx, landmarks, FACEMESH_LIPS, {
                    color: '#E0E0E0'
                });
                console.log('[FaceMesh] All landmarks drawn');

                // 디스크립터 생성
                console.log('[FaceMesh] Creating descriptor...');
                const descriptor = new Float32Array(landmarks.length * 3);
                landmarks.forEach((landmark: any, i: number) => {
                    descriptor[i * 3] = landmark.x;
                    descriptor[i * 3 + 1] = landmark.y;
                    descriptor[i * 3 + 2] = landmark.z;
                });
                console.log('[FaceMesh] Descriptor created with length:', descriptor.length);

                resolve({
                    landmarks,
                    descriptor
                });
            } catch (error) {
                console.error('[FaceMesh] Error in results processing:', error);
                reject(error);
            }
        };

        console.log('[FaceMesh] Setting up results callback...');
        faceMesh!.onResults(onResults);

        console.log('[FaceMesh] Sending image for processing...');
        try {
            faceMesh!.send({ image: img });
        } catch (error) {
            console.error('[FaceMesh] Error sending image:', error);
            reject(error);
        }
    });
}

// export function calculateSimilarity(desc1: Float32Array, desc2: Float32Array): number {
//     console.log('[FaceMesh] Calculating similarity between descriptors...');
//     console.log('[FaceMesh] Descriptor lengths:', desc1.length, desc2.length);

//     let dotProduct = 0;
//     let norm1 = 0;
//     let norm2 = 0;

//     for (let i = 0; i < desc1.length; i++) {
//         dotProduct += desc1[i] * desc2[i];
//         norm1 += desc1[i] * desc1[i];
//         norm2 += desc2[i] * desc2[i];
//     }

//     const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
//     const result = Math.round(((similarity + 1) / 2) * 100);

//     console.log('[FaceMesh] Similarity calculation completed:', result);
//     return result;
// }
export function calculateSimilarity(desc1: Float32Array, desc2: Float32Array): number {
    // 길이 체크 추가
    if (desc1.length !== desc2.length) {
        console.error('Descriptor lengths do not match:', desc1.length, desc2.length);
        return 0;
    }

    let distance = 0;
    for (let i = 0; i < desc1.length; i++) {
        const diff = desc1[i] - desc2[i];
        distance += diff * diff;
    }
    
    // 유클리드 거리를 유사도로 변환
    // distance가 작을수록 유사도가 높음
    const maxDistance = desc1.length; // 최대 가능한 거리
    const similarity = Math.max(0, 100 * (1 - Math.sqrt(distance) / Math.sqrt(maxDistance)));
    
    return Math.round(similarity);
}

export async function createImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve(img);
      };
      img.onerror = (error) => {
        URL.revokeObjectURL(img.src);
        reject(new Error('이미지 로드에 실패했습니다'));
      };
      img.src = URL.createObjectURL(file);
    });
  }