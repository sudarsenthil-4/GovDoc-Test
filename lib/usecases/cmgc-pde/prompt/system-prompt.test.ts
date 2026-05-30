import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserMessage } from "./system-prompt";
import { RUBRIC_QUESTIONS, type RubricQuestion } from "../rubric";

describe("buildSystemPrompt", () => {
  it("includes persona, KB, rubric, output schema", () => {
    const prompt = buildSystemPrompt("KB-PLACEHOLDER", RUBRIC_QUESTIONS);
    expect(prompt).toContain("Senior Alternative Contracting Expert");
    expect(prompt).toContain("KB-PLACEHOLDER");
    expect(prompt).toContain("[A1]");
    expect(prompt).toContain("[F3]");
    expect(prompt).toContain("OUTPUT FORMAT");
    expect(prompt).toContain("EXACTLY 25 items");
  });

  it("includes the design-sequencing block and baseline norms", () => {
    const prompt = buildSystemPrompt("KB", RUBRIC_QUESTIONS);
    expect(prompt).toContain("DESIGN-SEQUENCING");
    expect(prompt).toContain("CALTRANS BASELINE NORMS");
  });

  it("includes the few-shot examples", () => {
    const prompt = buildSystemPrompt("KB", RUBRIC_QUESTIONS);
    expect(prompt).toContain("EVALUATION METHODOLOGY");
    expect(prompt).toContain("EXAMPLE 1");
    expect(prompt).toContain("EXAMPLE 2");
    expect(prompt).toContain("EXAMPLE 3");
  });

  it("includes the exclusion block", () => {
    const prompt = buildSystemPrompt("KB", RUBRIC_QUESTIONS);
    expect(prompt).toContain("IMPORTANT EXCLUSIONS");
    expect(prompt).toContain("Sections 13");
  });

  it("rubric text shows section headers grouped by section", () => {
    const prompt = buildSystemPrompt("KB", RUBRIC_QUESTIONS);
    expect(prompt).toContain("--- A: Project Scope & Characteristics ---");
    expect(prompt).toContain("--- F: Staffing Issues ---");
  });
});

describe("buildSystemPrompt with injected questions", () => {
  it("uses the questions passed in, not the bundled default", () => {
    const fakeQuestions: RubricQuestion[] = [
      { id: "qX", section: "Custom Section", question: "Custom Q?", option_a: "A?", option_b: "B?", option_c: "C?" },
    ];
    const out = buildSystemPrompt("KB-TEXT", fakeQuestions);
    expect(out).toContain("Custom Section");
    expect(out).toContain("Custom Q?");
    expect(out).toContain("KB-TEXT");
  });
});

describe("buildUserMessage", () => {
  it("contains the narrative text and the introductory line", () => {
    const msg = buildUserMessage("This is the narrative content.");
    expect(msg).toContain("Please evaluate the following Alternative Delivery Nomination Fact Sheet");
    expect(msg).toContain("NOMINATION FACT SHEET CONTENT:");
    expect(msg).toContain("This is the narrative content.");
  });
});
