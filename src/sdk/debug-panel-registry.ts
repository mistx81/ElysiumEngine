import type { DebugPanelConfig } from '../engine/types';

export type DebugPanelRegistryCallbacks = {
  onRegister?: (panel: DebugPanelConfig) => void;
  onUnregister?: (id: string) => void;
};

export class DebugPanelRegistry {
  private panels: Map<string, DebugPanelConfig> = new Map();
  private callbacks: DebugPanelRegistryCallbacks;

  constructor(callbacks?: DebugPanelRegistryCallbacks) {
    this.callbacks = callbacks ?? {};
  }

  register(panel: DebugPanelConfig): void {
    if (this.panels.has(panel.id)) {
      console.warn(`[DebugPanelRegistry] Duplicate panel ID "${panel.id}" — overwriting existing panel.`);
    }
    this.panels.set(panel.id, panel);
    this.callbacks.onRegister?.(panel);
  }

  unregister(id: string): void {
    if (this.panels.delete(id)) {
      this.callbacks.onUnregister?.(id);
    }
  }

  getPanel(id: string): DebugPanelConfig | undefined {
    return this.panels.get(id);
  }

  getAllPanels(): DebugPanelConfig[] {
    return [...this.panels.values()];
  }

  getPanelCount(): number {
    return this.panels.size;
  }
}
