import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameKeyboard } from '@/hooks/useGameKeyboard';

function dispatchKeyDown(
  key: string,
  target: EventTarget = document.body,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, ...init });
  Object.defineProperty(event, 'target', { value: target });
  window.dispatchEvent(event);
  return event;
}

describe('useGameKeyboard', () => {
  const onInput = vi.fn();
  let unmount = () => {};

  beforeEach(() => {
    onInput.mockReset();
  });

  afterEach(() => {
    unmount();
  });

  it('maps letter keys to uppercase Polish keyboard input', () => {
    ({ unmount } = renderHook(() => useGameKeyboard(onInput)));

    dispatchKeyDown('a');
    dispatchKeyDown('ł');

    expect(onInput).toHaveBeenCalledTimes(2);
    expect(onInput).toHaveBeenNthCalledWith(1, 'A');
    expect(onInput).toHaveBeenNthCalledWith(2, 'Ł');
  });

  it('maps Enter and Backspace', () => {
    ({ unmount } = renderHook(() => useGameKeyboard(onInput)));

    dispatchKeyDown('Enter');
    dispatchKeyDown('Backspace');

    expect(onInput).toHaveBeenCalledWith('Enter');
    expect(onInput).toHaveBeenCalledWith('Backspace');
  });

  it('ignores unsupported keys', () => {
    ({ unmount } = renderHook(() => useGameKeyboard(onInput)));

    dispatchKeyDown('1');
    dispatchKeyDown('Tab');

    expect(onInput).not.toHaveBeenCalled();
  });

  it('does not listen when disabled', () => {
    ({ unmount } = renderHook(() => useGameKeyboard(onInput, { enabled: false })));

    dispatchKeyDown('a');

    expect(onInput).not.toHaveBeenCalled();
  });

  it('ignores modified shortcut keys', () => {
    ({ unmount } = renderHook(() => useGameKeyboard(onInput)));

    dispatchKeyDown('c');
    dispatchKeyDown('c', document.body, { ctrlKey: true });
    dispatchKeyDown('r', document.body, { metaKey: true });

    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onInput).toHaveBeenCalledWith('C');
  });

  it('accepts Polish diacritics typed with alt/option', () => {
    ({ unmount } = renderHook(() => useGameKeyboard(onInput)));

    dispatchKeyDown('ą', document.body, { altKey: true });
    dispatchKeyDown('ś', document.body, { altKey: true });

    expect(onInput).toHaveBeenCalledTimes(2);
    expect(onInput).toHaveBeenNthCalledWith(1, 'Ą');
    expect(onInput).toHaveBeenNthCalledWith(2, 'Ś');
  });

  it('ignores keydown when focus is in an input', () => {
    ({ unmount } = renderHook(() => useGameKeyboard(onInput)));

    const input = document.createElement('input');
    document.body.append(input);
    dispatchKeyDown('a', input);
    input.remove();

    expect(onInput).not.toHaveBeenCalled();
  });
});
