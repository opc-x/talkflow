import { describe, expect, it } from "vitest";
import { inferVisualState, scoringReference } from "@/lib/parse-qa-visual";

describe("inferVisualState", () => {
  it("What's this → pen highlight", () => {
    const v = inferVisualState("What's this?", "It's a pen");
    expect(v.focus).toBe("pen");
    expect(v.animation).toBe("pulse_highlight");
    expect(v.template).toBe("room_basic");
    expect(v.templateId).toBe("deictic_what");
    expect(v.artPack).toBe("talkflow_flat_v2");
    expect(v.objects.find((o) => o.sprite === "pen")?.highlight).toBe(true);
  });

  it("Is this a pen? No → pencil focus, pen dimmed", () => {
    const v = inferVisualState(
      "Is this a pen?",
      "No, it isn't a pen; it's a pencil"
    );
    expect(v.focus).toBe("pencil");
    expect(v.animation).toBe("shake_no");
    expect(v.objects.find((o) => o.sprite === "pencil")?.highlight).toBe(true);
    expect(v.objects.find((o) => o.sprite === "pen")?.dimmed).toBe(true);
  });

  it("Is this the pen? → identify_is_a", () => {
    const v = inferVisualState("Is this the pen?", "Yes, it's the pen");
    expect(v.templateId).toBe("deictic_is_a");
    expect(v.animation).toBe("pulse_highlight");
  });

  it("Where's the pen on book → spatial_on", () => {
    const v = inferVisualState("Where's the pen?", "The pen's on the book");
    expect(v.spatial?.relation).toBe("on");
    expect(v.animation).toBe("spatial_on");
  });

  it("pen under book", () => {
    const v = inferVisualState(
      "Is the pen in the book?",
      "No, the pen isn't in the book; it's under the book"
    );
    expect(v.spatial?.relation).toBe("under");
    expect(v.animation).toBe("spatial_under");
  });

  it("short/long → size_contrast", () => {
    const v = inferVisualState("Is the pen short?", "No, the pen isn't short; it's long");
    expect(v.animation).toBe("size_contrast");
    expect(v.focus).toBe("pen");
  });

  it("Give me a pen → concept_card, no pen pulse", () => {
    const v = inferVisualState("Give me a pen please", "Here you are");
    expect(v.template).toBe("concept_card");
    expect(v.animation).toBe("none");
    expect(v.objects).toHaveLength(0);
  });

  it("What am I doing? → concept_card", () => {
    const v = inferVisualState("What am I doing?", "You're reading");
    expect(v.template).toBe("concept_card");
    expect(v.animation).toBe("none");
  });

  it("Why? → concept_card", () => {
    const v = inferVisualState("Why?", "Because it's short");
    expect(v.template).toBe("concept_card");
    expect(v.animation).toBe("none");
  });

  it("unknown question without nouns → concept_card not pen", () => {
    const v = inferVisualState("Am I sitting?", "Yes, you're sitting");
    expect(v.template).toBe("concept_card");
    expect(v.animation).toBe("none");
    expect(v.focus).toBe("");
  });

  it("colour question → colourSwatch", () => {
    const v = inferVisualState("What colour's this?", "It's black");
    expect(v.templateId).toBe("colour_identify");
    expect(v.colourSwatch).toBe("#1a1a1a");
  });
});

describe("scoringReference", () => {
  it("narrows identification to focus noun", () => {
    const v = inferVisualState("What's this?", "It's a pen");
    expect(scoringReference("What's this?", "It's a pen", v)).toBe("It's a pen.");
  });

  it("returns full answer for concept_card", () => {
    const v = inferVisualState("Give me a pen please", "Here you are");
    expect(scoringReference("Give me a pen please", "Here you are", v)).toBe(
      "Here you are"
    );
  });
});
