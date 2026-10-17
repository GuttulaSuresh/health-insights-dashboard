// Builds the complete dashboard model for one profile from that profile's files and food preferences.
import { normalizeProfileData } from './normalize.js';
import {
  buildFindings, buildNeeds, buildScore, categoryStatus, buildGoals, buildFollowUpTests, buildQuestions, overviewSummary,
} from './insights.js';
import { topFoods, eatMore, foodsToLimit, foodSwaps, habitsFor, weekPlan, mealPlate } from './nutrition.js';
import { buildProgress, applyProgress } from './progress.js';
import { DEFAULT_PREFERENCES, normalizePreferences } from './preferences.js';

export function buildProfileModel(profile, files, preferences = DEFAULT_PREFERENCES, { today = new Date() } = {}) {
  const prefs = normalizePreferences(preferences);
  const data = normalizeProfileData(profile, files);
  const { records } = data;
  const findings = buildFindings(records);
  const baseNeeds = buildNeeds(findings);
  const progress = buildProgress(records, baseNeeds.weights);
  const needs = applyProgress(baseNeeds, progress);
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
    top10: topFoods(needs, 10, prefs),
    eatMore: eatMore(needs, prefs),
    limit: foodsToLimit(needs),
    swaps: foodSwaps(needs),
    habits: habitsFor(needs),
    plate: mealPlate(needs, prefs),
  };
  return {
    profile,
    preferences: prefs,
    progress,
    ...data,
    labRecords: records,
    healthInsights,
    foodRecommendations,
    mealPlans: weekPlan(needs, prefs, { start: today, seed: profile.id }),
    healthGoals: buildGoals(findings),
  };
}
