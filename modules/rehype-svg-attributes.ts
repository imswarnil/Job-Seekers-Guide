/**
 * Give hand-written SVG in lessons its real attribute names back.
 *
 * The markdown pipeline stores element properties the way hast does, in
 * camelCase: `text-anchor` becomes `textAnchor`, `font-size` becomes
 * `fontSize`, `stroke-width` becomes `strokeWidth`. The renderer then writes
 * those names straight onto the element, and a browser ignores a `textAnchor`
 * attribute on `<text>`. Every `::diagram` lost its centring, its type sizes,
 * its line weights and its dashes to this, silently.
 *
 * So, inside an `<svg>` only, turn camelCase property names back into the
 * hyphenated attributes SVG actually defines. The handful of SVG attributes
 * that genuinely are camelCase (`viewBox` and friends) are left alone, and so
 * are `data*` / `aria*` / `className`, which the renderer already handles.
 */

interface Node {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: Node[]
}

/** SVG attributes whose real name is camelCase. */
const CAMEL = new Set([
  'viewBox', 'preserveAspectRatio', 'gradientUnits', 'gradientTransform',
  'markerWidth', 'markerHeight', 'markerUnits', 'refX', 'refY',
  'patternUnits', 'patternContentUnits', 'patternTransform', 'textLength',
  'lengthAdjust', 'startOffset', 'spreadMethod', 'stdDeviation', 'pathLength',
  'clipPathUnits', 'maskUnits', 'maskContentUnits', 'filterUnits',
  'primitiveUnits', 'baseFrequency', 'numOctaves', 'attributeName',
  'repeatCount', 'keyTimes', 'keySplines', 'calcMode', 'tableValues'
])

function isKept(name: string) {
  return CAMEL.has(name) || name === 'className' || /^(data|aria)[A-Z]/.test(name) || !/[A-Z]/.test(name)
}

function fix(node: Node, inSvg: boolean) {
  const svg = inSvg || node.tagName === 'svg'

  if (svg && node.type === 'element' && node.properties) {
    const properties: Record<string, unknown> = {}
    for (const [name, value] of Object.entries(node.properties)) {
      if (isKept(name)) {
        properties[name] = value
        continue
      }
      const attribute = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
      // hast splits list-valued attributes (`stroke-dasharray="4 3"`) into
      // arrays; an attribute wants the string back.
      properties[attribute] = Array.isArray(value) ? value.join(' ') : value
    }
    node.properties = properties
  }

  for (const child of node.children || []) {
    fix(child, svg)
  }
}

export default function rehypeSvgAttributes() {
  return (tree: Node) => fix(tree, false)
}
