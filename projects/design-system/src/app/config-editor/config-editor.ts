import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutState } from '../layout/layout.state';
import { ShipAccordion } from '@ship-ui/core/ship-accordion';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';
import { ShipSelect } from '@ship-ui/core/ship-select';
import { ShipThemeToggle } from '@ship-ui/core/ship-theme-toggle';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { ShipColorPickerInput } from '@ship-ui/core/ship-color-picker';
import { ShipCard } from '@ship-ui/core/ship-card';
import {
  SHIP_STYLE_COLORS,
  SHIP_STYLE_SKINS,
  SHIP_STYLE_VARIANTS,
  ShipStyleSkin,
  defaultThemeColors,
  shipStylesWith,
} from '@ship-ui/core';
import { FontPicker } from '../core/font-picker/font-picker';
import { AppConfigService } from '../core/services/app-config.service';
import { exportShipConfig } from '../core/services/ship-config-export';
import { ShipDialogService } from '@ship-ui/core/ship-dialog';
import { ConfigExportDialog } from './config-export-dialog/config-export-dialog';
import { ConfigImportDialog } from './config-import-dialog/config-import-dialog';

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

const optionLabel = (value: string) =>
  value.startsWith('type-')
    ? 'Type ' + value.slice(5).toUpperCase()
    : value[0].toUpperCase() + value.slice(1).replace(/-/g, ' ');

/** A select's options: Default (no config value) followed by `values`, which mirror the library's variant/size types. */
const options = (...values: string[]) => [
  { value: '', label: 'Default' },
  ...values.map((value) => ({ value, label: optionLabel(value) })),
];

// ShipColor
const colorOptions = options('primary', 'accent', 'warn', 'error', 'success');
// ShipSheetVariant
const variantOptions = options('simple', 'outlined', 'flat', 'raised');
// ShipFormFieldVariant
const formFieldVariantOptions = options('base', 'horizontal', 'auto-width', 'autosize');
// type-b / type-c, the variants of every layout and block
const typeBcOptions = options('type-b', 'type-c');
const smallOptions = options('small');
const xsmallOptions = options('xsmall', 'small');

const color: EditorComponentControl = { type: 'select', key: 'color', label: 'Color', options: colorOptions };
const typeBc: EditorComponentControl = { type: 'select', key: 'variant', label: 'Variant', options: typeBcOptions };
const sheet: EditorComponentControl = { type: 'select', key: 'variant', label: 'Variant', options: variantOptions };
const select = (key: string, label: string, opts: { value: any; label: string }[]): EditorComponentControl => ({ type: 'select', key, label, options: opts });
const toggle = (key: string, label: string): EditorComponentControl => ({ type: 'toggle', key, label });

/** A layout or block entry: its variants, plus a colour when the component takes one. */
const typed = (
  name: string,
  route: string,
  configKey: keyof import('ship-ui').ShipConfig,
  extra: EditorComponentControl[] = [],
): EditorComponentConfig => ({ name, route, configKey, controls: [typeBc, ...extra] });

