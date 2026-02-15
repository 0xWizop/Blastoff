export const DOCS_NAV = [
  { slug: 'launch-mechanism', label: 'Launch mechanism' },
  { slug: 'create-token', label: 'Create token' },
  { slug: 'tokens-api', label: 'Tokens API' },
  { slug: 'launch-api', label: 'Launch API' },
  { slug: 'swap-api', label: 'Swap & quote' },
  { slug: 'other-apis', label: 'Other endpoints' },
  { slug: 'networks', label: 'Networks & contracts' },
] as const;

export const DOCS_FIRST_SLUG = DOCS_NAV[0].slug;

export function isDocsSection(slug: string): slug is (typeof DOCS_NAV)[number]['slug'] {
  return DOCS_NAV.some((n) => n.slug === slug);
}
