/** Google Fonts CSS URL for a family: the whole family (the weights the type scale uses) or only the glyphs of `text`. */
export function googleFontUrl(family: string, text?: string): string {
  const name = encodeURIComponent(family).replace(/%20/g, '+');
  const params = text ? `family=${name}&text=${encodeURIComponent(text)}` : `family=${name}:wght@500;600`;
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
