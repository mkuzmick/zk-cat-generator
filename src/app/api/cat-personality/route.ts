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

// Function to get a cat's personality type only
async function getCatPersonality(imageBase64: string, name: string): Promise<{ personalityType: PersonalityType }> {
  try {
    // Select a random backstory prompt as inspiration
    const randomPromptIndex = Math.floor(Math.random() * catBackstoryPrompts.length);
    const backstoryPrompt = catBackstoryPrompts[randomPromptIndex];
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a cat personality expert. Based on the image of the cat named ${name}, determine its Myers-Briggs personality type.

Return a JSON object with ONLY the following structure:
          {
            "personalityType": {
              "code": "The 4-letter Myers-Briggs personality type code (e.g., INFJ, ESTP)",
              "title": "The title of this personality type (e.g., 'The Advocate', 'The Entrepreneur')"
            }
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This is an image of a cat named ${name}. Using this prompt as inspiration: "${backstoryPrompt}", determine the cat's Myers-Briggs personality type (with both the 4-letter code and the personality title).`
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
    const personalityInfo = JSON.parse(response.choices[0].message.content || '{}');
    return personalityInfo;
  } catch (error: unknown) {
    console.error('[cat-personality] Error getting cat personality:', error);
    
    // Create fallback personality info
    const fallbackInfo = {
      personalityType: {
        code: "ISFP",
        title: "The Adventurer"
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
    
    // Get the cat's personality type
    const personalityInfo = await getCatPersonality(imageBase64, name);
    
    return NextResponse.json(personalityInfo);
  } catch (error: unknown) {
    console.error('[cat-personality] Error in POST route:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
