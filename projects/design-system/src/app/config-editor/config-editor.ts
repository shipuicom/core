import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ShipAccordion,
  ShipButton,
  ShipFormField,
  ShipIcon,
  ShipRangeSlider,
  ShipSelect,
  ShipThemeToggle,
  ShipToggle,
  ShipColorPickerInput,
  ShipCard,
  defaultThemeColors,
} from 'ship-ui';
import { AppConfigService } from '../core/services/app-config.service';

export interface EditorComponentControl {
  type: 'select' | 'toggle';
  key: string;
  label: string;
  options?: { value: any; label: string }[];
}

export interface EditorComponentConfig {
  name: string;
  route: string;
  configKey: keyof import('ship-ui').ShipConfig;
  controls: EditorComponentControl[];
}

const sidenavOptions = [
  { value: '', label: 'Default' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'simple', label: 'Simple' },
];

const tableVariantOptions = [
  { value: '', label: 'Default' },
  { value: 'type-b', label: 'Type B' },
];

const buttonGroupVariantOptions = [
  { value: '', label: 'Default' },
  { value: 'type-b', label: 'Type B' },
];

const cardVariantOptions = [
  { value: '', label: 'Default' },
  { value: 'type-b', label: 'Type B' },
  { value: 'type-c', label: 'Type C' },
];

const formFieldVariantOptions = [
  { value: '', label: 'Default' },
  { value: 'horizontal', label: 'Horizontal' },
];

const variantOptions = [
  { value: '', label: 'Default' },
  { value: 'simple', label: 'Simple' },
  { value: 'outlined', label: 'Outlined' },
  { value: 'flat', label: 'Flat' },
  { value: 'raised', label: 'Raised' },
];

const sizeOptions = [
  { value: '', label: 'Default' },
  { value: 'small', label: 'Small' },
];

const buttonSizeOptions = [
  { value: '', label: 'Default' },
  { value: 'xsmall', label: 'XSmall' },
  { value: 'small', label: 'Small' },
];

const colorOptions = [
  { value: '', label: 'Default' },
  { value: 'primary', label: 'Primary' },
  { value: 'accent', label: 'Accent' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'info', label: 'Info' },
];


