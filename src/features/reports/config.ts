/** Shared vocabulary for content reports (DSA notice-and-action). */
export const REPORT_TARGETS: Record<string, string> = {
  PROVIDER: 'Profiel',
  REVIEW: 'Beoordeling',
  MESSAGE: 'Gesprek',
  OTHER: 'Iets anders',
};

export const REPORT_REASONS: Record<string, string> = {
  ILLEGAL: 'Onwettige inhoud of activiteit',
  FRAUD: 'Fraude of misleiding',
  FAKE: 'Vals profiel of valse beoordeling',
  HARASSMENT: 'Intimidatie of haatdragende taal',
  IP: 'Inbreuk op auteursrecht of merk',
  PRIVACY: 'Schending van privacy',
  OTHER: 'Iets anders',
};
