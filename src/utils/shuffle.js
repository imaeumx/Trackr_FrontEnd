/**
 * Fisher-Yates shuffle algorithm
 * Randomizes array in place and returns a new shuffled copy
 */
export const shuffleArray = (array) => {
  if (!array || !Array.isArray(array) || array.length <= 1) {
    return array;
  }

  // Create a copy to avoid modifying original
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    
    // Swap elements
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};