@Component({
  selector: 'app-config-editor',
  standalone: true,
  imports: [FormsModule,
    ShipFormField,
    ShipSelect,
    ShipToggle,
    ShipButton,
    ShipIcon,
    ShipThemeToggle,
    ShipAccordion,
    ShipRangeSlider,
    ShipColorPickerInput,
    ShipCard, FontPicker],
  templateUrl: './config-editor.html',
  styleUrl: './config-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigEditor {
  #document = inject(DOCUMENT);
  #layoutState = inject(LayoutState);

  #dialog = inject(ShipDialogService);

  configService = inject(AppConfigService);
  router = inject(Router);

  constructor() {
    effect((onCleanup) => {
      const isOpen = this.isEditorOpen();
      const isMobile = this.#layoutState.isMobile();

      if (isOpen && isMobile) {
        this.#document.body.classList.add('sh-config-open');
        this.#document.documentElement.classList.add('sh-config-open');
      }

      onCleanup(() => {
        this.#document.body.classList.remove('sh-config-open');
        this.#document.documentElement.classList.remove('sh-config-open');
      });
    });
  }

  userMainAccordionState = signal<string | null>('components');

  openMainAccordion = computed(() => {
    const query = this.searchQuery().trim();
    if (!query) {
      return this.userMainAccordionState();
    }
    const opens: string[] = [];
    if (this.showGlobalSettings()) opens.push('global');
    for (const group of this.filteredGroups()) if (group.items.length) opens.push(group.value);
    return opens.join(',');
  });

  onMainAccordionChange(val: string | null) {
    if (!this.searchQuery().trim()) {
      this.userMainAccordionState.set(val);
    }
  }

  openAccordion = signal<string | null>(null);
  searchQuery = signal('');


  showGlobalSettings = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return true;
    return 'global settings font size'.includes(query);
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

  get globalPaddingY() {
    return this.config.paddingY ?? 8;
  }

  updateGlobalPaddingY(px: number) {
    this.configService.updateConfig({ paddingY: px });
  }

  get globalPaddingX() {
    return this.config.paddingX ?? 12;
  }

  updateGlobalPaddingX(px: number) {
    this.configService.updateConfig({ paddingX: px });
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

  /** Opens the two files (`app.config.ts` + `styles.scss`) that reproduce the current config in another app. */
  exportConfig() {
    this.#dialog.open(ConfigExportDialog, {
      data: exportShipConfig(this.config, this.configService.styles()),
      width: '760px',
      maxWidth: '95vw',
    });
  }

  importConfig() {
    this.#dialog.open(ConfigImportDialog, {
      width: '640px',
      maxWidth: '95vw',
      closed: result => {
        if (result) this.configService.importConfig(result.config, result.styles, result.source);
      },
    });
  }

  resetConfig() {
    this.configService.resetConfig();
  }

  editorComponents: EditorComponentConfig[] = [
    { name: 'Accordion', route: '/accordions', configKey: 'accordion', controls: [select('variant', 'Variant', options('type-b')), select('size', 'Size', smallOptions)] },
    { name: 'Alert', route: '/alerts', configKey: 'alert', controls: [color, sheet] },
    { name: 'Avatar', route: '/avatars', configKey: 'avatar', controls: [color, select('size', 'Size', xsmallOptions)] },
    { name: 'Breadcrumbs', route: '/breadcrumbs', configKey: 'breadcrumbs', controls: [typeBc, select('size', 'Size', smallOptions)] },
    { name: 'Button', route: '/buttons', configKey: 'button', controls: [color, sheet, select('size', 'Size', xsmallOptions)] },
    { name: 'Button Group', route: '/button-groups', configKey: 'buttonGroup', controls: [select('size', 'Size', smallOptions)] },
    { name: 'Card', route: '/cards', configKey: 'card', controls: [select('variant', 'Variant', options('type-b', 'type-c', 'type-d'))] },
    { name: 'Chart Sparkline', route: '/chart-sparkline', configKey: 'chartSparkline', controls: [color] },
    { name: 'Chat', route: '/chats', configKey: 'chat', controls: [color, typeBc] },
    { name: 'Chip', route: '/chips', configKey: 'chip', controls: [color, sheet, select('size', 'Size', xsmallOptions), toggle('sharp', 'Sharp')] },
    { name: 'Color Picker Input', route: '/color-pickers', configKey: 'colorPickerInput', controls: [color, select('variant', 'Variant', formFieldVariantOptions), select('size', 'Size', smallOptions)] },
    { name: 'Editor', route: '/editors', configKey: 'editor', controls: [select('variant', 'Variant', options('document'))] },
    { name: 'Event Card', route: '/event-cards', configKey: 'eventCard', controls: [color, sheet] },
    { name: 'Icon', route: '/icons', configKey: 'icon', controls: [color, select('size', 'Size', options('small', 'large'))] },
    { name: 'Progress Bar', route: '/progress-bars', configKey: 'progressBar', controls: [color, sheet] },
    { name: 'Sidenav', route: '/sidenavs', configKey: 'sidenavType', controls: [select('type', 'Type', sidenavOptions)] },
    { name: 'Spinner', route: '/spinners', configKey: 'spinner', controls: [color] },
    { name: 'Stepper', route: '/steppers', configKey: 'stepper', controls: [color] },
    { name: 'Table', route: '/tables', configKey: 'table', controls: [select('variant', 'Variant', options('type-a', 'type-b'))] },
    { name: 'Tabs', route: '/tabs', configKey: 'tabs', controls: [color] },
    { name: 'Toggle Card', route: '/cards', configKey: 'toggleCard', controls: [select('variant', 'Variant', options('type-a'))] },
    { name: 'Video', route: '/videos', configKey: 'video', controls: [color, select('variant', 'Variant', options('base', 'edge')), toggle('sharp', 'Sharp')] },
    { name: 'Video Playlist', route: '/videos', configKey: 'videoPlaylist', controls: [color, toggle('sharp', 'Sharp')] },
  ];

  editorFormFields: EditorComponentConfig[] = [
    { name: 'Checkbox', route: '/checkboxes', configKey: 'checkbox', controls: [color, sheet] },
    { name: 'Form Field', route: '/form-fields', configKey: 'formField', controls: [color, select('variant', 'Variant', formFieldVariantOptions), select('size', 'Size', smallOptions)] },
    { name: 'Radio', route: '/radio-buttons', configKey: 'radio', controls: [color, sheet] },
    {
      name: 'Range Slider',
      route: '/range-sliders',
      configKey: 'rangeSlider',
      controls: [color, sheet, select('size', 'Size', smallOptions), toggle('sharp', 'Sharp'), toggle('alwaysShow', 'Always Show Indicator')],
    },
    { name: 'Select', route: '/selects', configKey: 'select', controls: [color, select('variant', 'Variant', formFieldVariantOptions), select('size', 'Size', smallOptions)] },
    { name: 'Theme Toggle', route: '/theme-toggle', configKey: 'themeToggle', controls: [color, sheet, select('size', 'Size', xsmallOptions)] },
    { name: 'Toggle', route: '/toggles', configKey: 'toggle', controls: [color, sheet] },
  ];

  editorLayouts: EditorComponentConfig[] = [
    typed('Page', '/layouts/examples', 'layoutPage', [select('size', 'Size', options('small', 'large'))]),
    typed('Section', '/layouts/examples', 'layoutSection'),
    typed('Setting', '/layouts/examples', 'layoutSetting'),
    typed('Empty State', '/layouts/examples', 'layoutEmptyState'),
    typed('Toolbar', '/layouts/examples', 'layoutToolbar'),
    {
      name: 'Stat',
      route: '/layouts/examples',
      configKey: 'layoutStat',
      controls: [select('variant', 'Variant', options('type-b', 'type-c', 'type-d')), color],
    },
    typed('Stat Trend', '/layouts/examples', 'layoutStatTrend', [color]),
    typed('Stat Goal', '/layouts/examples', 'layoutStatGoal', [color]),
    typed('Stat Ring', '/layouts/examples', 'layoutStatRing', [color]),
    typed('Ranking', '/layouts/examples', 'layoutRanking', [color]),
    typed('Achievement', '/layouts/examples', 'layoutAchievement', [color]),
    typed('Inbox', '/layouts/examples', 'layoutInbox'),
    typed('Table View', '/layouts/examples', 'layoutTableView'),
    typed('Details', '/layouts/examples', 'layoutDetails'),
    typed('Timeline', '/layouts/examples', 'layoutTimeline'),
  ];

  editorBlocks: EditorComponentConfig[] = [
    typed('Banner', '/blocks/examples', 'blockBanner', [color]),
    typed('Header', '/blocks/examples', 'blockHeader'),
    typed('Hero', '/blocks/examples', 'blockHero', [color]),
    typed('Logos', '/blocks/examples', 'blockLogos'),
    typed('Features', '/blocks/examples', 'blockFeatures', [color]),
    typed('Split', '/blocks/examples', 'blockSplit', [color]),
    typed('Steps', '/blocks/examples', 'blockSteps', [color]),
    typed('Stats', '/blocks/examples', 'blockStats', [color]),
    typed('Testimonials', '/blocks/examples', 'blockTestimonials', [color]),
    typed('Pricing', '/blocks/examples', 'blockPricing', [color]),
    typed('FAQ', '/blocks/examples', 'blockFaq', [color]),
    typed('Call to action', '/blocks/examples', 'blockCta', [color]),
    typed('Newsletter', '/blocks/examples', 'blockNewsletter', [color]),
    typed('Team', '/blocks/examples', 'blockTeam'),
    typed('Posts', '/blocks/examples', 'blockPosts'),
    typed('Contact', '/blocks/examples', 'blockContact', [color]),
    typed('Footer', '/blocks/examples', 'blockFooter'),
  ];

  /** The editor's component sections, in order. */
  editorGroups: { value: string; title: string; empty: string; items: EditorComponentConfig[] }[] = [
    { value: 'components', title: 'Components', empty: 'No components found', items: this.editorComponents },
    { value: 'form-fields', title: 'Form fields', empty: 'No form fields found', items: this.editorFormFields },
    { value: 'layouts', title: 'Layouts', empty: 'No layouts found', items: this.editorLayouts },
    { value: 'blocks', title: 'Blocks', empty: 'No blocks found', items: this.editorBlocks },
  ];

  filteredGroups = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.editorGroups;
    return this.editorGroups.map((group) => ({
      ...group,
      items: group.items.filter((comp) => comp.name.toLowerCase().includes(query)),
    }));
  });

  isGroupAltered(items: EditorComponentConfig[]) {
    return items.some((comp) => this.isAltered(comp));
  }

  resetGroup(items: EditorComponentConfig[]) {
    items.forEach((comp) => this.resetComponentConfig(comp));
  }

  getComponentConfigValue(compKey: keyof import('ship-ui').ShipConfig, ctrlKey: string): any {
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
    const { fontSize, borderRadius, borderWidth, paddingY, paddingX, fontFamily, distribution, colors } = this.config;
    
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
           (paddingY !== undefined && Number(paddingY) !== 8) || 
           (paddingX !== undefined && Number(paddingX) !== 12) || 
           !!fontFamily || 
           hasCustomDistribution || 
           hasCustomColors;
  });



  readonly styleColors = SHIP_STYLE_COLORS;
  readonly styleVariants = SHIP_STYLE_VARIANTS;
  readonly styleSkins = SHIP_STYLE_SKINS;

  isStylesAltered = computed(() => shipStylesWith(this.configService.styles()).length > 0);

  skinLabel(skin: string) {
    const words = skin.replace(/([A-Z])/g, ' $1').toLowerCase();
    return words[0].toUpperCase() + words.slice(1);
  }

  hasStyleColor(color: string) {
    return (this.configService.styles().colors ?? (SHIP_STYLE_COLORS as readonly string[])).includes(color);
  }

  hasStyleVariant(variant: string) {
    return (this.configService.styles().variants ?? (SHIP_STYLE_VARIANTS as readonly string[])).includes(variant);
  }

  hasSkin(skin: ShipStyleSkin) {
    return this.configService.styles().skins?.[skin] !== false;
  }

  /** Keeps the list in canonical order (names outside `all`, e.g. `$shipPalettes` additions, kept at the end) and drops it once it is back to everything. */
  #toggleIn(all: readonly string[], current: readonly string[] | undefined, item: string, on: boolean) {
    const extra = (current ?? []).filter(x => !all.includes(x));
    const next = [...all.filter(x => (x === item ? on : (current ?? all).includes(x))), ...extra];
    return next.length === all.length && !extra.length ? undefined : next;
  }

  setStyleColor(color: string, on: boolean) {
    this.configService.styles.update(s => ({ ...s, colors: this.#toggleIn(SHIP_STYLE_COLORS, s.colors, color, on) }));
  }

  setStyleVariant(variant: string, on: boolean) {
    this.configService.styles.update(s => ({
      ...s,
      variants: this.#toggleIn(SHIP_STYLE_VARIANTS, s.variants, variant, on),
    }));
  }

  setSkin(skin: ShipStyleSkin, on: boolean) {
    this.configService.styles.update(s => {
      const skins = { ...s.skins };
      if (on) delete skins[skin];
      else skins[skin] = false;
      return { ...s, skins: Object.keys(skins).length ? skins : undefined };
    });
  }

  resetStyles() {
    this.configService.styles.set({});
  }

  resetGlobalSettings() {
    this.configService.updateConfig({ fontSize: undefined, borderRadius: undefined, borderWidth: undefined, paddingY: undefined, paddingX: undefined, fontFamily: undefined, distribution: undefined, colors: undefined });
  }



  updateAlertVariant(variant: any) {
    this.configService.updateConfig({
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
        alert: { ...(this.config.alert as any), ...updates },
      });
    } else {
      this.configService.updateConfig({
        [comp.configKey]: { ...(this.config[comp.configKey] as any), ...updates },
      });
    }
  }
}
