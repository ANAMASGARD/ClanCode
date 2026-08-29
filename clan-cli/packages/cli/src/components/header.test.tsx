import { describe, expect, test } from "bun:test";
import { testRender } from "@opentui/react/test-utils";

import { Header } from "./header.tsx";

const headerProps = {
  repository: "/home/linux/LFX/clan-code",
  branch: "feat/clerk-device-pairing",
  mode: "PLAN",
  model: "unselected",
  runtime: "ready",
  status: "idle",
};

describe("Header", () => {
  test("wide terminal shows title, chips, and island art", async () => {
    const setup = await testRender(<Header {...headerProps} />, {
      width: 100,
      height: 40,
    });
    try {
      await setup.renderOnce();
      const frame = setup.captureCharFrame();
      expect(frame).toContain("@clancode/cli");
      expect(frame).toContain("mode=");
      expect(frame).toContain("PLAN");
      expect(frame).toContain("agent=");
      expect(frame).toContain("idle");
      expect(frame).toContain("control=");
      expect(frame).toContain("TIP:");
      expect(frame).toContain("~~~~");
      expect(frame).toContain("[]");
    } finally {
      setup.renderer.destroy();
    }
  });

  test("connected control plane shows a green chip", async () => {
    const setup = await testRender(
      <Header {...headerProps} connection="connected" />,
      { width: 100, height: 16 },
    );
    try {
      await setup.renderOnce();
      const frame = setup.captureCharFrame();
      expect(frame).toContain("control=");
      expect(frame).toContain("connected");
    } finally {
      setup.renderer.destroy();
    }
  });

  test("compact terminal keeps status chips without island", async () => {
    const setup = await testRender(<Header {...headerProps} />, {
      width: 40,
      height: 16,
    });
    try {
      await setup.renderOnce();
      const frame = setup.captureCharFrame();
      expect(frame).toContain("mode=");
      expect(frame).toContain("PLAN");
      expect(frame).toContain("agent=");
      expect(frame).not.toContain("TIP:");
    } finally {
      setup.renderer.destroy();
    }
  });
});
