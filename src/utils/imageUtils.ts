// src/app/lookalike/utils/imageUtils.ts
import * as faceapi from 'face-api.js';

export async function processImage(file: File): Promise<{
  element: HTMLImageElement;
  detection: faceapi.FaceDetection;
  descriptor: Float32Array;
}> {
  console.log('Starting image processing for file:', file.name);

  try {
    console.log('Creating image from file...');
    const img = await createImageFromFile(file);
    console.log('Image created, dimensions:', img.width, 'x', img.height);

    // Optional: resize image if too large
    const maxSize = 640;
    let processedImg = img;
    if (img.width > maxSize || img.height > maxSize) {
      console.log('Resizing image...');
      const canvas = resizeImage(img, maxSize);
      processedImg = await createImageFromCanvas(canvas);
      console.log('Image resized to:', processedImg.width, 'x', processedImg.height);
    }

    // Verify models are loaded before detection
    console.log('Checking model status...');
    console.log('SSD MobileNet loaded:', faceapi.nets.ssdMobilenetv1.isLoaded);
    console.log('Face Landmark loaded:', faceapi.nets.faceLandmark68Net.isLoaded);
    console.log('Face Recognition loaded:', faceapi.nets.faceRecognitionNet.isLoaded);

    console.log('Starting face detection...');
    const detection = await faceapi
      .detectSingleFace(processedImg)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.log('No face detected in the image');
      throw new Error('얼굴을 찾을 수 없습니다');
    }

    console.log('Face detected:', {
      score: detection.detection.score,
      box: detection.detection.box,
      descriptorLength: detection.descriptor.length
    });

    return {
      element: processedImg,
      detection: detection.detection,
      descriptor: detection.descriptor
    };
  } catch (error) {
    console.error('Error in processImage:', error);
    throw error;
  }
}

async function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(img.src);
      reject(error);
    };
    img.src = URL.createObjectURL(file);
  });
}

async function createImageFromCanvas(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = canvas.toDataURL('image/jpeg');
  });
}

export function resizeImage(image: HTMLImageElement, maxSize: number = 640): HTMLCanvasElement {
  console.log('Resizing image, original dimensions:', image.width, 'x', image.height);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  let width = image.width;
  let height = image.height;

  if (width > height) {
    if (width > maxSize) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    }
  } else {
    if (height > maxSize) {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  console.log('Image resized to:', width, 'x', height);
  return canvas;
}

export function calculateSimilarity(descriptor1: Float32Array, descriptor2: Float32Array): number {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  const similarity = 1 - distance;
  console.log('Similarity calculated:', similarity);
  return similarity;
}