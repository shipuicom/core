export interface ParsedKeybinding {
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  key?: string;
  code?: string;
}

/**
 * Parses a keybinding shortcut string shorthand into a structured ParsedKeybinding object.
 * Supporting modifiers: ctrlOrCmd (OS adaptive), ctrl, cmd/meta, alt/option, shift.
 */
export function parseKeybinding(shorthand: string, isMacPlatform: boolean): ParsedKeybinding {
  const parts = shorthand.split('+').map(p => p.trim().toLowerCase());
  
  let ctrlKey = false;
  let metaKey = false;
  let altKey = false;
  let shiftKey = false;
  
  // The last part is the key/code
  const keyPart = parts[parts.length - 1] || '';
  
  // Parse any preceding parts as modifier keys
  for (let i = 0; i < parts.length - 1; i++) {
    const modifier = parts[i];
    if (modifier === 'ctrlorcmd') {
      if (isMacPlatform) {
        metaKey = true;
      } else {
        ctrlKey = true;
      }
    } else if (modifier === 'ctrl') {
      ctrlKey = true;
    } else if (modifier === 'meta' || modifier === 'cmd') {
      metaKey = true;
    } else if (modifier === 'alt' || modifier === 'option') {
      altKey = true;
    } else if (modifier === 'shift') {
      shiftKey = true;
    }
  }
  
  let key: string | undefined;
  let code: string | undefined;
  
  if (keyPart.startsWith('key') || keyPart.startsWith('digit')) {
    code = keyPart; // Matches event.code (case-insensitive)
  } else {
    // Map standard key names to event.key representation
    if (keyPart === 'enter') {
      key = 'enter';
    } else if (keyPart === 'esc' || keyPart === 'escape') {
      key = 'escape';
    } else if (keyPart === 'space') {
      key = ' ';
    } else if (keyPart === 'tab') {
      key = 'tab';
    } else if (keyPart === 'backspace') {
      key = 'backspace';
    } else if (keyPart === 'delete') {
      key = 'delete';
    } else if (keyPart === 'up' || keyPart === 'arrowup') {
      key = 'arrowup';
    } else if (keyPart === 'down' || keyPart === 'arrowdown') {
      key = 'arrowdown';
    } else if (keyPart === 'left' || keyPart === 'arrowleft') {
      key = 'arrowleft';
    } else if (keyPart === 'right' || keyPart === 'arrowright') {
      key = 'arrowright';
    } else if (keyPart === 'home') {
      key = 'home';
    } else if (keyPart === 'end') {
      key = 'end';
    } else if (keyPart === 'pageup') {
      key = 'pageup';
    } else if (keyPart === 'pagedown') {
      key = 'pagedown';
    } else {
      key = keyPart; // Raw key name
    }
  }
  
  return { ctrlKey, metaKey, altKey, shiftKey, key, code };
}

/**
 * Checks if a KeyboardEvent matches a ParsedKeybinding structure.
 */
export function matchKeybinding(event: KeyboardEvent, parsed: ParsedKeybinding): boolean {
  if (event.ctrlKey !== parsed.ctrlKey) return false;
  if (event.metaKey !== parsed.metaKey) return false;
  if (event.altKey !== parsed.altKey) return false;
  if (event.shiftKey !== parsed.shiftKey) return false;
  
  if (parsed.code) {
    return event.code.toLowerCase() === parsed.code;
  }
  if (parsed.key) {
    if (parsed.key === ' ') {
      return event.key === ' ' || event.key === 'Spacebar';
    }
    return event.key.toLowerCase() === parsed.key;
  }
  
  return false;
}

/**
 * Formats a shorthand shortcut string into an OS-specific user-friendly string for display.
 * E.g. 'ctrlOrCmd+Shift+KeyK' -> '⌘⇧K' on macOS, and 'Ctrl+Shift+K' on Windows/Linux.
 */
export function formatShortcut(shorthand: string, isMacPlatform: boolean): string {
  const parts = shorthand.split('+').map(p => p.trim());
  const formattedParts: string[] = [];
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const lowerPart = part.toLowerCase();
    
    if (i < parts.length - 1) {
      if (lowerPart === 'ctrlorcmd') {
        formattedParts.push(isMacPlatform ? '⌘' : 'Ctrl');
      } else if (lowerPart === 'ctrl') {
        formattedParts.push(isMacPlatform ? '⌃' : 'Ctrl');
      } else if (lowerPart === 'meta' || lowerPart === 'cmd') {
        formattedParts.push(isMacPlatform ? '⌘' : 'Win');
      } else if (lowerPart === 'alt' || lowerPart === 'option') {
        formattedParts.push(isMacPlatform ? '⌥' : 'Alt');
      } else if (lowerPart === 'shift') {
        formattedParts.push(isMacPlatform ? '⇧' : 'Shift');
      }
    } else {
      // Key/code part
      if (lowerPart.startsWith('key')) {
        formattedParts.push(part.substring(3).toUpperCase()); // E.g. KeyA -> A
      } else if (lowerPart.startsWith('digit')) {
        formattedParts.push(part.substring(5)); // E.g. Digit1 -> 1
      } else {
        // Capitalize first letter of standard keys
        const capitalized = part.charAt(0).toUpperCase() + part.slice(1);
        formattedParts.push(capitalized);
      }
    }
  }
  
  if (isMacPlatform) {
    return formattedParts.join('');
  } else {
    return formattedParts.join('+');
  }
}
