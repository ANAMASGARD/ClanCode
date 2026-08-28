import {
  assertNodeRuntime,
  loadTrueforgeConfig,
} from "../src/trueforge/config.ts";
import {
  ensureRuntime,
  stopRuntime,
  type TrueforgeRuntimeHandle,
  verifySdkConnection,
  waitForHealth,
} from "../src/trueforge/runtime.ts";

async function main(): Promise<void> {
  const config = loadTrueforgeConfig();

  console.log("Clan Code — TrueForge smoke");
  console.log(`  Bun:       ${Bun.version}`);
  console.log(`  Node bin:  ${config.nodeBin}`);
  console.log(`  CLI path:  ${config.cliPath}`);
  console.log(`  Base URL:  ${config.baseUrl}`);

  assertNodeRuntime(config.nodeBin);

  let handle: TrueforgeRuntimeHandle | undefined;
  try {
    handle = await ensureRuntime(config);
    console.log(`  Runtime:   ${handle.mode}`);

    await waitForHealth(config.baseUrl, config.startTimeoutMs);
    console.log("  Health:    /healthz OK");

    const identity = await verifySdkConnection(
      config.baseUrl,
      config.sdkTimeoutSeconds,
    );
    console.log("  SDK:       auth.me() OK");
    console.log(`  Identity:  ${JSON.stringify(identity)}`);
  } finally {
    if (handle !== undefined) {
      await stopRuntime(handle);
      console.log("  Shutdown:  OK");
    }
  }
}

try {
  await main();
} catch (error) {
  console.error("TrueForge smoke failed:");
  console.error(error);
  process.exit(1);
}
