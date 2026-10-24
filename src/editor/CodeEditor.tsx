import { markdown } from '@codemirror/lang-markdown';
import { xml } from '@codemirror/lang-xml';
import { Compartment, EditorState, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface CodeEditorHandle {
  insert: (text: string) => void;
  focus: () => void;
}

interface CodeEditorProps {
  value: string;
  format: 'xaml' | 'md';
  onChange: (value: string) => void;
}

function wrapSelection(view: EditorView, marker: string): boolean {
  const { state } = view;
  const { from, to } = state.selection.main;
  const selected = state.sliceDoc(from, to) || '文本';
  view.dispatch({
    changes: { from, to, insert: `${marker}${selected}${marker}` },
    selection: { anchor: from + marker.length, head: from + marker.length + selected.length },
  });
  return true;
}

const markdownShortcuts = Prec.high(
  keymap.of([
    { key: 'Mod-b', run: (view) => wrapSelection(view, '**') },
    { key: 'Mod-i', run: (view) => wrapSelection(view, '*') },
    { key: 'Mod-e', run: (view) => wrapSelection(view, '`') },
    { key: 'Mod-s', run: () => true },
  ]),
);

function currentTheme() {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'dark') return oneDark;
  if (explicit === 'light') return [];
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? oneDark : [];
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  { value, format, onChange },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartment = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current) return;
    const language = format === 'md' ? markdown() : xml();
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          markdownShortcuts,
          language,
          themeCompartment.current.of(currentTheme()),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
      parent: hostRef.current,
    });
    viewRef.current = view;

    const observer = new MutationObserver(() => {
      view.dispatch({
        effects: themeCompartment.current.reconfigure(currentTheme()),
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      observer.disconnect();
      view.destroy();
      viewRef.current = null;
    };
    // Recreate only when the edited document identity or format changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  useImperativeHandle(ref, () => ({
    insert: (text: string) => {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
        scrollIntoView: true,
      });
      view.focus();
    },
    focus: () => viewRef.current?.focus(),
  }));

  return <div className="code-editor" ref={hostRef} />;
});

