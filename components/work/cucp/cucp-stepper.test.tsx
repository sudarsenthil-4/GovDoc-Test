import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CucpStepper } from "./cucp-stepper";
import type { ExtractedFact, Criterion } from "@/lib/usecases/cucp-reevals/types";

const facts: ExtractedFact[] = [
  {
    id: "fact_1",
    when: "2018",
    where: "California",
    who: "Owner",
    what: "Personal loan to fund startup",
    why: "Family business",
    magnitude: "$50k",
    demographic_flag: true,
    source_quote: "I borrowed against my home.",
  },
];

const classifications = [
  {
    fact_id: "fact_1",
    category: "Social Disadvantage",
    summary: "Owner cited demographic bias.",
    ai_reasoning: "Affidavit references denied bids.",
  },
];

const criteria: Criterion[] = [
  {
    s_no: 1,
    category: "DBE Active",
    qualification: "Certification active and on file",
    rule_requires: "49 CFR §26.67(a)",
    evidence_summary: "Active certification verified.",
    reasoning: "On file in DBE registry.",
    pass_fail: "Pass",
    request_info: "No",
    confidence: 0.92,
  },
];

const baseProps = {
  runId: "r-1",
  projectId: "proj-test",
  facts,
  classifications,
  criteria,
  isReRunning: false,
  runningLevel: null,
  onComplete: () => {},
};

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchSpy = vi.spyOn(global, "fetch").mockImplementation((url: any) => {
    const u = String(url);
    if (u.includes("/projects/") && u.endsWith("/precedents")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            level_1_precedents: [
              { target: "x", correction: "y", human_reasoning: "z" },
            ],
            level_2_precedents: [],
            level_3_precedents: [
              { target: "a", correction: "b", human_reasoning: "c" },
              { target: "d", correction: "e", human_reasoning: "f" },
            ],
          }),
          { status: 200 },
        ),
      );
    }
    return Promise.resolve(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
  });
});

afterEach(() => {
  fetchSpy.mockRestore();
});

// Click L1's Approve & Continue, wait for the POST to fire, then clear the spy
// so a follow-on assertion can target only the L2/L3 calls. With L1 now wired
// to a real /level/1/approve POST, this is what every test that "moves past
// L1" needs.
async function advanceL1() {
  fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i }));
  await waitFor(() =>
    expect(screen.getByRole("columnheader", { name: /Legal Category/i })).toBeTruthy(),
  );
  fetchSpy.mockClear();
}

