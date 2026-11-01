export interface FileSnapshot {
  content: string;
  hash: string;
}

export interface Checkpoint {
  id: string;
  operationId: string;
  timestamp: number;
  files: Record<string, FileSnapshot>;
}

export class CheckpointEngine {
  private readonly checkpoints = new Map<string, Checkpoint>();

  public computeHash(content: string): string {
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(content);
    return hasher.digest("hex");
  }

  public createCheckpoint(operationId: string, files: Record<string, string>): Checkpoint {
    const id = `chk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const snapshots: Record<string, FileSnapshot> = {};

    for (const [filePath, content] of Object.entries(files)) {
      snapshots[filePath] = {
        content,
        hash: this.computeHash(content),
      };
    }

    const checkpoint: Checkpoint = {
      id,
      operationId,
      timestamp: Date.now(),
      files: snapshots,
    };

    this.checkpoints.set(id, checkpoint);
    return checkpoint;
  }

  public getCheckpoint(id: string): Checkpoint | undefined {
    return this.checkpoints.get(id);
  }

  public rollbackCheckpoint(id: string): Record<string, string> {
    const chk = this.checkpoints.get(id);
    if (!chk) {
      throw new Error(`[CheckpointEngine] Checkpoint "${id}" not found.`);
    }

    const restored: Record<string, string> = {};
    for (const [filePath, snap] of Object.entries(chk.files)) {
      restored[filePath] = snap.content;
    }
    return restored;
  }

  public rollbackFile(checkpointId: string, filePath: string): string {
    const chk = this.checkpoints.get(checkpointId);
    if (!chk) {
      throw new Error(`[CheckpointEngine] Checkpoint "${checkpointId}" not found.`);
    }

    const snap = chk.files[filePath];
    if (!snap) {
      throw new Error(`[CheckpointEngine] File "${filePath}" not recorded in checkpoint "${checkpointId}".`);
    }

    return snap.content;
  }

  public detectExternalConflict(currentContent: string, expectedHash: string): boolean {
    const currentHash = this.computeHash(currentContent);
    return currentHash !== expectedHash;
  }

  public getCheckpointCount(): number {
    return this.checkpoints.size;
  }
}
