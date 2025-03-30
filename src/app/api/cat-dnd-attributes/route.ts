import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { catBackstoryPrompts } from '@/data/cats';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for structured responses
interface PersonalityType {
  code: string;  // e.g., "INFJ"
  title: string; // e.g., "The Advocate"
}

interface DndAttributes {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// Function to get a cat's D&D attributes based on personality and image
async function getCatDndAttributes(imageBase64: string, name: string, personalityType: PersonalityType): Promise<{ dndAttributes: DndAttributes }> {
  try {
    // Select a random backstory prompt as inspiration
    const randomPromptIndex = Math.floor(Math.random() * catBackstoryPrompts.length);
    const backstoryPrompt = catBackstoryPrompts[randomPromptIndex];
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a cat personality expert who specializes in translating feline traits into RPG attributes. Based on the image of the cat named ${name} with personality type ${personalityType.code} (${personalityType.title}), determine its D&D attributes.

Return a JSON object with ONLY the following structure:
          {
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
              text: `This is an image of a cat named ${name} with personality type ${personalityType.code} (${personalityType.title}). Using this prompt as inspiration: "${backstoryPrompt}", assign Dungeons & Dragons attributes (strength, dexterity, constitution, intelligence, wisdom, charisma) on a scale of 1-20 that would match this cat's appearance and personality type.`
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
    const dndInfo = JSON.parse(response.choices[0].message.content || '{}');
    return dndInfo;
  } catch (error: unknown) {
    console.error('[cat-dnd-attributes] Error getting cat D&D attributes:', error);
    
    // Create fallback D&D attributes
    const fallbackInfo = {
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
    const { imageBase64, name, personalityType } = body;
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }
    
    if (!name) {
      return NextResponse.json({ error: 'No name provided' }, { status: 400 });
    }
    
    if (!personalityType || !personalityType.code) {
      return NextResponse.json({ error: 'No personality type provided' }, { status: 400 });
    }
    
    // Get the cat's D&D attributes
    const dndInfo = await getCatDndAttributes(imageBase64, name, personalityType);
    
    return NextResponse.json(dndInfo);
  } catch (error: unknown) {
    console.error('[cat-dnd-attributes] Error in POST route:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
