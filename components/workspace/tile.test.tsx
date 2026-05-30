import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tile } from "./tile";

describe("Tile", () => {
  it("renders title and accent when enabled", () => {
    render(<Tile title="Search &" accent="Ask" href="/work/search" enabled />);
    expect(screen.getByRole("heading")).toHaveTextContent("Search & Ask");
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  it("shows Coming soon badge when disabled", () => {
    render(<Tile title="My" accent="Inbox" href="/work/inbox" enabled={false} />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
