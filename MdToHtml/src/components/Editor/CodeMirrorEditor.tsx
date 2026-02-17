'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { githubLight } from '@uiw/codemirror-theme-github';
import { EditorView } from '@codemirror/view';

export interface CodeMirrorEditorProps {
  value: string;
  onChange: (val: string) => void;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  onCursorChange?: (line: number) => void;
  className?: string;
}

export interface CodeMirrorEditorHandle {
  scrollToLine: (line: number) => void;
  insertText: (text: string) => void;
  getSelection: () => string;
}

const CodeMirrorEditor = forwardRef<CodeMirrorEditorHandle, CodeMirrorEditorProps>(
  ({ value, onChange, onScroll, onCursorChange, className }, ref) => {
    const editorRef = useRef<ReactCodeMirrorRef>(null);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      scrollToLine: (line: number) => {
        const view = editorRef.current?.view;
        if (!view) return;

        // CodeMirror lines are 1-indexed
        // Ensure line is within bounds
        const doc = view.state.doc;
        const targetLine = Math.max(1, Math.min(line, doc.lines));
        
        const lineInfo = doc.line(targetLine);
        
        view.dispatch({
          effects: EditorView.scrollIntoView(lineInfo.from, {
            y: 'center'
          })
        });
      },
      insertText: (text: string) => {
        const view = editorRef.current?.view;
        if (!view) return;
        const selection = view.state.selection.main;
        view.dispatch({
          changes: { from: selection.from, to: selection.to, insert: text },
          selection: { anchor: selection.from + text.length }
        });
      },
      getSelection: () => {
        const view = editorRef.current?.view;
        if (!view) return '';
        const selection = view.state.selection.main;
        return view.state.sliceDoc(selection.from, selection.to);
      }
    }));

    // Handle Editor Updates (Scroll & Selection)
    const handleUpdate = (viewUpdate: any) => {
      // 1. Scroll Sync
      if (viewUpdate.geometryChanged && onScroll) {
        const view = viewUpdate.view;
        const scrollDOM = view.scrollDOM;
        onScroll(scrollDOM.scrollTop, scrollDOM.scrollHeight, scrollDOM.clientHeight);
      }

      // 2. Cursor Sync
      if (viewUpdate.selectionSet && onCursorChange) {
        const view = viewUpdate.view;
        const mainSelection = view.state.selection.main;
        const line = view.state.doc.lineAt(mainSelection.head).number;
        onCursorChange(line);
      }
    };

    return (
      <div className={`relative h-full text-base ${className}`}>
        <CodeMirror
          ref={editorRef}
          value={value}
          height="100%"
          extensions={[
            markdown({ base: markdownLanguage, codeLanguages: languages }),
            EditorView.lineWrapping,
            EditorView.theme({
              '.cm-content': { paddingBottom: '80vh' },
              '.cm-scroller': { overflow: 'auto' },
            }),
          ]}
          onChange={onChange}
          onUpdate={handleUpdate}
          theme={githubLight}
          className="h-full border-none outline-none text-base"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: false,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </div>
    );
  }
);

CodeMirrorEditor.displayName = 'CodeMirrorEditor';

export { CodeMirrorEditor };
