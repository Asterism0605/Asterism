export type LegalBullet =
  | string
  | {
      label: string;
      text: string;
    };

export type LegalContact = {
  prefix: string;
  email: string;
  suffix?: string;
};

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: LegalBullet[];
  contact?: LegalContact;
};

export type LegalDocument = {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro: string[];
  sections: LegalSection[];
  copyright?: string;
};
