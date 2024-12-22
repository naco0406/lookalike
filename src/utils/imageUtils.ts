import * as faceapi from 'face-api.js';

interface DetectionResult {
  detection: faceapi.FaceDetection;
  landmarks: faceapi.FaceLandmarks68;
  descriptor: Float32Array;
}

// 코사인 유사도 계산 - 수정된 버전
function cosineSimilarity(descriptor1: Float32Array, descriptor2: Float32Array): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < descriptor1.length; i++) {
    dotProduct += descriptor1[i] * descriptor2[i];
    norm1 += descriptor1[i] * descriptor1[i];
    norm2 += descriptor2[i] * descriptor2[i];
  }

  const norm = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (norm === 0) return 0;

  return Math.max(-1, Math.min(1, dotProduct / norm)); // 확실히 -1에서 1 사이로 제한
}

export async function processImage(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement
): Promise<DetectionResult> {
  const displaySize = { width: img.width, height: img.height };
  faceapi.matchDimensions(canvas, displaySize);

  // 감지 옵션 수정 - 더 엄격한 기준 적용
  const options = new faceapi.SsdMobilenetv1Options({
    minConfidence: 0.7,      // 더 높은 신뢰도 요구
    maxResults: 1
  });

  const detection = await faceapi
    .detectSingleFace(img, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error('얼굴을 찾을 수 없습니다');
  }

  // 결과 시각화
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // 캔버스 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  // 얼굴 박스 그리기
  const drawBox = new faceapi.draw.DrawBox(detection.detection.box, {
    label: `신뢰도: ${Math.round(detection.detection.score * 100)}%`,
    boxColor: '#00ff00'
  });
  drawBox.draw(canvas);

  // 랜드마크 그리기
  faceapi.draw.drawFaceLandmarks(canvas, detection.landmarks);

  return {
    detection: detection.detection,
    landmarks: detection.landmarks,
    descriptor: detection.descriptor
  };
}

export function calculateEnhancedSimilarity(
  descriptor1: Float32Array,
  descriptor2: Float32Array | number[]
): number {
  const desc2 = Array.isArray(descriptor2) ? new Float32Array(descriptor2) : descriptor2;

  // 1. 코사인 유사도 계산 (-1 to 1)
  const cosSim = cosineSimilarity(descriptor1, desc2);

  // 2. L2 거리 계산 (0 to ∞)
  const l2Distance = faceapi.euclideanDistance(descriptor1, desc2);

  // L2 거리에 대한 임계값 설정
  const L2_THRESHOLD = 0.6;  // 이 값보다 크면 다른 사람으로 간주
  if (l2Distance > L2_THRESHOLD) {
    return 0;  // 너무 다른 경우 0 반환
  }

  // 3. 거리를 유사도로 변환 (0 to 1)
  const l2Similarity = Math.max(0, 1 - (l2Distance / L2_THRESHOLD));

  // 4. 코사인 유사도를 0-1 범위로 변환
  const normalizedCosSim = (cosSim + 1) / 2;

  // 5. 가중 평균 계산 (두 메트릭 모두 이제 0-1 범위)
  const weightedSimilarity = (normalizedCosSim * 0.7) + (l2Similarity * 0.3);

  // 6. 최종 점수를 0-100 범위로 변환
  return Math.round(weightedSimilarity * 100);
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