@Component({
  selector: 'app-config-editor',
  standalone: true,
  imports: [
    FormsModule,
    ShipFormField,
    ShipSelect,
    ShipToggle,
    ShipButton,
    ShipIcon,
    ShipThemeToggle,
    ShipAccordion,
    ShipRangeSlider,
    ShipColorPickerInput,
    ShipCard,
  ],
  templateUrl: './config-editor.html',
  styleUrl: './config-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigEditor {
  configService = inject(AppConfigService);
  router = inject(Router);

  userMainAccordionState = signal<string | null>('components');

  openMainAccordion = computed(() => {
    const query = this.searchQuery().trim();
    if (!query) {
      return this.userMainAccordionState();
    }
    const opens: string[] = [];
    if (this.showGlobalSettings()) opens.push('global');
    if (this.filteredEditorComponents().length > 0) opens.push('components');
    if (this.filteredEditorFormFields().length > 0) opens.push('form-fields');
    return opens.join(',');
  });

  onMainAccordionChange(val: string | null) {
    if (!this.searchQuery().trim()) {
      this.userMainAccordionState.set(val);
    }
  }

  openAccordion = signal<string | null>(null);
  searchQuery = signal('');

  filteredEditorComponents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.editorComponents;
    return this.editorComponents.filter((comp) => comp.name.toLowerCase().includes(query));
  });

  showGlobalSettings = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return true;
    return 'global settings font size'.includes(query);
  });

  filteredEditorFormFields = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.editorFormFields;
    return this.editorFormFields.filter((comp) => comp.name.toLowerCase().includes(query));
  });

  onAccordionToggle(event: Event, path: string) {
    if ((event.target as HTMLDetailsElement).open) {
      this.router.navigate([path]);
    }
  }

  get config() {
    return this.configService.config;
  }

  get isEditorOpen() {
    return this.configService.isEditorOpen;
  }

  toggleEditor() {
    this.isEditorOpen.set(!this.isEditorOpen());
  }

  get globalFontSize() {
    return this.config.fontSize || 16;
  }

  updateGlobalFontSize(size: number) {
    this.configService.updateConfig({ fontSize: size });
  }

  get globalBorderRadius() {
    return this.config.borderRadius ?? 1;
  }

  updateGlobalBorderRadius(radius: number) {
    this.configService.updateConfig({ borderRadius: radius });
  }

  get globalBorderWidth() {
    return this.config.borderWidth ?? 1;
  }

  updateGlobalBorderWidth(width: number) {
    this.configService.updateConfig({ borderWidth: width });
  }

  get themeColors() {
    return this.config.colors || {};
  }

  getThemeColor(colorName: string) {
    return this.themeColors[colorName as keyof typeof this.themeColors] || defaultThemeColors[colorName] || '';
  }

  updateThemeColor(colorName: string, hsl: string) {
    this.configService.updateConfig({
      colors: { ...this.themeColors, [colorName]: hsl }
    });
  }

  getThemeDistribution(colorName: string) {
    return this.config.distribution?.[colorName as keyof typeof this.config.distribution] ?? 1;
  }

  updateThemeDistribution(colorName: string, val: number) {
    this.configService.updateConfig({
      distribution: { ...(this.config.distribution || {}), [colorName]: val }
    });
  }

  exportConfig() {
    const configJson = JSON.stringify(this.config, null, 2);
    console.log('ShipUI Config exported:\\n', configJson);
    alert('Config exported to console!\\n\\n' + configJson);
  }

  resetConfig() {
    this.configService.resetConfig();
  }

  editorComponents: EditorComponentConfig[] = [
    {
      name: 'Accordion',
      route: '/accordions',
      configKey: 'accordion',
      controls: [
        { type: 'select', key: 'variant', label: 'Variant', options: tableVariantOptions },
        { type: 'select', key: 'size', label: 'Size', options: sizeOptions },
      ],
    },
    {
      name: 'Alert',
      route: '/alerts',
      configKey: 'alert',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: variantOptions },
      ],
    },
    {
      name: 'Button',
      route: '/buttons',
      configKey: 'button',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: variantOptions },
        { type: 'select', key: 'size', label: 'Size', options: buttonSizeOptions },
      ],
    },
    {
      name: 'Button Group',
      route: '/button-groups',
      configKey: 'buttonGroup',
      controls: [
        // { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: buttonGroupVariantOptions },
        { type: 'select', key: 'size', label: 'Size', options: sizeOptions },
      ],
    },
    {
      name: 'Card',
      route: '/cards',
      configKey: 'card',
      controls: [{ type: 'select', key: 'variant', label: 'Variant', options: cardVariantOptions }],
    },
    {
      name: 'Chip',
      route: '/chips',
      configKey: 'chip',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: variantOptions },
        { type: 'select', key: 'size', label: 'Size', options: buttonSizeOptions },
        { type: 'toggle', key: 'sharp', label: 'Sharp' },
      ],
    },
    {
      name: 'Event Card',
      route: '/event-cards',
      configKey: 'event-card',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: variantOptions },
      ],
    },
    {
      name: 'Icon',
      route: '/icons',
      configKey: 'icon',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'size', label: 'Size', options: sizeOptions },
      ],
    },
    {
      name: 'Progress Bar',
      route: '/progress-bars',
      configKey: 'progressBar',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: variantOptions },
      ],
    },
    {
      name: 'Sidenav',
      route: '/sidenavs',
      configKey: 'sidenavType',
      controls: [{ type: 'select', key: 'type', label: 'Type', options: sidenavOptions }],
    },
    {
      name: 'Spinner',
      route: '/spinners',
      configKey: 'spinner',
      controls: [{ type: 'select', key: 'color', label: 'Color', options: colorOptions }],
    },
    {
      name: 'Stepper',
      route: '/steppers',
      configKey: 'stepper',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: variantOptions },
      ],
    },
    {
      name: 'Table',
      route: '/tables',
      configKey: 'table',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: tableVariantOptions },
      ],
    },
    {
      name: 'Tabs',
      route: '/tabs',
      configKey: 'tabs',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: variantOptions },
      ],
    },
  ];

  editorFormFields: EditorComponentConfig[] = [
    {
      name: 'Checkbox',
      route: '/checkboxes',
      configKey: 'checkbox',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: variantOptions },
      ],
    },
    {
      name: 'Datepicker',
      route: '/datepickers',
      configKey: 'datepicker',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: variantOptions },
        { type: 'select', key: 'size', label: 'Size', options: sizeOptions },
      ],
    },
    {
      name: 'Form Field',
      route: '/form-fields',
      configKey: 'formField',
      controls: [
        { type: 'select', key: 'variant', label: 'Variant', options: formFieldVariantOptions },
        { type: 'select', key: 'size', label: 'Size', options: sizeOptions },
      ],
    },
    {
      name: 'Radio',
      route: '/radio-buttons',
      configKey: 'radio',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: variantOptions },
      ],
    },
    {
      name: 'Range Slider',
      route: '/range-sliders',
      configKey: 'rangeSlider',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: variantOptions },
        { type: 'toggle', key: 'sharp', label: 'Sharp' },
        { type: 'toggle', key: 'alwaysShow', label: 'Always Show Indicator' },
      ],
    },
    {
      name: 'Select',
      route: '/selects',
      configKey: 'select',
      controls: [
        { type: 'select', key: 'variant', label: 'Variant', options: formFieldVariantOptions },
        { type: 'select', key: 'size', label: 'Size', options: sizeOptions },
      ],
    },
    {
      name: 'Toggle',
      route: '/toggles',
      configKey: 'toggle',
      controls: [
        { type: 'select', key: 'color', label: 'Color', options: colorOptions },
        { type: 'select', key: 'variant', label: 'Variant', options: variantOptions },
      ],
    },
  ];

  getComponentConfigValue(compKey: keyof import('ship-ui').ShipConfig, ctrlKey: string): any {
    if (compKey === 'alert' && ctrlKey === 'variant') {
      return this.config.alertVariant || '';
    }
    if (compKey === 'sidenavType') {
      return this.config.sidenavType || '';
    }
    const compConfig = this.config[compKey] as any;
    return compConfig?.[ctrlKey] ?? '';
  }

  isAltered(comp: EditorComponentConfig): boolean {
    if (comp.configKey === 'sidenavType') {
      return this.config.sidenavType !== 'overlay' && !!this.config.sidenavType;
    }
    return comp.controls.some((ctrl) => !!this.getComponentConfigValue(comp.configKey, ctrl.key));
  }

  updateGlobalSidenavType(type: any) {
    this.configService.updateConfig({ sidenavType: type });
  }

  isGlobalSettingsAltered = computed(() => {
    const { fontSize, borderRadius, borderWidth, distribution, colors } = this.config;
    
    const hasCustomDistribution = distribution !== undefined && 
      Object.keys(distribution).length > 0 && 
      Object.values(distribution).some(val => Number(val) !== 1);
      
    const hasCustomColors = colors !== undefined && 
      Object.keys(colors).length > 0 && 
      Object.entries(colors).some(([colorName, val]) => 
        val?.replace(/\s/g, '') !== defaultThemeColors[colorName]?.replace(/\s/g, '')
      );

    return (fontSize !== undefined && Number(fontSize) !== 16) || 
           (borderRadius !== undefined && Number(borderRadius) !== 1) || 
           (borderWidth !== undefined && Number(borderWidth) !== 1) || 
           hasCustomDistribution || 
           hasCustomColors;
  });

  isComponentsAltered = computed(() => {
    return this.editorComponents.some((comp) => this.isAltered(comp));
  });

  isFormFieldsAltered = computed(() => {
    return this.editorFormFields.some((comp) => this.isAltered(comp));
  });

  resetGlobalSettings() {
    this.configService.updateConfig({ fontSize: undefined, borderRadius: undefined, borderWidth: undefined, distribution: undefined, colors: undefined });
  }

  resetComponentsConfig() {
    this.editorComponents.forEach((comp) => this.resetComponentConfig(comp));
  }

  resetFormFieldsConfig() {
    this.editorFormFields.forEach((comp) => this.resetComponentConfig(comp));
  }

  updateAlertVariant(variant: any) {
    this.configService.updateConfig({
      alertVariant: variant,
      alert: { ...this.config.alert, variant: variant },
    });
  }

  updateComponentConfig(component: keyof import('ship-ui').ShipConfig, key: string, value: any) {
    this.configService.updateConfig({
      [component]: { ...(this.config[component] as any), [key]: value },
    });
  }

  resetComponentConfig(comp: EditorComponentConfig) {
    if (comp.configKey === 'sidenavType') {
      this.configService.updateConfig({ sidenavType: undefined });
      return;
    }

    const updates = comp.controls.reduce((acc, ctrl) => {
      acc[ctrl.key] = ctrl.type === 'toggle' ? undefined : '';
      return acc;
    }, {} as any);

    if (comp.configKey === 'alert') {
      this.configService.updateConfig({
        alertVariant: '',
        alert: { ...(this.config.alert as any), ...updates },
      });
    } else {
      this.configService.updateConfig({
        [comp.configKey]: { ...(this.config[comp.configKey] as any), ...updates },
      });
    }
  }
}
