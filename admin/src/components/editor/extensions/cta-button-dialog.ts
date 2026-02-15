export interface CtaButtonValues {
  text: string
  href: string
  color: string
  borderRadius: string
}

const DEFAULTS: CtaButtonValues = {
  text: '',
  href: 'https://',
  color: '#29547e',
  borderRadius: '1000em',
}

export function showCtaButtonDialog(
  current?: Partial<CtaButtonValues>,
): Promise<CtaButtonValues | null> {
  const vals = { ...DEFAULTS, ...current }
  const isEdit = !!current?.text

  return new Promise((resolve) => {
    // Use a div overlay instead of native <dialog> to avoid stealing
    // top-layer focus from the parent Radix Dialog (listing editor).
    const overlay = document.createElement('div')
    overlay.style.cssText =
      'position: fixed; inset: 0; z-index: 99999; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.4);'

    const panel = document.createElement('div')
    panel.style.cssText =
      'background: white; border-radius: 12px; padding: 0; box-shadow: 0 25px 50px -12px rgba(0,0,0,.25); max-width: 420px; width: 90vw;'

    panel.innerHTML = `
      <form style="padding: 24px; font-family: system-ui, sans-serif;">
        <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600;">
          ${isEdit ? 'Edit' : 'Insert'} CTA Button
        </h3>

        <label style="display: block; margin-bottom: 16px;">
          <span style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Button text</span>
          <input name="text" value="${escAttr(vals.text)}" required
            style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;" />
        </label>

        <label style="display: block; margin-bottom: 16px;">
          <span style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 4px;">URL</span>
          <input name="href" type="url" value="${escAttr(vals.href)}" required
            style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;" />
        </label>

        <div style="display: flex; gap: 16px; margin-bottom: 16px;">
          <label style="flex: 1;">
            <span style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Color</span>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input name="colorPicker" type="color" value="${toHex(vals.color)}"
                style="width: 40px; height: 36px; padding: 2px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;" />
              <input name="color" value="${escAttr(vals.color)}"
                style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;" />
            </div>
          </label>

          <label style="flex: 1;">
            <span style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Border radius</span>
            <select name="borderRadius"
              style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; height: 38px; box-sizing: border-box;">
              <option value="1000em" ${vals.borderRadius === '1000em' ? 'selected' : ''}>Pill (rounded)</option>
              <option value="8px" ${vals.borderRadius === '8px' ? 'selected' : ''}>Rounded (8px)</option>
              <option value="4px" ${vals.borderRadius === '4px' ? 'selected' : ''}>Slight (4px)</option>
              <option value="0" ${vals.borderRadius === '0' ? 'selected' : ''}>Square</option>
            </select>
          </label>
        </div>

        <div id="cta-preview" style="text-align: center; padding: 16px 0; margin-bottom: 16px; background: #f9f9f9; border-radius: 8px;">
          <span id="cta-preview-btn" style="background-color: ${escAttr(vals.color)}; border-radius: ${escAttr(vals.borderRadius)}; color: #fff; padding: 10px 16px; display: inline-block; font-size: 14px;">
            ${escHtml(vals.text || 'Preview')}
          </span>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" id="cta-cancel"
            style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; font-size: 14px;">
            Cancel
          </button>
          <button type="submit"
            style="padding: 8px 16px; border: none; border-radius: 6px; background: #18181b; color: white; cursor: pointer; font-size: 14px; font-weight: 500;">
            ${isEdit ? 'Update' : 'Insert'}
          </button>
        </div>
      </form>
    `

    overlay.appendChild(panel)

    // Append inside the Radix dialog portal (if present) so we stay
    // within its focus trap. Fall back to document.body otherwise.
    const radixDialog = document.querySelector('[role="dialog"][data-state="open"]')
    const host = radixDialog ?? document.body
    host.appendChild(overlay)

    const form = panel.querySelector('form')!
    const textInput = form.elements.namedItem('text') as HTMLInputElement
    const hrefInput = form.elements.namedItem('href') as HTMLInputElement
    const colorInput = form.elements.namedItem('color') as HTMLInputElement
    const colorPicker = form.elements.namedItem('colorPicker') as HTMLInputElement
    const radiusSelect = form.elements.namedItem('borderRadius') as HTMLSelectElement
    const previewBtn = panel.querySelector('#cta-preview-btn') as HTMLElement
    const cancelBtn = panel.querySelector('#cta-cancel')!

    function updatePreview() {
      previewBtn.textContent = textInput.value || 'Preview'
      previewBtn.style.backgroundColor = colorInput.value
      previewBtn.style.borderRadius = radiusSelect.value
    }

    textInput.addEventListener('input', updatePreview)
    colorInput.addEventListener('input', () => {
      colorPicker.value = toHex(colorInput.value)
      updatePreview()
    })
    colorPicker.addEventListener('input', () => {
      colorInput.value = colorPicker.value
      updatePreview()
    })
    radiusSelect.addEventListener('change', updatePreview)

    function cleanup(result: CtaButtonValues | null) {
      overlay.remove()
      resolve(result)
    }

    // Close on backdrop click
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) cleanup(null)
    })

    // Close on Escape
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        cleanup(null)
      }
    }
    overlay.addEventListener('keydown', onKeyDown)

    cancelBtn.addEventListener('click', () => cleanup(null))

    form.addEventListener('submit', (e) => {
      e.preventDefault()
      cleanup({
        text: textInput.value,
        href: hrefInput.value,
        color: colorInput.value,
        borderRadius: radiusSelect.value,
      })
    })

    textInput.focus()
    textInput.select()
  })
}

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function toHex(color: string): string {
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) return color
  const m = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (!m) return '#29547e'
  return '#' + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, '0')).join('')
}
