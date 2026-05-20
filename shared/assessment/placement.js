"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.averageRoundScore = averageRoundScore;
exports.scoreToLessonNum = scoreToLessonNum;
exports.buildAssessmentResult = buildAssessmentResult;
exports.roundAverageScore = roundAverageScore;
const stages_1 = require("../stages");
function averageRoundScore(rounds) {
    if (rounds.length === 0)
        return 4;
    const total = rounds.reduce((sum, r) => {
        const { fluency, grammar, vocabulary } = r.scores;
        return sum + (fluency + grammar + vocabulary) / 3;
    }, 0);
    return total / rounds.length;
}
function scoreToLessonNum(avgScore) {
    const normalized = Math.max(0, Math.min(10, avgScore));
    const lesson = Math.round((normalized / 10) * 190) + 1;
    return Math.max(1, Math.min(191, lesson));
}
function readinessHint(stageIndex, avgScore) {
    if (avgScore < 4)
        return "先从入门场景练嘴，把开口练顺";
    if (stageIndex >= 3)
        return "可以直接挑战更高阶场景";
    if (stageIndex >= 2)
        return "日常对话开练刚刚好";
    return "按节奏练，每天 15 分钟就够";
}
function buildAssessmentResult(rounds, lesson, vocabPreview) {
    const avgScore = averageRoundScore(rounds);
    const suggestedLessonNum = lesson?.lesson_num ?? scoreToLessonNum(avgScore);
    const stage = (0, stages_1.getStageForLesson)(suggestedLessonNum);
    return {
        suggestedLessonNum,
        bookNum: lesson?.book_num ?? 1,
        lessonId: lesson?.id ?? null,
        stageName: stage.name,
        stageEmoji: stage.emoji,
        vocabPreview,
        practiceScore: Math.round(avgScore * 10) / 10,
        readinessHint: readinessHint(stage.index, avgScore),
    };
}
function roundAverageScore(evaluation) {
    const { fluency, grammar, vocabulary } = evaluation.scores;
    return (fluency + grammar + vocabulary) / 3;
}
