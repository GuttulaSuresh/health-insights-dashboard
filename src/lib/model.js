// Builds the complete dashboard model for one profile from that profile's files.
import { normalizeProfileData } from './normalize.js';
import {
  buildFindings, buildNeeds, buildScore, categoryStatus, buildGoals, buildFollowUpTests, buildQuestions, overviewSummary,
} from './insights.js';
import { topFoods, eatMore, foodsToLimit, foodSwaps, dailyPlan, mealPlate } from './nutrition.js';

export function buildProfileModel(profile, files) {
  const data = normalizeProfileData(profile, files);
  const { records } = data;
  const findings = buildFindings(records);
  const needs = buildNeeds(findings);
  const healthInsights = {
    findings,
    summary: overviewSummary(profile, records, findings),
    categories: categoryStatus(records),
    score: buildScore(records),
    followUpTests: buildFollowUpTests(findings),
    questions: buildQuestions(findings, records),
    counts: {
      total: records.length,
      normal: records.filter((r) => r.severity === 'ok').length,
      attention: records.filter((r) => r.severity === 'watch' || r.severity === 'attention').length,
      priority: records.filter((r) => r.severity === 'priority').length,
      noData: records.filter((r) => r.severity === 'na').length,
      high: records.filter((r) => r.status === 'HIGH').length,
      low: records.filter((r) => r.status === 'LOW').length,
    },
  };
  const foodRecommendations = {
    needs,
    top10: topFoods(needs),
    eatMore: eatMore(needs),
    limit: foodsToLimit(needs),
    swaps: foodSwaps(needs),
    plate: mealPlate(needs),
  };
  return {
    profile,
    ...data,
    labRecords: records,
    healthInsights,
    foodRecommendations,
    mealPlans: dailyPlan(needs),
    healthGoals: buildGoals(findings),
  };
}
