import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { catNames, catBackstoryPrompts } from '@/data/cats';

// Create a temporary folder for storing images if it doesn't exist
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for structured responses
interface CatName {
  name: string;
}

interface TimelineEvent {
  age: string;        // e.g., "2 months", "1 year", "5 years"
  description: string; // e.g., "Found abandoned in a cardboard box"
}

interface CatDetails {
  backstory: string;
  personalityType: {
    code: string;  // e.g., "INFJ"
    title: string; // e.g., "The Advocate"
  };
  dndAttributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  timeline: TimelineEvent[];
}

// Function to get just a name suggestion using ChatCompletions API instead of Responses API
async function getCatNameSuggestion(imageBase64: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a cat naming expert. Based on the image of a cat, suggest which name from the following options fits best. Combine ONE prefix with ONE suffix. Prefixes: ${catNames.prefixes.join(', ')}. Suffixes: ${catNames.suffixes.join(', ')}. Return a JSON object with a single 'name' field containing the selected name.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please select the best name for this cat from the following options. Combine ONE prefix with ONE suffix:\n\nPrefixes: ${catNames.prefixes.join(', ')}\nSuffixes: ${catNames.suffixes.join(', ')}\n\nWhat name best suits this cat?`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Extract structured name from response
    const responseContent = response.choices[0]?.message.content;
    if (responseContent) {
      try {
        const result = JSON.parse(responseContent) as CatName;
        return result.name;
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
      }
    }
    
    // Fallback name using prefixes and suffixes from our data file
    const randomPrefix = catNames.prefixes[Math.floor(Math.random() * catNames.prefixes.length)];
    const randomSuffix = catNames.suffixes[Math.floor(Math.random() * catNames.suffixes.length)];
    return `${randomPrefix}${randomSuffix}`;
  } catch (error) {
    console.error('Error getting cat name suggestion:', error);
    // Return a random name if there's an error
    const randomPrefix = catNames.prefixes[Math.floor(Math.random() * catNames.prefixes.length)];
    const randomSuffix = catNames.suffixes[Math.floor(Math.random() * catNames.suffixes.length)];
    return `${randomPrefix}${randomSuffix}`;
  }
}

// Function to get a cat's backstory, personality type and D&D attributes
async function getCatBackstory(imageBase64: string, name: string): Promise<CatDetails> {
  try {
    // Select a random backstory prompt from our collection
    const randomPromptIndex = Math.floor(Math.random() * catBackstoryPrompts.length);
    const backstoryPrompt = catBackstoryPrompts[randomPromptIndex];
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a creative writer and cat personality expert. Based on the image of the cat named ${name}, create an engaging backstory and assign personality traits. Use this backstory prompt as a starting point and elaborate on it: "${backstoryPrompt}"

Return a JSON object with the following structure: 
          {
            "backstory": "A compelling 2-3 paragraph backstory that expands on the provided prompt and explains the cat's personality and notable quirks",
            "personalityType": {
              "code": "The 4-letter Myers-Briggs personality type code (e.g., INFJ, ESTP)",
              "title": "The title of this personality type (e.g., 'The Advocate', 'The Entrepreneur')"
            },
            "dndAttributes": {
              "strength": (integer between 1-20),
              "dexterity": (integer between 1-20),
              "constitution": (integer between 1-20),
              "intelligence": (integer between 1-20),
              "wisdom": (integer between 1-20),
              "charisma": (integer between 1-20)
            },
            "timeline": [
              {
                "age": "The age of the cat when event occurred (e.g., '2 months', '1 year')",
                "description": "Description of a significant event in the cat's life"
              },
              // Include 5-7 key events throughout the cat's life, from birth to present
            ]
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This is an image of a cat named ${name}. Starting with this prompt: "${backstoryPrompt}", create a compelling backstory that fits the cat's appearance. Also determine its Myers-Briggs personality type (with both the 4-letter code and the personality title), and assign Dungeons & Dragons attributes (strength, dexterity, constitution, intelligence, wisdom, charisma) on a scale of 1-20.

Additionally, create a timeline of 5-7 key events in the cat's life from birth to present. Each event should include the cat's age when it happened and a brief description of the event. These should align with the backstory you create.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Extract structured details from response
    const responseContent = response.choices[0]?.message.content;
    if (responseContent) {
      try {
        const result = JSON.parse(responseContent) as CatDetails;
        return result;
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
      }
    }
    
    // Fallback data if there's an issue with parsing
    const randomPrompt = catBackstoryPrompts[Math.floor(Math.random() * catBackstoryPrompts.length)];
    return {
      backstory: `${name} is a mysterious cat with an enigmatic past. ${randomPrompt}`,
      personalityType: {
        code: "ISFP",
        title: "The Adventurer"
      },
      timeline: [
        { age: "Birth", description: "Born under mysterious circumstances" },
        { age: "6 months", description: "Began their journey into the unknown" },
        { age: "1 year", description: "Discovered their unique abilities" },
        { age: "2 years", description: "Overcame a significant challenge" },
        { age: "Present", description: "Continuing their adventures" }
      ],
      dndAttributes: {
        strength: 10,
        dexterity: 15,
        constitution: 12,
        intelligence: 14,
        wisdom: 13,
        charisma: 11
      }
    };
  } catch (error) {
    console.error('Error getting cat backstory:', error);
    // Return default details if there's an error
    return {
      backstory: `${name} is a mysterious cat with an enigmatic past.`,
      personalityType: {
        code: "ISFP",
        title: "The Adventurer"
      },
      timeline: [
        { age: "Birth", description: "Born under mysterious circumstances" },
        { age: "6 months", description: "First adventures begin" },
        { age: "1 year", description: "A significant turning point" },
        { age: "Present", description: "Current mysterious circumstances" }
      ],
      dndAttributes: {
        strength: 10,
        dexterity: 15,
        constitution: 12,
        intelligence: 14,
        wisdom: 13,
        charisma: 11
      }
    };
  }
}

export async function POST(request: Request) {
  try {
    console.log('[cat-details] Received POST request');
    
    // Parse the request body
    const body = await request.json();
    const { imageData, action, name } = body;
    
    console.log('[cat-details] Request action:', action);
    console.log('[cat-details] Name provided:', !!name);
    console.log('[cat-details] Image data length:', imageData ? imageData.length : 0);
    
    if (!imageData) {
      console.error('[cat-details] Error: No image data provided');
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }
    
    // Remove the data:image/png;base64, prefix if present
    const base64Data = imageData.includes('base64,') 
      ? imageData.split('base64,')[1] 
      : imageData;
    
    console.log('[cat-details] Base64 data length:', base64Data.length);
    
    // Simplified API: If no action is specified, process everything
    if (!action || action === 'getAll') {
      console.log('[cat-details] Processing complete cat details (all in one)');
      
      try {
        // First get a name suggestion if none was provided
        const catName = name || await getCatNameSuggestion(base64Data);
        console.log('[cat-details] Using cat name:', catName);
        
        // Then get the backstory and details
        const details = await getCatBackstory(base64Data, catName);
        console.log('[cat-details] Backstory generated successfully');
        console.log('[cat-details] Personality type:', details.personalityType);
        console.log('[cat-details] Backstory length:', details.backstory.length);
        
        // Return all the data together
        return NextResponse.json({
          success: true,
          name: catName,
          backstory: details.backstory,
          personalityType: details.personalityType,
          dndAttributes: details.dndAttributes,
          timeline: details.timeline
        });
      } catch (error) {
        console.error('[cat-details] Error processing complete cat details:', error);
        throw error;
      }
    }
    else if (action === 'getName') {
      console.log('[cat-details] Processing getName action');
      // Get name suggestion
      try {
        const suggestedName = await getCatNameSuggestion(base64Data);
        console.log('[cat-details] Name suggestion received:', suggestedName);
        return NextResponse.json({
          success: true,
          name: suggestedName,
          prefixes: catNames.prefixes,
          suffixes: catNames.suffixes
        });
      } catch (nameError) {
        console.error('[cat-details] Error in getName action:', nameError);
        throw nameError; // Rethrow to be caught by the main try/catch
      }
    } else if (action === 'getBackstory' && name) {
      console.log('[cat-details] Processing getBackstory action for', name);
      // Get backstory and character details
      try {
        const details = await getCatBackstory(base64Data, name);
        console.log('[cat-details] Backstory generated successfully');
        console.log('[cat-details] Personality type:', details.personalityType);
        console.log('[cat-details] Backstory length:', details.backstory.length);
        return NextResponse.json({
          success: true,
          name,
          backstory: details.backstory,
          personalityType: details.personalityType,
          dndAttributes: details.dndAttributes
        });
      } catch (backstoryError) {
        console.error('[cat-details] Error in getBackstory action:', backstoryError);
        throw backstoryError; // Rethrow to be caught by the main try/catch
      }
    } else {
      console.error('[cat-details] Invalid action or missing name:', { action, hasName: !!name });
      return NextResponse.json(
        { error: 'Invalid action specified or missing name' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[cat-details] Unhandled error processing cat details:', error);
    return NextResponse.json(
      { error: 'Failed to process cat details' },
      { status: 500 }
    );
  }
}
