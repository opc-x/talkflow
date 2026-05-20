"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAGES = void 0;
exports.getStageForLesson = getStageForLesson;
exports.getStagePct = getStagePct;
exports.STAGES = [
    { index: 1, name: "入门", emoji: "🌱", start: 1, end: 24, plan: "free" },
    { index: 2, name: "日常对话", emoji: "💬", start: 25, end: 77, plan: "basic" },
    { index: 3, name: "职场流利", emoji: "💼", start: 78, end: 126, plan: "basic" },
    { index: 4, name: "高级表达", emoji: "🎯", start: 127, end: 191, plan: "pro" },
];
function getStageForLesson(lessonNum) {
    return exports.STAGES.find((s) => lessonNum >= s.start && lessonNum <= s.end) ?? exports.STAGES[0];
}
function getStagePct(lessonsDone, stage) {
    const done = lessonsDone.filter((l) => l >= stage.start && l <= stage.end).length;
    return Math.round((done / (stage.end - stage.start + 1)) * 100);
}
