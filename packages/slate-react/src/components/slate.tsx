import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { Node, Element, Descendant } from 'slate'

import { ReactEditor } from '../plugin/react-editor'
import { FocusedContext } from '../hooks/use-focused'
import { EditorContext } from '../hooks/use-slate-static'
import { SlateContext } from '../hooks/use-slate'
import { EDITOR_TO_ON_CHANGE } from '../utils/weak-maps'
import { useIsomorphicLayoutEffect } from '../hooks/use-isomorphic-layout-effect'

/**
 * A wrapper around the provider to handle `onChange` events, because the editor
 * is a mutable singleton so it won't ever register as "changed" otherwise.
 */

export const Slate = (props: {
  editor: ReactEditor
  value: Descendant[]
  children: React.ReactNode
  onChange: (value: Descendant[]) => void
}) => {
  const { editor, children, onChange, value, ...rest } = props
  const [key, setKey] = useState(0)
  const context: [ReactEditor] = useMemo(() => {
    editor.children = value
    Object.assign(editor, rest)
    return [editor]
  }, [key, value, ...Object.values(rest)])

  const onContextChange = useCallback(() => {
    onChange(editor.children)
    setKey(key + 1)
  }, [key, onChange])

  EDITOR_TO_ON_CHANGE.set(editor, onContextChange)

  useEffect(() => {
    return () => {
      EDITOR_TO_ON_CHANGE.set(editor, () => {})
    }
  }, [])

  const [isFocused, setIsFocused] = useState(ReactEditor.isFocused(editor))

  useEffect(() => {
    setIsFocused(ReactEditor.isFocused(editor))
  })

  const focusHandler = useCallback(() => {
    setIsFocused(ReactEditor.isFocused(editor))
  }, [])

  useIsomorphicLayoutEffect(() => {
    document.addEventListener('focus', focusHandler, true)

    return () => {
      document.removeEventListener('focus', focusHandler, true)
    }
  }, [focusHandler])

  const blurHandler = useCallback(() => {
    setIsFocused(ReactEditor.isFocused(editor))
  }, [])

  useIsomorphicLayoutEffect(() => {
    document.addEventListener('blur', blurHandler, true)

    return () => {
      document.removeEventListener('blur', blurHandler, true)
    }
  }, [blurHandler])

  return (
    <SlateContext.Provider value={context}>
      <EditorContext.Provider value={editor}>
        <FocusedContext.Provider value={isFocused}>
          {children}
        </FocusedContext.Provider>
      </EditorContext.Provider>
    </SlateContext.Provider>
  )
}
