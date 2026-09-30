export interface MigrationRules {
  version: string;
  notes?: string;
  /** `--old-` → `--new-` for every variable starting with the prefix. */
  cssVarPrefixes?: Array<{ from: string; to: string }>;
  /** Exact variable renames; `requires` limits the rewrite to files mentioning that selector. */
  cssVars?: Array<{ from: string; to: string; requires?: string }>;
  /** Class renames applied only on the listed tags. */
  classes?: Array<{ from: string; to: string; on: string[] }>;
  /** Element selector renames. */
  selectors?: Array<{ from: string; to: string }>;
  /** Inputs that no longer exist; the attribute is dropped from the tag. */
  removedInputs?: Array<{ tag: string; input: string }>;
  /** Sass `with(...)` flag renames. */
  sassFlags?: Array<{ from: string; to: string }>;
}
