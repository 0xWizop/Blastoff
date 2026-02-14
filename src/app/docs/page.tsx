import { redirect } from 'next/navigation';
import { DOCS_FIRST_SLUG } from './docsNav';

export default function DocsPage() {
  redirect(`/docs/${DOCS_FIRST_SLUG}`);
}
