import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

beforeEach(() => {
  global.fetch = vi.fn();
});

describe("LoginForm", () => {
  it("submits email and password as username/password to the API", async () => {
    (global.fetch as any).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), "joe");
    await user.type(screen.getByLabelText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ username: "joe", password: "secret" }),
    }));
  });

  it("shows generic error on 401", async () => {
    (global.fetch as any).mockResolvedValue({ ok: false, status: 401 });
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), "joe");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