describe("CucpStepper", () => {
  it("starts on Step 1 and shows the facts table (caltrans 9-col)", async () => {
    render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    expect(screen.getByRole("columnheader", { name: /Source Quote/i })).toBeTruthy();
  });

  it("L1 Approve & Continue POSTs to /level/1/approve and advances to Step 2", async () => {
    render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    fetchSpy.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/usecases/cucp-reevals/run/r-1/level/1/approve");
    expect((init as RequestInit).method).toBe("POST");

    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /Legal Category/i })).toBeTruthy(),
    );
  });

  it("Back from Step 2 returns to Step 1 (facts table)", async () => {
    render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    await advanceL1();

    fireEvent.click(screen.getByRole("button", { name: /← Back to Facts/i }));
    expect(screen.getByRole("columnheader", { name: /Source Quote/i })).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("L2 Save Override POSTs to /level/2/override with the override payload", async () => {
    render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    await advanceL1();

    fireEvent.change(screen.getByLabelText(/New category/i), {
      target: { value: "Economic Disadvantage" },
    });
    fireEvent.change(screen.getByLabelText(/Legal Rationale/i), {
      target: { value: "Income data shows financial hardship." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/usecases/cucp-reevals/run/r-1/level/2/override");
    expect((init as RequestInit).method).toBe("POST");
    const body = JSON.parse((init as RequestInit).body as string) as { override: unknown };
    expect(body.override).toEqual({
      fact_id: "fact_1",
      new_category: "Economic Disadvantage",
      reason: "Income data shows financial hardship.",
    });
  });

  it("L2 Approve & Continue POSTs to /level/2/approve and advances to Step 3", async () => {
    render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    await advanceL1();

    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2 approve

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/usecases/cucp-reevals/run/r-1/level/2/approve");
    expect((init as RequestInit).method).toBe("POST");

    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /^Pass\/Fail$/i })).toBeTruthy(),
    );
  });

  it("L3 Save Override POSTs to /level/3/override with the override payload", async () => {
    render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    await advanceL1();
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2→L3
    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /^Pass\/Fail$/i })).toBeTruthy(),
    );

    fetchSpy.mockClear();

    fireEvent.change(screen.getByLabelText(/New verdict/i), {
      target: { value: "Fail" },
    });
    fireEvent.change(screen.getByLabelText(/^Reason/i), {
      target: { value: "evidence does not establish certification" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/usecases/cucp-reevals/run/r-1/level/3/override");
    expect((init as RequestInit).method).toBe("POST");
    const body = JSON.parse((init as RequestInit).body as string) as { override: unknown };
    expect(body.override).toEqual({
      s_no: "1",
      verdict: "Fail",
      request_info: "No",
      reason: "evidence does not establish certification",
    });
  });

  it("L3 Submit & Finalize POSTs to /finalize, transitions to Done, and calls onComplete", async () => {
    const onComplete = vi.fn();
    render(<CucpStepper {...baseProps} onComplete={onComplete} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    await advanceL1();
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2→L3
    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /^Pass\/Fail$/i })).toBeTruthy(),
    );

    fetchSpy.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /Submit & Finalize/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/usecases/cucp-reevals/run/r-1/finalize");
    expect((init as RequestInit).method).toBe("POST");

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/L3 Criteria \(final\)/i)).toBeTruthy();
  });

  it("disables L2 Approve & Continue while isReRunning is true", async () => {
    // Render normally first, advance to L2, THEN re-render with isReRunning=true.
    // (With isReRunning=true from the start, L1's Approve button would also be
    // disabled, blocking the advance.)
    const { rerender } = render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    await advanceL1();
    rerender(<CucpStepper {...baseProps} isReRunning={true} runningLevel={2} />);
    const approveBtn = screen.getByRole("button", { name: /Approve & Continue/i });
    expect(approveBtn).toBeDisabled();
  });

  it("shows a re-evaluating banner naming the running level", async () => {
    const { rerender } = render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    await advanceL1();
    rerender(<CucpStepper {...baseProps} isReRunning={true} runningLevel={2} />);
    const banner = screen.getByRole("status");
    expect(banner.textContent || "").toMatch(/Re-evaluating Level 2/i);
  });

  it("Back from Step 3 returns to Step 2", async () => {
    render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    await advanceL1();
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2→L3
    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /^Pass\/Fail$/i })).toBeTruthy(),
    );

    fetchSpy.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /← Back to Categories/i }));
    expect(screen.getByRole("columnheader", { name: /Legal Category/i })).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders the request_info banner when criteria contain request_info=Yes", async () => {
    const criteriaWithRequestInfo: Criterion[] = [
      { ...criteria[0]!, request_info: "Yes" },
    ];
    render(<CucpStepper {...baseProps} criteria={criteriaWithRequestInfo} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    await advanceL1();
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2 approve → POST → L3

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
    expect(screen.getByText(/pending additional information/i)).toBeTruthy();
  });

  it("Done step still shows the L3 criteria table (regression check)", async () => {
    render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    await advanceL1();
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2→L3
    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /^Pass\/Fail$/i })).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: /Submit & Finalize/i }));

    await waitFor(() =>
      expect(screen.getByText(/L3 Criteria \(final\)/i)).toBeTruthy(),
    );
    expect(screen.getByRole("columnheader", { name: /^Pass\/Fail$/i })).toBeTruthy();
  });

  it("renders the persistent counter chip from the GET projects/{projectId}/precedents fetch", async () => {
    // Mocked to return 1 L1, 0 L2, 2 L3 precedents
    render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    expect(screen.getByText(/L2: 0 persistent \+ 0 staged/i)).toBeTruthy();
    expect(screen.getByText(/L3: 2 persistent \+ 0 staged/i)).toBeTruthy();
  });

  it("surfaces a user-visible error when L2 Approve & Continue POST returns 4xx", async () => {
    // Override fetch so /level/2/approve fails with 404, mimicking a dropped
    // rendezvous. The UI must surface the error rather than silently swallow it.
    fetchSpy.mockImplementation((url: any) => {
      const u = String(url);
      if (u.includes("/projects/") && u.endsWith("/precedents")) {
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
      }
      if (u.includes("/level/2/approve")) {
        return Promise.resolve(
          new Response("Run not waiting for input on this level", { status: 404 }),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    });

    render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 0 persistent \+ 0 staged/i);
    await advanceL1();
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2 approve

    await screen.findByRole("alert");
    expect(screen.getByText(/404|Run not waiting/i)).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: /^Pass\/Fail$/i })).toBeNull();
  });

  it("increments the staged L2 chip after a successful override POST", async () => {
    render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    await advanceL1();
    fireEvent.change(screen.getByLabelText(/New category/i), {
      target: { value: "Social Disadvantage" },
    });
    fireEvent.change(screen.getByLabelText(/Legal Rationale/i), {
      target: { value: "long enough rationale here" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));
    await screen.findByText(/L2: 0 persistent \+ 1 staged/i);
  });

  // ─── L1 override-form integration ──────────────────────────────────────────

  it("L1 override POSTs to /level/1/override and increments the staged L1 counter", async () => {
    render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
    fetchSpy.mockClear();

    fireEvent.change(screen.getByLabelText(/What to Correct/i), { target: { value: "Fact fact_1" } });
    fireEvent.change(screen.getByLabelText(/Which Field/i), { target: { value: "When" } });
    fireEvent.change(screen.getByLabelText(/Corrected Value/i), { target: { value: "2020" } });
    fireEvent.change(screen.getByLabelText(/Reasoning/i), { target: { value: "narrative explicitly says 2020 plainly" } });
    fireEvent.click(screen.getByRole("button", { name: /Apply Correction & Re-Evaluate/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/usecases/cucp-reevals/run/r-1/level/1/override");
    expect((init as RequestInit).method).toBe("POST");

    await screen.findByText(/L1: 1 persistent \+ 1 staged/i);
  });

  it("L1 Undo POSTs to /level/1/undo and decrements the staged L1 counter", async () => {
    render(<CucpStepper {...baseProps} />);
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);

    // Stage one override first so the Undo button shows up.
    fireEvent.change(screen.getByLabelText(/Corrected Value/i), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText(/Reasoning/i), { target: { value: "long enough reason text" } });
    fireEvent.click(screen.getByRole("button", { name: /Apply Correction & Re-Evaluate/i }));
    await screen.findByText(/L1: 1 persistent \+ 1 staged/i);

    fetchSpy.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /Undo Last/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0]![0]).toBe("/api/usecases/cucp-reevals/run/r-1/level/1/undo");
    await screen.findByText(/L1: 1 persistent \+ 0 staged/i);
  });
});
