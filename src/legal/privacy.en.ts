import type { LegalDocument } from './types';

const privacyEn: LegalDocument = {
  eyebrow: 'Privacy Policy',
  title: 'Privacy Policy',
  lastUpdated: 'June 25, 2026',
  intro: [
    'Asterism ("the Service") respects your privacy. This policy explains how we collect, use, and protect your personal information when you use asterism.pics. By using the Service, you agree to the terms of this policy.'
  ],
  sections: [
    {
      title: '1. Information We Collect',
      bullets: [
        {
          label: 'Account information:',
          text: 'the email address you provide at sign-up. Passwords are encrypted and stored by Supabase Auth; the Service never has access to your plaintext password.'
        },
        {
          label: 'Third-party login information:',
          text: 'when you sign in with Google or LINE, we receive your email address, display name, and avatar to create and identify your account.'
        },
        {
          label: 'Usage data:',
          text: 'content you create in the Service, such as saved images, moodboards, and style-quiz results.'
        }
      ]
    },
    {
      title: '2. How We Use Your Information',
      bullets: [
        'To create and manage your account and provide sign-in and authentication.',
        'To send system emails such as account verification and password resets.',
        'To store and display your saved content and personalized style features.',
        'To maintain security, prevent abuse, and improve the experience.'
      ]
    },
    {
      title: '3. Third-Party Services',
      paragraphs: [
        'To provide the Service, we share certain data with the following third parties, each governed by its own privacy policy:'
      ],
      bullets: [
        { label: 'Supabase:', text: 'authentication and data storage.' },
        { label: 'Google, LINE:', text: 'third-party login (OAuth).' },
        { label: 'Resend:', text: 'delivery of system emails (e.g. verification).' }
      ]
    },
    {
      title: '4. Data Retention and Deletion',
      paragraphs: [
        'We retain the above information for as long as your account remains active. You may request access to, correction of, or deletion of your personal information at any time. When you delete your account, related personal data is removed, except where retention is required by law.'
      ]
    },
    {
      title: '5. Cookies and Local Storage',
      paragraphs: [
        'The Service uses browser local storage to keep your sign-in state (session) so you stay logged in. You can clear this data through your browser settings, though doing so may require you to sign in again.'
      ]
    },
    {
      title: '6. Your Rights',
      paragraphs: [
        'You have the right to access, correct, or delete your personal information, or to withdraw consent previously given. To exercise these rights, please contact us using the details below.'
      ]
    },
    {
      title: '7. Changes to This Policy',
      paragraphs: [
        'We may update this policy as the Service evolves. Updates will be posted on this page and the "Last updated" date will be revised accordingly.'
      ]
    },
    {
      title: '8. Contact Us',
      contact: {
        prefix: 'If you have any questions about this policy, please email',
        email: 'asterism.f2e@gmail.com',
        suffix: '.'
      }
    }
  ]
};

export default privacyEn;
