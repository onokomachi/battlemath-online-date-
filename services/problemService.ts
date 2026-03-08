
import { ALL_PROBLEM_SETS } from '../data';
import { Problem } from '../types';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

/**
 * 指定された分野と単元の問題セットを返し、シャッフルします。
 * 要望に基づき、出題数の制限（4〜6問）を撤廃し、全件出題するように戻しました。
 */
export const getShuffledProblemSet = (category: string, subTopic: string): Problem[] => {
  const problemSet = ALL_PROBLEM_SETS[subTopic] || [];
  return shuffleArray(problemSet);
};
