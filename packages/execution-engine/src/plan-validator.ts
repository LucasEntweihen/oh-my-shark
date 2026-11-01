export interface ValidationCheck {
  id: string;
  description: string;
  checkFn: () => boolean | { pass: boolean; message?: string };
}

export interface ValidationReport {
  valid: boolean;
  passedChecks: string[];
  failedChecks: string[];
  errors: string[];
  suggestions: string[];
}

export class PlanValidator {
  private readonly checks: ValidationCheck[] = [];

  public addCheck(id: string, description: string, checkFn: () => boolean | { pass: boolean; message?: string }): void {
    this.checks.push({ id, description, checkFn });
  }

  public validate(): ValidationReport {
    const passed: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];
    const suggestions: string[] = [];

    for (const check of this.checks) {
      try {
        const result = check.checkFn();
        const isPass = typeof result === "boolean" ? result : result.pass;
        const msg = typeof result === "object" && result.message ? result.message : undefined;

        if (isPass) {
          passed.push(check.id);
        } else {
          failed.push(check.id);
          errors.push(msg ?? `Check "${check.id}" (${check.description}) failed.`);
          suggestions.push(`Inspect and resolve defects associated with "${check.id}".`);
        }
      } catch (err: unknown) {
        failed.push(check.id);
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Check "${check.id}" threw an exception: ${errMsg}`);
        suggestions.push(`Fix unexpected error in check "${check.id}".`);
      }
    }

    return {
      valid: failed.length === 0,
      passedChecks: passed,
      failedChecks: failed,
      errors,
      suggestions,
    };
  }

  public clear(): void {
    this.checks.length = 0;
  }
}
