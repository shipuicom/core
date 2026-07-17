import { httpResource } from '@angular/common/http';
import { computed, Injectable } from '@angular/core';

export interface ApiInput {
  name: string;
  type: string;
  description?: string;
  defaultValue?: string;
  options?: string[];
  twoWay?: boolean;
}
export interface ApiOutput {
  name: string;
  type: string;
  description?: string;
}
export interface ApiMethod {
  name: string;
  parameters: string;
  returnType: string;
  description?: string;
}
export interface ApiCssVar {
  name: string;
  defaultValue?: string;
  description?: string;
}
export interface ApiComponent {
  name: string;
  selector: string;
  selectorAliases?: string[];
  package?: string;
  kind?: 'component' | 'directive' | 'service';
  description?: string;
  keywords?: string[];
  inputs: ApiInput[];
  outputs: ApiOutput[];
  methods: ApiMethod[];
  cssVariables: ApiCssVar[];
}

/**
 * Loads the generated ShipUI component metadata (`bun run mcp:update`) once and
 * exposes it for the `<app-api-reference>` doc primitive. The JSON is shipped as
 * a design-system asset (see angular.json).
 */
@Injectable({ providedIn: 'root' })
export class ComponentMetaService {
  readonly resource = httpResource<ApiComponent[]>(() => '/assets/mcp/components.json');

  readonly byKey = computed(() => {
    const map = new Map<string, ApiComponent>();
    for (const c of this.resource.value() ?? []) {
      map.set(c.name, c);
      map.set(c.selector, c);
    }
    return map;
  });

  find(key: string): ApiComponent | undefined {
    return this.byKey().get(key);
  }
}
