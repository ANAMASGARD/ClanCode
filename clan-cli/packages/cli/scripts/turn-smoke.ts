import { RunSupervisor } from "../src/supervisor/supervisor.ts";

async function main(): Promise<void> {
  const supervisor = new RunSupervisor();
  try {
    await supervisor.start();
    await supervisor.submitMessage("Reply with exactly CLAN_CODE_READY");
    const text = supervisor.lastModelText;
    console.log(text);
    if (!text.includes("CLAN_CODE_READY")) {
      throw new Error(
        "Streamed output did not contain CLAN_CODE_READY. Configure a TrueForge model provider or set CLAN_TRUEFORGE_MODEL.",
      );
    }
    console.log("turn smoke: CLAN_CODE_READY");
  } catch (error) {
    console.error("TrueForge turn smoke failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await supervisor.stop();
  }
}

await main();
