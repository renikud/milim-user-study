import { v4 as uuidv4 } from 'uuid';
import { generateShuffles } from '../lib/shuffle';

export function useShuffleLogic() {
  const generateUserShuffles = (sentenceIds: string[], models: string[]) => {
    const sessionId = uuidv4();
    const { sentenceOrder, modelShuffles } = generateShuffles(sessionId, sentenceIds, models);
    
    return {
      sessionId,
      sentenceOrder,
      modelShuffles
    };
  };

  return { generateUserShuffles };
}
