'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Spinner from '@/components/Spinner';
import { getPersonalityTypeByCode } from '@/utils/personality-types';

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

interface TimelineEvent {
  age: string;        // e.g., "2 months", "1 year", "5 years"
  description: string; // e.g., "Found abandoned in a cardboard box"
}

interface CatDetails {
  name: string;
  personalityType: PersonalityType;
  dndAttributes: DndAttributes;
  backstory: string;
  timeline: TimelineEvent[];
}

export default function Home() {
  // States for image and name generation
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const [catDetails, setCatDetails] = useState<CatDetails | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [streamedBackstory, setStreamedBackstory] = useState<string>('');
  const [streamedTimeline, setStreamedTimeline] = useState<TimelineEvent[]>([]);
  
  // Ref for profile card to scroll to
  const profileCardRef = useRef<HTMLDivElement>(null);
  // Ref to accumulate backstory immediately during streaming
  const backstoryRef = useRef<string>('');

  // Fetch a cat image and store its base64 data
  const fetchCatImage = async () => {
    // Reset states
    setImageUrl(null);
    setImageData(null);
    setSuggestedName(null);
    setCatDetails(null);
    // Reset the backstory state and ref!
    setStreamedBackstory('');
    backstoryRef.current = '';
    setIsLoadingImage(true);
    
    const timestamp = Date.now();
    try {
      // Get the cat image
      const response = await fetch(`/api/cat-image?random=${timestamp}`);
      const blob = await response.blob();
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setImageData(base64data);
        setImageUrl(URL.createObjectURL(blob));
        setIsLoadingImage(false);
      };
      
      // Reset additional states
      setSuggestedName(null);
      setCatDetails(null);
    } catch (error) {
      console.error('Error fetching cat image:', error);
    }
  };

  // Set the initial URL only on client-side after hydration
  useEffect(() => {
    fetchCatImage();
  }, []);
  
  // Scroll to profile card when cat details load
  useEffect(() => {
    if (catDetails && profileCardRef.current) {
      // Add a small delay to allow for any rendering to complete
      setTimeout(() => {
        profileCardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 500);
    }
  }, [catDetails]);
  
  const generateNewCat = () => {
    fetchCatImage();
  };

  // Get a name suggestion from the API
  const suggestCatName = async () => {
    if (!imageData) {
      console.error('Cannot get name suggestion: no image data available');
      return;
    }
    
    console.log('Requesting name suggestion for cat image');
    setIsLoadingName(true);
    try {
      const response = await fetch('/api/cat-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          action: 'getName'
        }),
      });
      
      if (!response.ok) {
        console.error('Error response from server:', response.status, response.statusText);
        try {
          const errorData = await response.json();
          console.error('Detailed error from server:', errorData);
        } catch (error) {
          console.error('Could not parse error response:', error);
        }
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Name suggestion response:', data);
      
      if (data.name) {
        setSuggestedName(data.name);
        console.log('Set suggested name to:', data.name);
      } else {
        console.error('No name found in response:', data);
        const defaultName = "Mystery Cat";
        setSuggestedName(defaultName);
      }
    } catch (error) {
      console.error('Error getting cat name suggestion:', error);
      setSuggestedName("Mystery Cat");
    } finally {
      setIsLoadingName(false);
    }
  };
  
  // Get cat story - initiates the full sequence flow
  const getCatStory = async () => {
    if (!suggestedName || !imageData) {
      console.error('Missing name or image data for story generation');
      return;
    }
    
    // Reset states and backstory ref
    setIsLoadingDetails(true);
    setStreamedBackstory('');
    backstoryRef.current = '';
    setStreamedTimeline([]);
    
    try {
      // Step 1: Get personality type
      console.log('Fetching cat personality type...');
      const imageBase64 = imageData.split(',')[1];
      const personalityResponse = await fetch('/api/cat-personality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          name: suggestedName,
        }),
      });
      
      if (!personalityResponse.ok) {
        throw new Error(`Server returned ${personalityResponse.status}: ${personalityResponse.statusText}`);
      }
      
      const personalityData = await personalityResponse.json();
      console.log('Cat personality response:', personalityData);
      
      // Update state with personality type
      setCatDetails({
        name: suggestedName,
        personalityType: personalityData.personalityType,
        dndAttributes: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
          wisdom: 0,
          charisma: 0
        },
        backstory: '',
        timeline: []
      });
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 2: Get D&D attributes using the personality data
      console.log('Fetching cat D&D attributes...');
      const dndResponse = await fetch('/api/cat-dnd-attributes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          name: suggestedName,
          personalityType: personalityData.personalityType
        }),
      });
      
      if (!dndResponse.ok) {
        throw new Error(`Server returned ${dndResponse.status}: ${dndResponse.statusText}`);
      }
      
      const dndData = await dndResponse.json();
      console.log('Cat D&D attributes response:', dndData);
      
      setCatDetails(prev => {
        if (!prev) return null;
        return {
          ...prev,
          dndAttributes: dndData.dndAttributes
        };
      });
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 3: Stream the backstory
      console.log('Setting up streaming connection for backstory...');
      await setupEventSource(imageBase64, suggestedName, personalityData.personalityType);
      
    } catch (error) {
      console.error('Error in cat story generation sequence:', error);
      alert('Failed to complete the story generation. Check the console for details.');
      setIsLoadingDetails(false);
    }
  };
  
  // Setup streaming for backstory (Steps C & D)
  const setupEventSource = async (imageBase64: string, name: string, personalityType: PersonalityType) => {
    try {
      const response = await fetch('/api/cat-backstory-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          name,
          personalityType
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      const processEvents = (text: string) => {
        buffer += text;
        let eventEnd = buffer.indexOf('\n\n');
        
        while (eventEnd > -1) {
          const eventText = buffer.substring(0, eventEnd);
          buffer = buffer.substring(eventEnd + 2); // Skip '\n\n'
          
          const eventLines = eventText.split('\n');
          let eventType = '';
          let eventData = '';
          
          for (const line of eventLines) {
            if (line.startsWith('event: ')) {
              eventType = line.substring(7);
            } else if (line.startsWith('data: ')) {
              eventData = line.substring(6);
            }
          }
          
          if (eventType === 'start') {
            console.log('Streaming connection established');
            setCatDetails(prev => {
              if (!prev) return null;
              return {
                ...prev,
                backstory: '',
                timeline: []
              };
            });
          } else if (eventType === 'text') {
            try {
              const data = JSON.parse(eventData);
              if (data.text) {
                // Update the ref immediately
                backstoryRef.current += data.text;
                // Update state for UI
                setStreamedBackstory(prev => prev + data.text);
                setCatDetails(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    backstory: prev.backstory + data.text
                  };
                });
              }
            } catch (e) {
              console.error('Error parsing event data:', e);
            }
          } else if (eventType === 'done') {
            console.log('Backstory streaming completed, final length:', backstoryRef.current.length);
            setCatDetails(prev => {
              if (!prev) return null;
              return {
                ...prev,
                backstory: backstoryRef.current
              };
            });
            
            console.log('Final backstory synced, fetching timeline');
            
            (async () => {
              try {
                console.log('Waiting before sending timeline request...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('Adding extra delay to ensure backstory state is finalized...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                console.log('FINAL backstory check before sending timeline request:', {
                  backstoryLength: backstoryRef.current.length,
                  backstoryFirstChars: backstoryRef.current.substring(0, 30) + '...',
                  backstoryLastChars: backstoryRef.current.length > 30 ? '...' + backstoryRef.current.substring(backstoryRef.current.length - 30) : '',
                  catDetailsBackstoryLength: catDetails?.backstory?.length || 0
                });
                
                // Set timeline loading state to true
                setIsLoadingTimeline(true);
                
                const timelineResponse = await fetch('/api/cat-timeline', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    backstory: backstoryRef.current,
                    name: suggestedName,
                    personalityType,
                  }),
                });
                
                if (!timelineResponse.ok) {
                  throw new Error(`Timeline API returned ${timelineResponse.status}`);
                }
                
                const timelineData = await timelineResponse.json();
                console.log('Timeline data received:', timelineData);
                
                setCatDetails(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    timeline: timelineData.timeline || []
                  };
                });
              } catch (timelineError) {
                console.error('Error fetching timeline:', timelineError);
              } finally {
                setIsLoadingDetails(false);
                setIsLoadingTimeline(false);
                reader.cancel();
              }
            })();
            return;
          } else if (eventType === 'error') {
            console.error('Server-side error during streaming');
            setIsLoadingDetails(false);
            reader.cancel();
            return;
          }
          
          eventEnd = buffer.indexOf('\n\n');
        }
      };
      
      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream complete');
              setIsLoadingDetails(false);
              break;
            }
            const text = decoder.decode(value, { stream: true });
            processEvents(text);
          }
        } catch (error) {
          console.error('Error reading stream:', error);
          setIsLoadingDetails(false);
        }
      };
      
      readStream();
      
    } catch (error) {
      console.error('Error setting up streaming:', error);
      setIsLoadingDetails(false);
    }
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8" style={{ backgroundColor: "#f9f3e5", color: "#4a3520" }}>
      <div className="relative flex flex-col place-items-center gap-8">
        <h1 className="text-4xl font-bold" style={{ color: "#4a3520" }}>Random Cat Generator</h1>
        
        {/* Cat Image */}
        <div className="relative w-[500px] h-[500px] overflow-hidden rounded-lg shadow-xl" style={{ backgroundColor: "#fff9ec" }}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Random generated cat"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <Spinner size="large" color="#6d8c4f" label="Generating cat..." />
            </div>
          )}
        </div>
        
        {/* Generate new cat button */}
        <button
          onClick={generateNewCat}
          className="px-6 py-3 font-bold rounded-lg transition-colors"
          style={{ backgroundColor: "#4a3520", color: "#fff9ec" }}
        >
          Generate New Cat
        </button>
        
        {/* Name suggestion section */}
        <div className="flex flex-col items-center gap-4">
          {suggestedName ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#4a3520" }}>Meet {suggestedName}!</h2>
              <p className="text-sm mb-3" style={{ color: "#8c6d4f" }}>
                This name was selected based on the visual features of your cat.
              </p>
              
              {!catDetails && !isLoadingDetails ? (
                <button
                  onClick={getCatStory}
                  className="px-6 py-2 text-sm font-bold rounded-lg transition-colors"
                  style={{ backgroundColor: "#6d8c4f", color: "#fff9ec", borderColor: "#4a3520" }}
                >
                  Discover {suggestedName}&apos;s Story
                </button>
              ) : isLoadingDetails ? (
                <div className="flex flex-col items-center py-3">
                  <Spinner size="medium" color="#8c6d4f" />
                  <p className="mt-2 text-sm italic" style={{ color: "#8c6d4f" }}>
                    Generating {suggestedName}&apos;s complete story...
                  </p>
                </div>
              ) : null}
            </div>
          ) : isLoadingName ? (
            <div className="flex flex-col items-center py-3">
              <Spinner size="medium" color="#8c6d4f" />
              <p className="mt-2 text-sm italic" style={{ color: "#8c6d4f" }}>
                Finding the perfect name...
              </p>
            </div>
          ) : (
            <button
              onClick={suggestCatName}
              disabled={!imageUrl}
              className="px-6 py-3 font-bold rounded-lg transition-colors"
              style={{
                backgroundColor: "#6d8c4f", 
                color: "#fff9ec", 
                borderColor: "#4a3520",
                opacity: !imageUrl ? 0.7 : 1
              }}
            >
              Suggest a Name
            </button>
          )}
        </div>
        
        {/* Cat Details Section */}
        {catDetails && (
          <div 
            ref={profileCardRef}
            className="w-full max-w-2xl mt-6 p-6 rounded-lg shadow-md" 
            style={{ backgroundColor: "#fff9ec", color: "#4a3520" }}
          >
            <h2 className="text-2xl font-bold mb-4 border-b pb-2" style={{ borderColor: "#8c6d4f" }}>
              {catDetails.name}&apos;s Profile
            </h2>
            
            {/* Personality Type */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1">Personality Type:</h3>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded font-mono" style={{ backgroundColor: "#e6d7c3" }}>
                    {catDetails.personalityType.code}
                  </span>
                  <span className="font-medium">
                    {catDetails.personalityType.title}
                  </span>
                </div>
                <p className="text-sm mt-1 italic" style={{ color: "#8c6d4f" }}>
                  {getPersonalityTypeByCode(catDetails.personalityType.code)?.description || 
                   "A unique feline personality with distinctive traits and behaviors."}
                </p>
              </div>
            </div>
            
            {/* D&D Attributes */}
            {!Object.values(catDetails.dndAttributes).every(val => val === 0) && (
              <div className="mb-5">
                <h3 className="text-lg font-semibold mb-2">Adventurer Stats:</h3>
                <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                  {Object.entries(catDetails.dndAttributes).map(([attr, value]) => (
                    <div key={attr} className="flex flex-col items-center p-2 rounded" style={{ backgroundColor: "#e6d7c3" }}>
                      <span className="capitalize text-sm">{attr}</span>
                      <span className="font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Backstory */}
            {catDetails.backstory && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Backstory:</h3>
                <div className="prose" style={{ color: "#4a3520" }}>
                  {catDetails.backstory
                    .replace(/#{1,6}\s+([^\n]+)/g, '$1')
                    .split('\n\n')
                    .filter(para => para.trim() !== '')
                    .map((paragraph, index) => (
                      <p key={index} className="text-sm mb-3">{paragraph.trim()}</p>
                    ))
                  }
                </div>
              </div>
            )}
            
            {/* Life Timeline */}
            {catDetails.backstory && !isLoadingDetails && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Life Timeline:</h3>
                {isLoadingTimeline ? (
                  <div className="flex flex-col items-center py-4">
                    <Spinner size="medium" color="#8c6d4f" />
                    <p className="mt-2 text-sm italic" style={{ color: "#8c6d4f" }}>
                      Generating {catDetails.name}&apos;s life events...
                    </p>
                  </div>
                ) : catDetails.timeline && catDetails.timeline.length > 0 && (
                  <div className="relative border-l-2 pl-6 ml-4" style={{ borderColor: "#8c6d4f" }}>
                    {catDetails.timeline.map((event, index) => (
                    <div key={index} className="mb-5 relative">
                      <div 
                        className="absolute w-4 h-4 rounded-full -left-8 mt-1" 
                        style={{ backgroundColor: "#6d8c4f" }}
                      ></div>
                      <h4 className="text-md font-bold">{event.age}</h4>
                      <p className="text-sm">{event.description}</p>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
