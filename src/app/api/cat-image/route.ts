import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// For debugging
const DEBUG = true;

// Helper function to ensure a directory exists
async function ensureDirectoryExists(dir: string): Promise<void> {
  try {
    await fs.promises.mkdir(dir, { recursive: true });
  } catch (err: unknown) {
    // If directory already exists, that's fine
    if (err instanceof Error && 'code' in err && err.code !== 'EEXIST') {
      console.error(`Error creating directory ${dir}:`, err);
      throw err;
    }
  }
}

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

export async function GET() {
  try {    
    console.log('\n==== STARTING NEW CAT IMAGE GENERATION ====');
    
    // Step 1: Prepare all the file paths we need
    const basePath = path.join(process.cwd(), 'public', 'images', 'essential');
    console.log('Base assets path:', basePath);
    
    // Essential components
    const linesPath = path.join(basePath, 'lines', 'lines.png');
    const eyesPath = getRandomFile(path.join(basePath, 'face', 'face-eyes'));
    const mouthPath = getRandomFile(path.join(basePath, 'face', 'face-mouth'));
    const baseColorPath = getRandomFile(path.join(basePath, 'fur', 'fur-base colors'));
    
    // Verify essential files exist
    if (!fs.existsSync(linesPath) || 
        !fs.existsSync(eyesPath) || 
        !fs.existsSync(mouthPath) || 
        !fs.existsSync(baseColorPath)) {
      throw new Error('One or more essential components are missing');
    }
    
    console.log('Selected components:');
    console.log(`- Base color: ${path.basename(baseColorPath)}`);
    console.log(`- Eyes: ${path.basename(eyesPath)}`);
    console.log(`- Mouth: ${path.basename(mouthPath)}`);
    console.log(`- Lines: ${path.basename(linesPath)}`);
    
    // Step 2: Select ONE fur pattern as requested
    console.log('\n=== SELECTING FUR PATTERN ===');
    let selectedFurPattern = null;
    const furAddonsDir = path.join(process.cwd(), 'public', 'images', 'add-ons', 'fur');
    
    if (fs.existsSync(furAddonsDir)) {
      try {
        // Get all fur pattern categories
        const furCategories = fs.readdirSync(furAddonsDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        
        console.log(`Found ${furCategories.length} fur pattern categories`);
        
        if (furCategories.length > 0) {
          // Select ONE random category
          const selectedCategory = furCategories[Math.floor(Math.random() * furCategories.length)];
          console.log(`Selected category: ${selectedCategory}`);
          
          const categoryPath = path.join(furAddonsDir, selectedCategory);
          if (fs.existsSync(categoryPath)) {
            // Get all patterns in this category
            const patterns = fs.readdirSync(categoryPath)
              .filter(file => file.endsWith('.png'));
            
            if (patterns.length > 0) {
              // Select ONE random pattern
              const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
              selectedFurPattern = path.join(categoryPath, selectedPattern);
              
              console.log(`Selected pattern: ${selectedPattern}`);
              console.log(`Full path: ${selectedFurPattern}`);
              
              // Verify it exists and has content
              if (!fs.existsSync(selectedFurPattern) || 
                  fs.statSync(selectedFurPattern).size === 0) {
                console.error('Selected fur pattern is invalid or empty');
                selectedFurPattern = null;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error selecting fur pattern:', error);
        selectedFurPattern = null;
      }
    } else {
      console.log('Fur patterns directory not found');
    }
    
    // Step 3: Select a head accessory (optional)
    console.log('\n=== SELECTING HEAD ACCESSORY ===');
    let headAccPath = null;
    const headAccDir = path.join(process.cwd(), 'public', 'images', 'add-ons', 'accessories', 'head accs');
    
    // 80% chance to have a head accessory
    const hasHeadAcc = Math.random() < 0.8;
    
    if (hasHeadAcc && fs.existsSync(headAccDir)) {
      try {
        const accTypes = fs.readdirSync(headAccDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        
        if (accTypes.length > 0) {
          const randomAccType = accTypes[Math.floor(Math.random() * accTypes.length)];
          const accTypeDir = path.join(headAccDir, randomAccType);
          
          if (fs.existsSync(accTypeDir)) {
            const accFiles = fs.readdirSync(accTypeDir)
              .filter(file => file.endsWith('.png'));
            
            if (accFiles.length > 0) {
              const randomFile = accFiles[Math.floor(Math.random() * accFiles.length)];
              headAccPath = path.join(accTypeDir, randomFile);
              console.log(`Selected head accessory: ${randomFile}`);
            }
          }
        }
      } catch (error) {
        console.log('Error selecting head accessory:', error);
        headAccPath = null;
      }
    } else {
      console.log('No head accessory selected');
    }
    // Step 4: Generate the cat image using Sharp
    console.log('\n=== GENERATING CAT IMAGE ===');
    
    // Define debug directory (use tmp for production, local folder for development)
    const debugDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'debug-images');
    
    // Ensure debug directory exists
    try {
      await ensureDirectoryExists(debugDir);
    } catch (e) {
      console.error('Failed to create debug directory:', e);
    }
    
    console.log('LAYERING ORDER:');
    console.log('1. Base color');
    console.log('2. Fur pattern (from add-ons)');
    console.log('3. Eyes');
    console.log('4. Mouth');
    console.log('5. Lines');
    console.log('6. Head accessory (if available)');
    
    // First, verify all required files exist
    console.log('\nVerifying all files exist:');
    
    // Verify base color
    if (!fs.existsSync(baseColorPath)) {
      console.error('ERROR: Base color file does not exist!');
      throw new Error(`Base color file not found: ${baseColorPath}`);
    }
    console.log(`✓ Base color: ${path.basename(baseColorPath)}`);
    
    // Verify eyes
    if (!fs.existsSync(eyesPath)) {
      console.error('ERROR: Eyes file does not exist!');
      throw new Error(`Eyes file not found: ${eyesPath}`);
    }
    console.log(`✓ Eyes: ${path.basename(eyesPath)}`);
    
    // Verify mouth
    if (!fs.existsSync(mouthPath)) {
      console.error('ERROR: Mouth file does not exist!');
      throw new Error(`Mouth file not found: ${mouthPath}`);
    }
    console.log(`✓ Mouth: ${path.basename(mouthPath)}`);
    
    // Verify lines
    if (!fs.existsSync(linesPath)) {
      console.error('ERROR: Lines file does not exist!');
      throw new Error(`Lines file not found: ${linesPath}`);
    }
    console.log(`✓ Lines: ${path.basename(linesPath)}`);
    
    // Verify fur pattern if available
    let hasFurPattern = false;
    if (selectedFurPattern && fs.existsSync(selectedFurPattern)) {
      console.log(`✓ Fur pattern: ${path.basename(selectedFurPattern)}`);
      hasFurPattern = true;
      
      // Create an enhanced debug version of the pattern
      try {
        await sharp(selectedFurPattern)
          .normalize()
          .toFile(path.join(debugDir, 'debug-fur-pattern.png'));
      } catch (e) {
        console.error('Failed to save debug fur pattern:', e);
      }
    } else {
      console.log('✗ No fur pattern available');
    }
    
    // Verify head accessory if available
    let hasHeadAccessory = false;
    if (headAccPath && fs.existsSync(headAccPath)) {
      console.log(`✓ Head accessory: ${path.basename(headAccPath)}`);
      hasHeadAccessory = true;
    } else {
      console.log('✗ No head accessory available');
    }
    
    // Now, build all layers in a single composite operation
    console.log('\nBuilding composite image in one operation');
    
    // Create array of composite operations
    const compositeOperations = [];
    
    // Add fur pattern as the first overlay (if available)
    if (hasFurPattern && selectedFurPattern) {
      compositeOperations.push({
        input: selectedFurPattern,
        blend: 'over'
      });
    }
    
    // Add eyes
    compositeOperations.push({
      input: eyesPath,
      blend: 'over'
    });
    
    // Add mouth
    compositeOperations.push({
      input: mouthPath,
      blend: 'over'
    });
    
    // Add lines
    compositeOperations.push({
      input: linesPath,
      blend: 'over'
    });
    
    // Add head accessory (if available)
    if (hasHeadAccessory && headAccPath) {
      compositeOperations.push({
        input: headAccPath,
        blend: 'over'
      });
    }
    
    // Print the layering info
    console.log('Applying layers in this order:');
    console.log('1. Base color: ' + path.basename(baseColorPath));
    let layerNum = 2;
    if (hasFurPattern && selectedFurPattern) {
      console.log(`${layerNum}. Fur pattern: ${path.basename(selectedFurPattern)}`);
      layerNum++;
    }
    console.log(`${layerNum}. Eyes: ${path.basename(eyesPath)}`);
    layerNum++;
    console.log(`${layerNum}. Mouth: ${path.basename(mouthPath)}`);
    layerNum++;
    console.log(`${layerNum}. Lines: ${path.basename(linesPath)}`);
    layerNum++;
    if (hasHeadAccessory && headAccPath) {
      console.log(`${layerNum}. Head accessory: ${path.basename(headAccPath)}`);
    }
    
    // Apply all layers at once
    console.log(`\nApplying ${compositeOperations.length} layers on top of base color`);
    console.log('Using single composite operation for all layers');
    
    // Start with base color and apply all layers in one go
    const catImage = await sharp(baseColorPath)
      .composite(compositeOperations)
      .png();
    
    // Save debug images for key stages
    try {
      // Save base color
      await sharp(baseColorPath).toFile(path.join(debugDir, '1-base-color.png'));
      
      // Save the final composite result
      await catImage.clone().toFile(path.join(debugDir, 'final-composite.png'));
      console.log('Saved debug images');
    } catch (e) {
      console.error('Failed to save debug images:', e);
    }
    
    // Generate the final PNG with explicit format settings
    console.log('Generating final image...');
    const buffer = await catImage
      .png({
        quality: 100,
        compressionLevel: 9
      })
      .toBuffer();
    console.log(`Final image size: ${buffer.length} bytes`);
      
    // Save the final image as debug
    try {
      await fs.promises.writeFile(path.join(debugDir, 'final-cat-image.png'), buffer);
      console.log(`Saved final debug image to ${debugDir}`);
    } catch (e) {
      console.error('Failed to save final debug image:', e);
    }
    
    // Return the final cat image
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error generating cat image:', error);
    
    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', errorMessage);
    if (errorStack) console.error('Stack trace:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate cat image',
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}
