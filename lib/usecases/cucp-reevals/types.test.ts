import { describe, it, expectTypeOf } from "vitest";
import type {
  Classification,
  Criterion, Level3Data, AnalystOverride, CucpRunResult,
} from "./types";

describe("CUCP types", () => {
  it("CucpRunResult composes the three levels + overrides + report", () => {
    expectTypeOf<CucpRunResult>().toHaveProperty("level1");
    expectTypeOf<CucpRunResult>().toHaveProperty("level2");
    expectTypeOf<CucpRunResult>().toHaveProperty("level3");
    expectTypeOf<CucpRunResult>().toHaveProperty("analyst_overrides");
    expectTypeOf<CucpRunResult>().toHaveProperty("markdown_report");
    expectTypeOf<CucpRunResult>().toHaveProperty("evaluation_date");
  });

  it("Criterion has 7 required fields including pass_fail union", () => {
    expectTypeOf<Criterion["pass_fail"]>().toEqualTypeOf<"Pass" | "Fail">();
    expectTypeOf<Criterion["request_info"]>().toEqualTypeOf<"Yes" | "No">();
  });

  it("Classification union has 5 categories", () => {
    expectTypeOf<Classification["classification"]>().toEqualTypeOf<
      | "Social Disadvantage"
      | "Economic Disadvantage"
      | "Institutional/Systemic Barrier"
      | "Ordinary Business Risk"
      | "Insufficient Evidence"
    >();
  });

  it("Level3Data.final_decision has 3 valid values", () => {
    expectTypeOf<Level3Data["final_decision"]>().toEqualTypeOf<
      "Yes" | "No" | "Not eligible at this time (pending additional information)"
    >();
  });

  it("AnalystOverride.field is one of three discriminators", () => {
    expectTypeOf<AnalystOverride["field"]>().toEqualTypeOf<"pass_fail" | "request_info" | "reasoning">();
  });
});
