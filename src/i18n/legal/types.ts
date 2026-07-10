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

export type LegalSubsection = {
  title: string;
  paragraphs?: string[];
  bullets?: LegalBullet[];
};

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: LegalBullet[];
  subsections?: LegalSubsection[];
  contact?: LegalContact;
};

export type LegalDocument = {
  eyebrow: string;
  title: string;
  intro: string[];
  sections: LegalSection[];
  copyright?: string;
};
