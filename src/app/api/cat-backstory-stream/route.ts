import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { catBackstoryPrompts } from '@/data/cats';
import { saveBackstory } from '@/utils/backstory-cache';

// Set the runtime to edge for improved streaming support
export const runtime = 'edge';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// This API is only responsible for streaming the backstory, not the timeline

// POST handler for streaming response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, name, personalityType } = body;
    
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image data provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!name) {
      return new Response(JSON.stringify({ error: 'No name provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Select a random backstory prompt
    const randomPromptIndex = Math.floor(Math.random() * catBackstoryPrompts.length);
    const backstoryPrompt = catBackstoryPrompts[randomPromptIndex];
    
    // Create a new stream using chat completions API
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a creative writer specializing in cat storytelling. Based on the image of the cat named ${name} with personality type ${personalityType?.code || 'unknown'} (${personalityType?.title || 'unknown type'}), create an engaging backstory.

Use this backstory prompt as inspiration: "${backstoryPrompt}"

IMPORTANT: DO NOT use any markdown formatting like ### or ## in your response. Just write plain text paragraphs.

Write a compelling 2-3 paragraph backstory that explains the cat's personality, notable quirks, and key life events. Make it evocative and detailed. The timeline will be generated separately, so focus only on creating a cohesive narrative.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This is an image of ${name}, a cat with personality type ${personalityType?.code || 'unknown'} (${personalityType?.title || 'unknown type'}). Please create a compelling backstory based on this prompt: "${backstoryPrompt}".`
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
      stream: true
    });

    // Keep track of the full backstory as it's streamed
    let fullBackstory = '';
    
    // Create a streaming response
    return new Response(
      new ReadableStream({
        async start(controller) {
          // Send the initial event to establish the connection
          controller.enqueue(new TextEncoder().encode('event: start\ndata: {}\n\n'));
          console.log('[cat-backstory-stream] Stream started');
          
          try {
            for await (const event of stream) {
              // For the chat completions API
              if (event.choices && event.choices[0]?.delta?.content) {
                const content = event.choices[0].delta.content;
                // Accumulate the backstory
                fullBackstory += content;
                controller.enqueue(
                  new TextEncoder().encode(`event: text\ndata: ${JSON.stringify({ text: content })}\n\n`)
                );
              }
              
              // Check if the stream is finished
              if (event.choices && event.choices[0]?.finish_reason) {
                console.log('[cat-backstory-stream] Stream completed, backstory length:', fullBackstory.length);
                
                // Save the complete backstory to our cache
                if (fullBackstory.length > 0) {
                  console.log(`[cat-backstory-stream] Saving backstory for ${name} to cache`);
                  saveBackstory(name, fullBackstory);
                }
                
                controller.enqueue(
                  new TextEncoder().encode(`event: done\ndata: {}\n\n`)
                );
                controller.close();
              }
            }
          } catch (error: unknown) {
            console.error('[cat-backstory-stream] Error in stream:', error);
            controller.enqueue(
              new TextEncoder().encode(`event: error\ndata: ${JSON.stringify({ message: 'Stream error' })}\n\n`)
            );
            controller.close();
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      }
    );
  } catch (error: unknown) {
    console.error('[cat-backstory-stream] Error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
