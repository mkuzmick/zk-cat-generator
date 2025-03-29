'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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
  backstory: string;
  personalityType: PersonalityType;
  dndAttributes: DndAttributes;
  timeline: TimelineEvent[];
}

export default function Home() {
  // States for image and name generation
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const [catDetails, setCatDetails] = useState<CatDetails | null>(null);
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fetch a cat image and store its base64 data
  const fetchCatImage = async () => {
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
      };
      
      // Reset states
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
      // Call our new cat details API with just the action to get a name
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
        // Try to get more detailed error info if available
        try {
          const errorData = await response.json();
          console.error('Detailed error from server:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      console.log('Received response from name suggestion API');
      const data = await response.json();
      console.log('Name suggestion response:', data);
      
      if (data.name) {
        setSuggestedName(data.name);
        console.log('Set suggested name to:', data.name);
      } else {
        console.error('No name found in response:', data);
        // Fallback to a default name if the API doesn't return one
        const defaultName = "Mystery Cat";
        console.log('Using fallback name:', defaultName);
        setSuggestedName(defaultName);
      }
    } catch (error) {
      console.error('Error getting cat name suggestion:', error);
      // Use a fallback name in case of error
      const fallbackName = "Mystery Cat";
      console.log('Using error fallback name:', fallbackName);
      setSuggestedName(fallbackName);
    } finally {
      setIsLoadingName(false);
    }
  };
  
  // Get cat backstory and details
  const getCatBackstory = async () => {
    if (!suggestedName || !imageData) {
      console.error('Missing name or image data for backstory generation');
      return;
    }
    
    setIsLoadingDetails(true);
    try {
      // Call API to generate backstory
      const response = await fetch('/api/cat-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          action: 'getBackstory',
          name: suggestedName
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Cat details response:', data);
      
      setCatDetails({
        name: suggestedName,
        backstory: data.backstory,
        personalityType: data.personalityType,
        dndAttributes: data.dndAttributes,
        timeline: data.timeline || []
      });
    } catch (error) {
      console.error('Error getting cat backstory:', error);
      alert('Failed to get cat backstory. Check the console for details.');
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8" style={{ backgroundColor: "#f9f3e5", color: "#4a3520" }}>
      <div className="relative flex flex-col place-items-center gap-8">
        <h1 className="text-4xl font-bold" style={{ color: "#4a3520" }}>Random Cat Generator</h1>
        
        {/* Cat Image - only render when URL is available (client-side) */}
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
              <p style={{ color: "#4a3520" }}>Loading cat...</p>
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
                  onClick={getCatBackstory}
                  className="px-6 py-2 text-sm font-bold rounded-lg transition-colors"
                  style={{ backgroundColor: "#6d8c4f", color: "#fff9ec", borderColor: "#4a3520" }}
                >
                  Discover {suggestedName}&apos;s Story
                </button>
              ) : isLoadingDetails ? (
                <p className="text-sm italic" style={{ color: "#8c6d4f" }}>
                  Crafting {suggestedName}&apos;s story...
                </p>
              ) : null}
            </div>
          ) : (
            <button
              onClick={suggestCatName}
              disabled={isLoadingName || !imageUrl}
              className="px-6 py-3 font-bold rounded-lg transition-colors"
              style={{
                backgroundColor: "#6d8c4f", 
                color: "#fff9ec", 
                borderColor: "#4a3520",
                opacity: isLoadingName || !imageUrl ? 0.7 : 1
              }}
            >
              {isLoadingName ? "Finding the perfect name..." : "Suggest a Name"}
            </button>
          )}
        </div>
        
        {/* Cat Details Section */}
        {catDetails && (
          <div className="w-full max-w-2xl mt-6 p-6 rounded-lg shadow-md" style={{ backgroundColor: "#fff9ec", color: "#4a3520" }}>
            <h2 className="text-2xl font-bold mb-4 border-b pb-2" style={{ borderColor: "#8c6d4f" }}>
              {catDetails.name}&apos;s Profile
            </h2>
            
            {/* Myers-Briggs Personality Type */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1">Personality Type:</h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded font-mono" style={{ backgroundColor: "#e6d7c3" }}>
                  {catDetails.personalityType.code}
                </span>
                <span className="font-medium">
                  {catDetails.personalityType.title}
                </span>
              </div>
            </div>
            
            {/* D&D Attributes */}
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
            
            {/* Backstory */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Backstory:</h3>
              <div className="prose" style={{ color: "#4a3520" }}>
                {catDetails.backstory.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-sm mb-3">{paragraph}</p>
                ))}
              </div>
            </div>
            
            {/* Life Timeline */}
            {catDetails.timeline && catDetails.timeline.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Life Timeline:</h3>
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
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
