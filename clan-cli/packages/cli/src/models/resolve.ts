import { listModelNames, type TrueforgeAgentClient } from "../trueforge/agent.ts";
import { loadPreferences, setPreferredModel } from "../session/preferences.ts";

export async function resolveModelName(client: TrueforgeAgentClient): Promise<string> {
  const envModel = process.env.CLAN_TRUEFORGE_MODEL;
  if (envModel !== undefined && envModel.length > 0) {
    return envModel;
  }
  const prefs = await loadPreferences();
  if (prefs.preferredModel !== undefined) {
    const names = await listModelNames(client);
    if (names.includes(prefs.preferredModel)) {
      return prefs.preferredModel;
    }
  }
  const names = await listModelNames(client);
  const first = names[0];
  if (first === undefined) {
    throw new Error(
      "No TrueForge model is configured. Open the TrueForge UI and add a model provider, or set CLAN_TRUEFORGE_MODEL.",
    );
  }
  return first;
}

export async function listAvailableModels(client: TrueforgeAgentClient): Promise<string[]> {
  return await listModelNames(client);
}

export async function selectModel(client: TrueforgeAgentClient, name: string): Promise<string> {
  const names = await listModelNames(client);
  if (!names.includes(name)) {
    throw new Error(`Unknown model: ${name}. Available: ${names.join(", ")}`);
  }
  await setPreferredModel(name);
  return name;
}
