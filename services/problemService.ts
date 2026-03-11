
import { ALL_PROBLEM_SETS } from '../data';
import { Problem } from '../types';
import { SVG_MAP } from '../data/svgDefinitions';
import svgMap from '../data/geometrySvgMap';
import { geometryProofFigures } from '../data/geometryProofFigures';

// Merge all SVG maps (later entries override earlier ones)
const ALL_SVG: Record<string, string> = { ...SVG_MAP, ...svgMap, ...geometryProofFigures };

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

/** Populate svg field from SVG maps when imageUrl matches */
const enrichWithSvg = (problem: Problem): Problem => {
  const data = problem.data as any;
  if (data?.imageUrl && !data.svg && ALL_SVG[data.imageUrl]) {
    return { ...problem, data: { ...data, svg: ALL_SVG[data.imageUrl] } };
  }
  return problem;
};

/**
 * 指定された分野と単元の問題セットを返し、シャッフルします。
 * 要望に基づき、出題数の制限（4〜6問）を撤廃し、全件出題するように戻しました。
 */
export const getShuffledProblemSet = (category: string, subTopic: string): Problem[] => {
  const problemSet = ALL_PROBLEM_SETS[subTopic] || [];
  return shuffleArray(problemSet).map(enrichWithSvg);
};
