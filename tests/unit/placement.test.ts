// 测的是 shared/assessment/placement.ts 里的分级算法函数。
// 结构：一个 describe = 一个函数；里面每个 it = 这函数的一种情况。
// 加测试 = 复制一个 it，换输入和期望值。

import { describe, it, expect } from "vitest"
import {
  cefrToStartLesson,
  scoreToLessonNum,
  deriveCefrLevel,
  shouldContinueAssessment,
  nextDifficulty,
} from "@shared/assessment/placement"

// 函数1：CEFR 等级 → 起始课号
describe("cefrToStartLesson", () => {
  it("已知等级 → 对应课号（A1→1, B2→78）", () => {
    expect(cefrToStartLesson("A1")).toBe(1)
    expect(cefrToStartLesson("B2")).toBe(78)
  })
  it("未知等级 → 兜底第1课", () => {
    expect(cefrToStartLesson("ZZ")).toBe(1)
  })
})

// 函数2：分数 → 课号（要夹在 1~191 之间）
describe("scoreToLessonNum", () => {
  it("超范围的分数会被夹回 1~191", () => {
    expect(scoreToLessonNum(-5)).toBe(1)    // 负分 → 最低第1课
    expect(scoreToLessonNum(100)).toBe(191) // 超高分 → 最高第191课
  })
})

// 函数3：难度+分数 → CEFR 等级
describe("deriveCefrLevel", () => {
  it("难度3时，靠分数区分 B1 / B1+", () => {
    expect(deriveCefrLevel(3, 6)).toBe("B1")   // 6分 → B1
    expect(deriveCefrLevel(3, 7)).toBe("B1+")  // 7分 → B1+
  })
})

// 函数4：要不要继续测评
describe("shouldContinueAssessment", () => {
  it("第3轮前必继续，第5轮必停", () => {
    expect(shouldContinueAssessment(2, 5, 3)).toBe(true)   // 第2轮 → 继续
    expect(shouldContinueAssessment(5, 5, 3)).toBe(false)  // 第5轮 → 停
  })
})

// 函数5：下一题难度怎么调
describe("nextDifficulty", () => {
  it("高分升难度、低分降难度、中间不变", () => {
    expect(nextDifficulty(3, 8)).toBe(4)  // 8分高 → 难度+1
    expect(nextDifficulty(3, 2)).toBe(2)  // 2分低 → 难度-1
    expect(nextDifficulty(3, 5)).toBe(3)  // 5分中 → 不变
  })
})
