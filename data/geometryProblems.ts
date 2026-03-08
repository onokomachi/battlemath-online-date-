import type { ProblemSet } from '../types';
import { geometryAngleProblems } from './geometryAngleProblems';
import { geometryQuadrilateralsProblems } from './geometryQuadrilateralsProblems';
import { geometry2Problems } from './geometry2';
import { geometry1ProofProblems } from './geometry1ProofProblems';

export const geometryProblems: ProblemSet = {
  ...geometryAngleProblems,
  ...geometry1ProofProblems,
  ...geometry2Problems,
  ...geometryQuadrilateralsProblems,
};
