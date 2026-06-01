import { describe, expect, it } from "vitest";
import {
  detectQuestionType,
  resolveSceneTemplate,
  isConceptQuestionType,
} from "@/lib/scene-template-registry";

describe("scene-template-registry", () => {
  it("detects What's this as identify_what", () => {
    expect(detectQuestionType("What's this?", "It's a pen")).toBe("identify_what");
  });

  it("resolves deictic_what template", () => {
    const t = resolveSceneTemplate("What's this?", "It's a pen");
    expect(t.id).toBe("deictic_what");
    expect(t.animation).toBe("pulse_highlight");
    expect(t.artPack).toBe("talkflow_flat_v2");
  });

  it("resolves spatial_under animation for under relation", () => {
    const t = resolveSceneTemplate(
      "Is the pen in the book?",
      "No, the pen isn't in the book; it's under the book"
    );
    expect(t.id).toBe("spatial_on_under_in");
    expect(t.animation).toBe("spatial_under");
  });

  it("negation takes precedence over identify", () => {
    expect(
      detectQuestionType("Is this a pen?", "No, it isn't a pen; it's a pencil")
    ).toBe("negation");
  });

  it("detects Is this the as identify_is_a", () => {
    expect(detectQuestionType("Is this the pen?", "Yes")).toBe("identify_is_a");
  });

  it("detects give_me as command_give → concept", () => {
    expect(detectQuestionType("Give me a pen please", "")).toBe("command_give");
    expect(isConceptQuestionType("command_give")).toBe(true);
    expect(resolveSceneTemplate("Give me a pen please", "").id).toBe("concept_card");
  });

  it("detects who / how_many / why / action as concept types", () => {
    expect(detectQuestionType("Who is he?", "")).toBe("person_who");
    expect(detectQuestionType("How many pens?", "")).toBe("counting");
    expect(detectQuestionType("Why not?", "")).toBe("discourse_why");
    expect(detectQuestionType("What am I doing?", "")).toBe("action_progressive");
  });

  it("defaults unknown to concept", () => {
    expect(detectQuestionType("Am I sitting?", "Yes")).toBe("concept");
    expect(resolveSceneTemplate("Am I sitting?", "Yes").id).toBe("concept_card");
  });
});
