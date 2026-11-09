import { describe, expect, it } from 'vitest';
import { creditsLine, REPO_URL } from '../src/ui/HomeMenu';

describe('title screen credits', () => {
  const html = creditsLine('1.2.3');

  it('links the version to its GitHub Release and shows the source and copyright', () => {
    expect(html).toContain(`href="${REPO_URL}/releases/tag/v1.2.3"`);
    expect(html).toContain('>v1.2.3</a>');
    expect(html).toContain(`href="${REPO_URL}"`);
    expect(html).toContain('© 2026 thearki');
  });

  it('opens links in a new tab without giving the page access to the game', () => {
    const links = html.match(/<a [^>]*>/g) ?? [];
    expect(links).toHaveLength(2);
    for (const a of links) expect(a).toContain('rel="noopener noreferrer"');
  });
});
