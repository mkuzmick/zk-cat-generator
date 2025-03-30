import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { catBackstoryPrompts } from '@/data/cats';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for structured responses
interface BasicCatInfo {
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
}

// Function to get a cat's basic info: personality type and D&D attributes
async function getCatBasicInfo(imageBase64: string, name: string): Promise<BasicCatInfo> {
  try {
    // Select a random backstory prompt as inspiration
    const randomPromptIndex = Math.floor(Math.random() * catBackstoryPrompts.length);
    const backstoryPrompt = catBackstoryPrompts[randomPromptIndex];
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a cat personality expert. Based on the image of the cat named ${name}, determine its personality type and attributes.

Return a JSON object with ONLY the following structure:
          {
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
            }
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This is an image of a cat named ${name}. Using this prompt as inspiration: "${backstoryPrompt}", determine the cat's Myers-Briggs personality type (with both the 4-letter code and the personality title), and assign Dungeons & Dragons attributes (strength, dexterity, constitution, intelligence, wisdom, charisma) on a scale of 1-20.`
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

    // Parse the response
    const basicInfo = JSON.parse(response.choices[0].message.content || '{}');
    return basicInfo as BasicCatInfo;
  } catch (error: unknown) {
    console.error('[cat-basic-info] Error getting cat basic info:', error);
    
    // Create fallback basic info
    const fallbackInfo: BasicCatInfo = {
      personalityType: {
        code: "ISFP",
        title: "The Adventurer"
      },
      dndAttributes: {
        strength: Math.floor(Math.random() * 10) + 5,
        dexterity: Math.floor(Math.random() * 10) + 10,
        constitution: Math.floor(Math.random() * 10) + 5,
        intelligence: Math.floor(Math.random() * 10) + 5,
        wisdom: Math.floor(Math.random() * 10) + 5,
        charisma: Math.floor(Math.random() * 10) + 5
      }
    };
    
    return fallbackInfo;
  }
}

// POST handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, name } = body;
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }
    
    if (!name) {
      return NextResponse.json({ error: 'No name provided' }, { status: 400 });
    }
    
    // Get the cat's basic info
    const basicInfo = await getCatBasicInfo(imageBase64, name);
    
    return NextResponse.json(basicInfo);
  } catch (error: unknown) {
    console.error('[cat-basic-info] Error in POST route:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
