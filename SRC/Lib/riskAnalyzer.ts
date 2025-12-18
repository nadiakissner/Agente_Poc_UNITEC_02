import { RiskCategory, riskPriority } from '@/Data/questionnaire';

export interface RiskScore {
  category: RiskCategory;
  score: number;
}

export interface RiskAnalysis {
  primary: RiskCategory;
  secondary: RiskCategory[];
  scores: RiskScore[];
}

export function analyzeRisks(answers: Map<string, { risk?: RiskCategory; weight?: number }>): RiskAnalysis {
  const riskScores = new Map<RiskCategory, number>();

  // Calculate scores
  answers.forEach((answer) => {
    if (answer.risk && answer.weight) {
      const current = riskScores.get(answer.risk) || 0;
      riskScores.set(answer.risk, current + answer.weight);
    }
  });

  // Convert to array and sort
  const scores: RiskScore[] = Array.from(riskScores.entries()).map(([category, score]) => ({
    category,
    score,
  }));

  // Sort by score (descending) then by priority order
  scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return riskPriority.indexOf(a.category) - riskPriority.indexOf(b.category);
  });

  const primary = scores[0]?.category || 'desorientacion';
  const secondary = scores.slice(1, 3).map((s) => s.category);

  return { primary, secondary, scores };
}
