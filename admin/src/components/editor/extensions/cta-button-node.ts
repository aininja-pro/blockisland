import { Node, mergeAttributes } from '@tiptap/core'
import { showCtaButtonDialog } from './cta-button-dialog'

function extractStyle(style: string, prop: string): string | null {
  const match = style.match(new RegExp(prop + ':\\s*([^;]+)'))
  return match ? match[1].trim() : null
}

export interface CtaButtonOptions {
  HTMLAttributes: Record<string, string>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ctaButton: {
      setCtaButton: (attrs: { href: string; text: string; color?: string; borderRadius?: string }) => ReturnType
    }
  }
}

export const CtaButton = Node.create<CtaButtonOptions>({
  name: 'ctaButton',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      href: { default: null },
      text: { default: 'Click Here' },
      color: { default: 'rgb(41, 84, 126)' },
      borderRadius: { default: '1000em' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'p[data-cta-button]',
        getAttrs(node) {
          const el = node as HTMLElement
          const anchor = el.querySelector('a')
          if (!anchor) return false
          const style = anchor.getAttribute('style') || ''
          return {
            href: anchor.getAttribute('href'),
            text: anchor.textContent,
            color: extractStyle(style, 'background-color') || 'rgb(41, 84, 126)',
            borderRadius: extractStyle(style, 'border-radius') || '1000em',
          }
        },
      },
      {
        tag: 'p',
        getAttrs(node) {
          const el = node as HTMLElement
          const anchor = el.querySelector('a')
          if (!anchor) return false
          const style = anchor.getAttribute('style') || ''
          if (!style.includes('border-radius') || !style.includes('padding')) return false
          return {
            href: anchor.getAttribute('href'),
            text: anchor.textContent,
            color: extractStyle(style, 'background-color') || 'rgb(41, 84, 126)',
            borderRadius: extractStyle(style, 'border-radius') || '1000em',
          }
        },
        priority: 60,
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const { href, text, color, borderRadius } = node.attrs
    return [
      'p',
      mergeAttributes(HTMLAttributes, {
        style: 'text-align: center;',
        'data-cta-button': 'true',
      }),
      [
        'a',
        {
          href,
          style:
            `background-color: ${color}; border: initial; border-radius: ${borderRadius}; color: rgb(255, 255, 255); padding: 10px 16px; text-align: center; text-decoration: none; display: inline-block;`,
        },
        text,
      ],
    ]
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const wrapper = document.createElement('div')
      wrapper.style.textAlign = 'center'
      wrapper.style.padding = '8px 0'
      wrapper.contentEditable = 'false'

      const pill = document.createElement('span')
      pill.textContent = node.attrs.text
      pill.style.cssText =
        `background-color: ${node.attrs.color}; border-radius: ${node.attrs.borderRadius}; color: #fff; padding: 10px 16px; display: inline-block; cursor: pointer; font-size: 14px;`

      pill.addEventListener('click', async () => {
        if (typeof getPos !== 'function') return
        const result = await showCtaButtonDialog(node.attrs)
        if (!result) return

        const pos = getPos()
        if (pos === undefined) return

        editor.view.dispatch(
          editor.view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...result })
        )
      })

      wrapper.appendChild(pill)

      return {
        dom: wrapper,
        update(updatedNode) {
          if (updatedNode.type.name !== 'ctaButton') return false
          pill.textContent = updatedNode.attrs.text
          pill.style.backgroundColor = updatedNode.attrs.color
          pill.style.borderRadius = updatedNode.attrs.borderRadius
          return true
        },
      }
    }
  },

  addCommands() {
    return {
      setCtaButton:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
    }
  },
})
