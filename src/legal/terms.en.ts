import type { LegalDocument } from './types';

const termsEn: LegalDocument = {
  eyebrow: 'Terms of Service',
  title: 'Terms of Service',
  lastUpdated: 'July 7, 2026',
  intro: [
    'Welcome to Asterism ("the Service"). By accessing or using asterism.pics, users agree to be bound by these Terms of Service. If users do not agree to these Terms, they should not use the Service.'
  ],
  sections: [
    {
      title: '1. The Service',
      paragraphs: [
        'The Service is an image and aesthetic discovery platform offering features such as browsing and saving images, building personal moodboards, and style quizzes. The Service may add, modify, or discontinue some or all features at any time.'
      ]
    },
    {
      title: '2. Accounts and Registration',
      bullets: [
        'Users may register with an email address or sign in through third-party services such as Google or LINE.',
        'Users must provide accurate and complete information and are responsible for all activities under their accounts.',
        'Users are responsible for keeping their login credentials secure. If users discover any unauthorized use of their accounts, they should notify the Service immediately.'
      ]
    },
    {
      title: '3. User Responsibilities',
      paragraphs: ['Users must not:'],
      bullets: [
        'Violate any law or infringe the rights of others, including but not limited to intellectual property rights.',
        'Upload or distribute malware, spam, or unlawful content.',
        'Scrape data at scale through automated means, or interfere with or disrupt the normal operation of the Service.'
      ]
    },
    {
      title: '4. Content and Intellectual Property',
      paragraphs: [
        "Unless otherwise stated, the Service's interface, trademarks, text, layout design, data arrangement, and related materials are protected by intellectual property laws.",
        'AI-generated images in this project are used solely for educational and non-commercial demonstration purposes. The Service does not claim rights in such AI-generated images beyond the extent permitted by applicable law.',
        'Rights to image materials, where owned by third parties or respective rights holders, remain with their lawful owners. Users may use such content only within the scope permitted by the Service.'
      ]
    },
    {
      title: '5. AI-generated Content Disclaimer',
      paragraphs: [
        'Images in this project may include AI-generated content and are used solely for educational and non-commercial demonstration purposes.',
        'They are intended as visual style references only and do not represent real people, real idols, real brands, or real commercial campaigns.'
      ]
    },
    {
      title: '6. Third-Party Services',
      paragraphs: [
        "The Service integrates third-party services including Supabase, Google, LINE, and Resend. Users' use of these third-party services may also be governed by their respective terms and policies."
      ]
    },
    {
      title: '7. Disclaimer',
      paragraphs: [
        'The Service is provided "as is" without warranty that it will be uninterrupted, secure, error-free, or meet users\' specific requirements.',
        "To the maximum extent permitted by law, the Service shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from users' use of, or inability to use, the Service."
      ]
    },
    {
      title: '8. Suspension and Termination',
      paragraphs: [
        'If users violate these Terms, the Service may suspend or terminate their access and reserves the right to pursue any related remedies.'
      ]
    },
    {
      title: '9. Changes to These Terms',
      paragraphs: [
        'The Service may update these Terms from time to time and will post any changes on this page.',
        'Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.'
      ]
    },
    {
      title: '10. Contact Us',
      contact: {
        prefix: 'If users have any questions about these Terms, please contact:',
        email: 'asterism.f2e@gmail.com',
        suffix: '.'
      }
    }
  ],
  copyright: '© 2026 Asterism'
};

export default termsEn;
