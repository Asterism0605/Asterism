import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LegalDocumentPage from '@/components/legal/LegalDocumentPage.vue';
import type { LegalDocument } from '@/i18n/legal/types';

const document: LegalDocument = {
  eyebrow: 'Policy',
  title: 'Test Policy',
  intro: ['Opening paragraph.'],
  sections: [
    {
      title: '1. Scope',
      paragraphs: ['Scope paragraph.'],
      bullets: [
        'Plain bullet.',
        {
          label: 'Labeled:',
          text: 'labeled bullet text.'
        }
      ],
      subsections: [
        {
          title: 'Details',
          paragraphs: ['Detail paragraph.']
        }
      ]
    },
    {
      title: '2. Contact',
      contact: {
        prefix: 'Email',
        email: 'hello@example.com',
        suffix: '.'
      }
    }
  ],
  copyright: 'Copyright line.'
};

describe('LegalDocumentPage', () => {
  it('renders shared legal document content', () => {
    const wrapper = mount(LegalDocumentPage, {
      props: {
        document,
        lastUpdated: {
          label: 'Last updated',
          date: 'July 7, 2026'
        }
      }
    });

    expect(wrapper.text()).toContain('Test Policy');
    expect(wrapper.text()).toContain('Last updated: July 7, 2026');
    expect(wrapper.text()).toContain('Opening paragraph.');
    expect(wrapper.text()).toContain('Labeled: labeled bullet text.');
    expect(wrapper.text()).toContain('Detail paragraph.');
    expect(wrapper.find('a[href="mailto:hello@example.com"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Copyright line.');
  });
});
