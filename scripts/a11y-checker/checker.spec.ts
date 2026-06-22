import { test, expect } from '@playwright/test';
import { COMPONENT_A11Y_MAP } from './config';

test.describe('ShipUI Dynamic ARIA & WCAG Runtime Compliance Checker', () => {
  for (const [componentName, config] of Object.entries(COMPONENT_A11Y_MAP)) {
    test(`Validate compliance for component: ${componentName}`, async ({ page }) => {
      await page.goto(config.url);
      await page.waitForLoadState('domcontentloaded');

      for (const rule of config.rules) {
        if (componentName === 'spotlight') {
          const btn = page.locator('button:has-text("Open Manual Spotlight"), button:has-text("Open Declarative Spotlight")').first();
          await btn.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
          if (await btn.count() > 0) {
            await btn.click();
          }
        }

        const firstHost = page.locator(rule.selector).first();
        await firstHost.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {
          throw new Error(`Timed out waiting for element matching "${rule.selector}" to attach to DOM.`);
        });

        const hosts = page.locator(rule.selector);
        const count = await hosts.count();
        expect(count, `Expected to find at least one element matching "${rule.selector}"`).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
          const host = hosts.nth(i);

          switch (rule.type) {
            case 'selection-group': {
              // Host Role validation
              if (rule.hostRole) {
                const role = await host.getAttribute('role');
                expect(role, `Host element "${rule.selector}" should have role="${rule.hostRole}"`).toBe(rule.hostRole);
              }

              // Child Items validation
              if (rule.itemSelector) {
                const items = host.locator(rule.itemSelector);
                await items.first().waitFor({ state: 'attached', timeout: 2000 }).catch(() => {});
                const itemCount = await items.count();
                expect(itemCount, `Expected host element "${rule.selector}" to contain items matching "${rule.itemSelector}"`).toBeGreaterThan(0);

                for (let j = 0; j < itemCount; j++) {
                  const item = items.nth(j);

                  if (rule.itemRole) {
                    const role = await item.getAttribute('role');
                    expect(role, `Item matching "${rule.itemSelector}" should have role="${rule.itemRole}"`).toBe(rule.itemRole);
                  }

                  if (rule.activeAttr) {
                    const isActive = await item.evaluate((el) => el.classList.contains('active'));
                    const attrVal = await item.getAttribute(rule.activeAttr);

                    if (isActive) {
                      expect(attrVal, `Active item matching "${rule.itemSelector}" should have ${rule.activeAttr}="true"`).toBe('true');
                    } else {
                      expect(attrVal, `Inactive item matching "${rule.itemSelector}" should have ${rule.activeAttr}="false"`).toBe('false');
                    }
                  }
                }
              }
              break;
            }

            case 'details-summary': {
              const detailsList = host.locator('details');
              const detailsCount = await detailsList.count();
              expect(detailsCount, `Host "${rule.selector}" should contain at least one details element`).toBeGreaterThan(0);

              for (let j = 0; j < detailsCount; j++) {
                const details = detailsList.nth(j);
                const summary = details.locator('> summary');
                const summaryCount = await summary.count();
                expect(summaryCount, `Details element inside "${rule.selector}" should contain exactly one direct summary element`).toBe(1);
              }
              break;
            }

            case 'input-control': {
              if (!rule.hasNativeInput) break;

              const role = await host.getAttribute('role');
              if (role) {
                const expectedRole = rule.hasNativeInput === 'range' ? 'slider' : (rule.hasNativeInput === 'checkbox' ? 'checkbox' : 'radio');
                expect(role, `Custom checkbox/radio/slider host should have role="${expectedRole}"`).toBe(expectedRole);
                const ariaChecked = await host.getAttribute('aria-checked');
                if (rule.hasNativeInput !== 'range') {
                  expect(ariaChecked, `Custom checkbox/radio should have aria-checked`).not.toBeNull();
                }
                const tabindex = await host.getAttribute('tabindex');
                expect(tabindex, `Custom element should have tabindex`).not.toBeNull();
              } else {
                const inputSelector = `input[type="${rule.hasNativeInput}"]`;
                const nativeInput = host.locator(inputSelector);
                const inputCount = await nativeInput.count();
                expect(inputCount, `Host "${rule.selector}" should contain native input matching "${inputSelector}"`).toBeGreaterThan(0);
              }
              break;
            }

            case 'combobox-listbox': {
              const combobox = host.locator('[role="combobox"]');
              const comboCount = await combobox.count();
              expect(comboCount, `Host "${rule.selector}" should contain a combobox trigger element`).toBeGreaterThan(0);

              const firstCombo = combobox.first();
              const ariaExpanded = await firstCombo.getAttribute('aria-expanded');
              expect(ariaExpanded, `Combobox trigger should have aria-expanded`).not.toBeNull();

              const isExpanded = ariaExpanded === 'true';
              const ariaControls = await firstCombo.getAttribute('aria-controls');

              if (isExpanded && ariaControls) {
                const listbox = page.locator(`#${ariaControls}`);
                const listboxCount = await listbox.count();
                expect(listboxCount, `Associated listbox with id="${ariaControls}" should exist when expanded`).toBeGreaterThan(0);
              }
              break;
            }

            case 'datepicker': {
              const buttons = host.locator('button');
              const buttonCount = await buttons.count();
              expect(buttonCount, `Date picker should contain calendar day buttons`).toBeGreaterThan(0);

              const dayButtons = host.locator('button[aria-label]');
              const dayButtonsCount = await dayButtons.count();
              expect(dayButtonsCount, `Date picker should contain day buttons with aria-label`).toBeGreaterThan(0);

              for (let j = 0; j < Math.min(dayButtonsCount, 5); j++) {
                const btn = dayButtons.nth(j);
                expect(await btn.getAttribute('tabindex')).not.toBeNull();
                expect(await btn.getAttribute('aria-selected')).not.toBeNull();
              }
              break;
            }

            case 'popover': {
              const trigger = host.locator('.trigger');
              expect(await trigger.count()).toBeGreaterThan(0);
              const target = await trigger.getAttribute('popovertarget');
              expect(target, `Popover trigger should have a popovertarget attribute`).not.toBeNull();
              break;
            }

            case 'dialog': {
              const dialog = host.locator('dialog');
              if (await dialog.count() > 0) {
                const firstDialog = dialog.first();
                const tagName = await firstDialog.evaluate((el) => el.tagName.toLowerCase());
                expect(tagName).toBe('dialog');
              }
              break;
            }

            case 'progressbar': {
              const role = await host.getAttribute('role');
              expect(role, `Progress bar host should have role="progressbar"`).toBe('progressbar');
              const min = await host.getAttribute('aria-valuemin');
              expect(min, `Progress bar host should have aria-valuemin`).not.toBeNull();
              const max = await host.getAttribute('aria-valuemax');
              expect(max, `Progress bar host should have aria-valuemax`).not.toBeNull();
              break;
            }

            case 'tree': {
              const treeContainer = host.locator('.sh-tree-container');
              expect(await treeContainer.count(), `Tree container should have class "sh-tree-container"`).toBeGreaterThan(0);
              const containerRole = await treeContainer.first().getAttribute('role');
              expect(containerRole, `Tree container should have role="tree"`).toBe('tree');

              const nodes = treeContainer.first().locator('.sh-tree-node');
              const nodeCount = await nodes.count();
              if (nodeCount > 0) {
                for (let j = 0; j < Math.min(nodeCount, 3); j++) {
                  const node = nodes.nth(j);
                  const nodeRole = await node.getAttribute('role');
                  expect(nodeRole, `Tree nodes should have role="treeitem"`).toBe('treeitem');
                }
              }
              break;
            }

            case 'tooltip': {
              await host.hover().catch(() => {});
              await host.dispatchEvent('mouseenter').catch(() => {});
              const tooltip = page.locator('[role="tooltip"]');
              await tooltip.first().waitFor({ state: 'attached', timeout: 3000 }).catch(() => {});
              const tooltipCount = await tooltip.count();
              expect(tooltipCount, `Tooltip element with role="tooltip" should be present on hover`).toBeGreaterThan(0);
              
              await page.mouse.move(0, 0);
              await host.dispatchEvent('mouseleave').catch(() => {});
              await page.waitForTimeout(100);
              break;
            }

            case 'table': {
              const role = await host.getAttribute('role');
              expect(role, `Table host should have role="table"`).toBe('table');

              const rowgroups = host.locator('[role="rowgroup"]');
              expect(await rowgroups.count(), `Table should contain thead/tbody rowgroups`).toBeGreaterThan(0);

              const header = host.locator('[role="columnheader"], th');
              expect(await header.count(), `Table should contain column headers`).toBeGreaterThan(0);
              break;
            }

            case 'alert': {
              const role = await host.getAttribute('role');
              expect(role, `Alert should have role="alert" or role="status"`).toMatch(/^(alert|status)$/);
              break;
            }

            case 'status': {
              const role = await host.getAttribute('role');
              expect(role, `Status component should have role="status"`).toBe('status');
              const ariaBusy = await host.getAttribute('aria-busy');
              expect(ariaBusy, `Spinner/status should set aria-busy="true"`).toBe('true');
              break;
            }

            case 'separator': {
              const role = await host.getAttribute('role');
              expect(role, `Divider should have role="separator"`).toBe('separator');
              break;
            }

            case 'list': {
              const role = await host.getAttribute('role');
              expect(role, `List should have role="list"`).toBe('list');
              break;
            }

            case 'navigation': {
              // The sidenav component contains a sub-panel with the role or itself
              const role = await host.getAttribute('role');
              const hasNav = role === 'navigation' || (await host.locator('[role="navigation"], nav').count()) > 0;
              expect(hasNav, `Navigation component should have role="navigation"`).toBe(true);
              break;
            }

            case 'button': {
              const tagName = await host.evaluate((el) => el.tagName.toLowerCase());
              if (tagName !== 'button' && tagName !== 'a') {
                const role = await host.getAttribute('role');
                expect(role, `Custom button elements should have role="button"`).toBe('button');
                const tabindex = await host.getAttribute('tabindex');
                expect(tabindex, `Custom button elements should have tabindex`).not.toBeNull();
              }
              break;
            }

            case 'chip': {
              const isInteractive = await host.evaluate((el) => el.classList.contains('interactive') || el.hasAttribute('tabindex') || el.hasAttribute('click'));
              if (isInteractive) {
                const role = await host.getAttribute('role');
                expect(role, `Interactive chips should have role="button"`).toBe('button');
              }
              break;
            }

            case 'colorpicker': {
              const role = await host.getAttribute('role');
              expect(role, `Color picker should have role="slider" or role="group"`).toMatch(/^(slider|group)$/);
              const tabindex = await host.getAttribute('tabindex');
              expect(tabindex, `Color picker should be focusable via tabindex`).not.toBeNull();
              break;
            }

            case 'fileupload': {
              const fileInput = host.locator('input[type="file"]');
              expect(await fileInput.count(), `File upload should contain file input`).toBeGreaterThan(0);
              break;
            }

            case 'editor': {
              const editorArea = host.locator('.sh-editor-content');
              if (await editorArea.count() > 0) {
                const role = await editorArea.first().getAttribute('role');
                expect(role, `Editor content area should have role="textbox"`).toBe('textbox');
                const multiline = await editorArea.first().getAttribute('aria-multiline');
                expect(multiline, `Editor content area should be multiline`).toBe('true');
              }
              break;
            }

            case 'card': {
              // Structural card container
              break;
            }

            case 'icon': {
              const isHidden = await host.getAttribute('aria-hidden');
              const role = await host.getAttribute('role');
              expect(isHidden === 'true' || role === 'img', `Icons should have aria-hidden="true" or role="img"`).toBe(true);
              break;
            }

            case 'blueprint': {
              // Blueprint container should be present
              const canvas = host.locator('canvas');
              expect(await canvas.count(), `Blueprint must contain a canvas element`).toBeGreaterThan(0);
              break;
            }

            case 'event-card': {
              // Event card content and actions wrappers should exist
              const content = host.locator('.content');
              expect(await content.count(), `Event card must have a .content area`).toBeGreaterThan(0);
              break;
            }

            case 'form-field': {
              // Form field structure validation:
              // 1. Must contain an input or textarea
              const inputEl = host.locator('input, textarea');
              expect(await inputEl.count(), `Form field "${rule.selector}" must contain an input or textarea`).toBeGreaterThan(0);

              const inputId = await inputEl.first().getAttribute('id');
              expect(inputId, `Form field input/textarea must have an id`).not.toBeNull();

              // 2. Must contain a label referencing the input
              const labelEl = host.locator('label');
              if (await labelEl.count() > 0) {
                const labelFor = await labelEl.first().getAttribute('for');
                expect(labelFor, `Form field label must have a "for" attribute`).toBe(inputId);
              }

              // 3. If hint or error is present, input should have aria-describedby pointing to them
              const errorEl = host.locator('[error]');
              const hintEl = host.locator('[hint]');
              const describedBy = await inputEl.first().getAttribute('aria-describedby');

              if (await errorEl.count() > 0) {
                const errorId = await errorEl.first().getAttribute('id');
                expect(errorId, `Error element must have an id`).not.toBeNull();
                expect(describedBy, `Input should have aria-describedby for error`).toContain(errorId);
              }

              if (await hintEl.count() > 0) {
                const hintId = await hintEl.first().getAttribute('id');
                expect(hintId, `Hint element must have an id`).not.toBeNull();
                expect(describedBy, `Input should have aria-describedby for hint`).toContain(hintId);
              }
              break;
            }

            case 'sortable': {
              // Sortable container should have draggable children
              const draggables = host.locator('[draggable]');
              const dragCount = await draggables.count();
              if (dragCount > 0) {
                for (let j = 0; j < Math.min(dragCount, 3); j++) {
                  const draggable = draggables.nth(j);
                  const isDraggable = await draggable.getAttribute('draggable');
                  expect(isDraggable, `Draggable item in sortable must have draggable="true"`).toBe('true');
                }
              }
              break;
            }

            case 'input-mask': {
              // Should be applied to an input element
              const tagName = await host.evaluate((el) => el.tagName.toLowerCase());
              expect(tagName, `Input mask must be applied to an input element`).toBe('input');
              break;
            }

            case 'keybinding': {
              // Should have aria-keyshortcuts set at runtime
              const shortcuts = await host.getAttribute('aria-keyshortcuts');
              expect(shortcuts, `Element with keybinding must have aria-keyshortcuts`).not.toBeNull();
              expect(shortcuts?.length).toBeGreaterThan(0);
              break;
            }

            case 'virtual-scroll': {
              // Viewport container needs tabindex="0" for keyboard scrollability
              const viewport = host.locator('.viewport');
              expect(await viewport.count(), `Virtual scroll must have a .viewport container`).toBeGreaterThan(0);
              const tabIndex = await viewport.getAttribute('tabindex');
              expect(tabIndex, `Virtual scroll viewport must have tabindex="0"`).toBe('0');
              break;
            }

            case 'kbd': {
              // Verify text content is not empty
              const text = await host.innerText();
              expect(text.trim().length, `Keyboard display should have text content`).toBeGreaterThan(0);
              break;
            }

            case 'theme-toggle': {
              // Icon-only theme toggle button needs an aria-label
              const btn = host.locator('button');
              expect(await btn.count(), `Theme toggle should contain a button`).toBeGreaterThan(0);
              const ariaLabel = await btn.getAttribute('aria-label');
              expect(ariaLabel, `Theme toggle button must have an aria-label`).not.toBeNull();
              expect(ariaLabel?.trim().length).toBeGreaterThan(0);
              break;
            }

            case 'toggle-card': {
              // Collapsable card trigger needs role="button", tabindex="0", and aria-expanded
              const trigger = host.locator('> h3');
              expect(await trigger.count(), `Toggle card must have an interactive h3 trigger`).toBeGreaterThan(0);
              
              const role = await trigger.getAttribute('role');
              expect(role, `Toggle card trigger must have role="button"`).toBe('button');

              const isDisabled = await trigger.getAttribute('aria-disabled') === 'true';
              if (!isDisabled) {
                const tabIndex = await trigger.getAttribute('tabindex');
                expect(tabIndex, `Toggle card trigger must have tabindex="0"`).toBe('0');

                const isExpanded = await host.evaluate((el) => el.classList.contains('active'));
                const ariaExpanded = await trigger.getAttribute('aria-expanded');
                expect(ariaExpanded, `Toggle card trigger must have aria-expanded`).toBe(isExpanded ? 'true' : 'false');
              }
              break;
            }
          }
        }
      }
    });
  }
});
