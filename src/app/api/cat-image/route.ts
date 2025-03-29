import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Get random file from a directory
function getRandomFile(directory: string): string {
  const files = fs.readdirSync(directory)
    .filter(file => file.endsWith('.png') && !file.startsWith('.'));
  
  if (files.length === 0) {
    throw new Error(`No PNG files found in ${directory}`);
  }
  
  const randomIndex = Math.floor(Math.random() * files.length);
  return path.join(directory, files[randomIndex]);
}

export async function GET(request: Request) {
  try {    
    // Base paths
    const basePath = path.join(process.cwd(), 'public', 'images', 'essential');
    
    // Get random components
    const linesPath = path.join(basePath, 'lines', 'lines.png');
    const eyesPath = getRandomFile(path.join(basePath, 'face', 'face-eyes'));
    const mouthPath = getRandomFile(path.join(basePath, 'face', 'face-mouth'));
    const baseColorPath = getRandomFile(path.join(basePath, 'fur', 'fur-base colors'));
    
    // Layer order: base color at bottom, then eyes and mouth, with lines on the very top
    const composite = await sharp(baseColorPath)
      .composite([
        { input: eyesPath },
        { input: mouthPath },
        { input: linesPath }  // Lines go on top of everything
      ])
      .png()
      .toBuffer();
    
    // Return the image
    return new NextResponse(composite, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error generating cat image:', error);
    return NextResponse.json(
      { error: 'Failed to generate cat image' },
      { status: 500 }
    );
  }
}
