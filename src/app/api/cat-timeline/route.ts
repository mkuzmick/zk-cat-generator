import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getBackstory } from '@/utils/backstory-cache';

// Define the structure of a timeline event
interface TimelineEvent {
  age: string;
  description: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to create a default set of timeline events based on a backstory
function createDefaultTimeline(backstory: string, name: string): TimelineEvent[] {
  console.log('[createDefaultTimeline] Creating default timeline for', name);
  return [
    { age: 'Birth', description: `${name} was born into the world.` },
    { age: '3 months', description: 'Started exploring around and developing personality traits.' },
    { age: '6 months', description: 'Gained independence and learned important survival skills.' },
    { age: '1 year', description: 'Fully developed into a young adult cat with established habits.' },
    { age: 'Present', description: 'Living the current chapter of life with confidence and character.' }
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backstory, name, personalityType } = body;
    
    // Validate and log the incoming data to debug the issue
    console.log('[cat-timeline] Request body fields:', {
      backstoryType: typeof backstory,
      backstoryLength: backstory?.length,
      backstoryEmpty: backstory === '',
      nameProvided: !!name,
      personalityProvided: !!personalityType
    });
    
    // First check if backstory is valid from the request
    let validBackstory = typeof backstory === 'string' && backstory.trim() !== '';
    let finalBackstory = backstory;
    
    // If no valid backstory in request but we have a name, try to get it from cache
    if (!validBackstory && name) {
      console.log(`[cat-timeline] Backstory not provided in request, checking cache for ${name}`);
      const cachedBackstory = getBackstory(name);
      
      if (cachedBackstory && cachedBackstory.length > 0) {
        console.log(`[cat-timeline] Found backstory in cache for ${name}, length: ${cachedBackstory.length}`);
        finalBackstory = cachedBackstory;
        validBackstory = true;
      } else {
        console.log(`[cat-timeline] No backstory found in cache for ${name}`);
      }
    }
    
    // If we still don't have a valid backstory, use default timeline
    if (!validBackstory || !name) {
      console.log('[cat-timeline] ⚠️ Invalid input data - using default timeline');
      return new Response(JSON.stringify({ 
        timeline: createDefaultTimeline('', name || 'Unknown Cat'),
        error: 'Missing or empty backstory' 
      }), {
        status: 200, // Return 200 with default data instead of 400
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('[cat-timeline] Generating timeline for', name);
    
    try {
      // Use the chat completions API with JSON mode for the timeline generation
      console.log('[cat-timeline] Using chat completions API with JSON mode');
      
      console.log('[cat-timeline] Backstory excerpt (first 100 chars):', finalBackstory.substring(0, 100));  
      console.log('[cat-timeline] Total backstory length:', finalBackstory.length);  
      
      // Log the actual backstory content for debugging - now using finalBackstory
      console.log('[cat-timeline] Processed finalBackstory content length:', finalBackstory.length);
      console.log('[cat-timeline] First 100 chars of finalBackstory:', finalBackstory.substring(0, 100));
      
      // Make absolutely sure we have a valid backstory with actual content
      if (finalBackstory.length < 100) {
        console.warn('[cat-timeline] ⚠️ Backstory too short, likely incomplete:', finalBackstory);
        return new Response(JSON.stringify({ 
          timeline: createDefaultTimeline('', name), 
          error: 'Backstory too short or incomplete'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Generate timeline using chat completions API with very clear instructions
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI specifically designed to extract storyline events from a cat's backstory and create a timeline. 

You MUST create SPECIFIC timeline events that actually appear in the provided story. 
You MUST NOT return generic cat development milestones.

For example, if the story mentions "a violent storm that separated the cat from its family", include that as an event with an appropriate estimated age.

Your output MUST:
1. Include 5 distinct events that are EXPLICITLY mentioned or strongly implied in the backstory text
2. Assign plausible ages/dates to each event based on context clues
3. Progress logically from birth to present
4. Include specific details from the backstory with direct references to story elements
5. Highlight character-defining moments that shaped the cat's personality as described in the text

Your response MUST be valid JSON exactly matching this structure: 
{ "timeline": [ { "age": "...", "description": "..." }, ... ] } with exactly 5 events.`
          },
          {
            role: "user",
            content: `Here is the backstory for a cat named ${name} (personality type: ${personalityType?.code || 'unknown'}):\n\n${finalBackstory}\n\nCreate a timeline of 5 SPECIFIC life events from this backstory. DO NOT use generic milestones like "Started exploring" or "Gained independence" unless these exact activities are explicitly mentioned. 

Instead, extract actual key moments like "separated during the storm", "discovered the tranquil glade", etc. - whatever is actually mentioned in the story.

Each event must include:
1. An estimated age when it occurred
2. A detailed description referencing the actual content in the backstory

Your response must be properly formatted JSON.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2, // Lower temperature for more deterministic output
        max_tokens: 1500, // More tokens to ensure full response
        presence_penalty: 0.2, // Slight presence penalty to discourage repetition
        frequency_penalty: 0.5 // Frequency penalty to encourage diversity in events
      });
      
      console.log('[cat-timeline] Response received');
      
      // Get the content from the response
      const content = response.choices[0]?.message?.content;
      
      // Log everything for debugging
      console.log('[cat-timeline] Got response from OpenAI, first 100 chars:', content?.substring(0, 100));
      console.log('[cat-timeline] Full response length:', content?.length || 0);
      
      if (!content) {
        console.warn('[cat-timeline] ⚠️ Empty content in response');
        return new Response(JSON.stringify({ 
          timeline: createDefaultTimeline(backstory, name),
          error: 'Empty response from OpenAI'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Parse the JSON content
      try {
        console.log('[cat-timeline] Attempting to parse JSON response');
        // Parse the JSON response
        const data = JSON.parse(content);
        console.log('[cat-timeline] Successfully parsed JSON response. Keys:', Object.keys(data));
        
        // Handle different possible formats the model might return
        let timeline: TimelineEvent[] = [];
        
        if (Array.isArray(data)) {
          console.log('[cat-timeline] Data is an array with', data.length, 'items');
          timeline = data;
        } else if (data.timeline && Array.isArray(data.timeline)) {
          console.log('[cat-timeline] Found timeline array with', data.timeline.length, 'events');
          timeline = data.timeline;
        } else {
          // If we got JSON but not in the expected format
          console.warn('[cat-timeline] ⚠️ Unexpected JSON format:', JSON.stringify(data).substring(0, 200));
          timeline = createDefaultTimeline(finalBackstory, name);
        }
        
        // Log the raw timeline before validation
        console.log('[cat-timeline] Raw timeline before validation:', JSON.stringify(timeline).substring(0, 200));
        
        // Validate each timeline event
        const validatedTimeline = timeline
          .filter(event => {
            const isValid = event && typeof event === 'object' && event.age && event.description;
            if (!isValid) {
              console.warn('[cat-timeline] ⚠️ Filtering out invalid event:', JSON.stringify(event));
            }
            return isValid;
          })
          .map(event => ({
            age: String(event.age).trim(),
            description: String(event.description).trim()
          }));
        
        console.log('[cat-timeline] After validation, have', validatedTimeline.length, 'events');
        
        // If we ended up with no valid events, use the default
        if (validatedTimeline.length === 0) {
          console.warn('[cat-timeline] ⚠️ No valid events found in response - using default timeline');
          return new Response(JSON.stringify({ 
            timeline: createDefaultTimeline(backstory, name),
            error: 'No valid timeline events could be extracted' 
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        console.log('[cat-timeline] Successfully generated', validatedTimeline.length, 'timeline events');
        console.log('[cat-timeline] First event:', JSON.stringify(validatedTimeline[0]));
        
        // Return the timeline data
        return new Response(JSON.stringify({ 
          timeline: validatedTimeline 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (parseError) {
        // Handle JSON parsing errors
        console.error('[cat-timeline] Error parsing JSON:', parseError);
        return new Response(JSON.stringify({ 
          timeline: createDefaultTimeline(backstory, name),
          error: 'Failed to parse timeline data'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
    } catch (openaiError) {
      // If OpenAI API call failed
      console.error('[cat-timeline] OpenAI API error:', openaiError);
      return new Response(JSON.stringify({ 
        timeline: createDefaultTimeline(backstory, name),
        error: 'Error generating timeline from OpenAI'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (generalError) {
    // Catch-all for any other errors
    console.error('[cat-timeline] General error:', generalError);
    return new Response(JSON.stringify({ 
      timeline: createDefaultTimeline('', 'Unknown Cat'),
      error: 'Server error processing timeline request'
    }), {
      status: 200, // Still return 200 with default data
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
