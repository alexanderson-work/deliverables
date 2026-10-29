/** Studio-wide details shown on every client space. */
export const studio = {
  name: "Alex Anderson",
  url: "https://alexanderson.work",
  email: "info@alexanderson.work",
  calendar: "https://cal.com/alexanderson.work/meeting",
  /** Shown with the contact link at the foot of the sidebar. */
  photo: "/studio/alex-anderson.jpg",
};

/** An email to the studio with the client named in the subject line. */
export const contactHref = (client: string) =>
  `mailto:${studio.email}?subject=${encodeURIComponent(`Question about ${client}`)}`;

export const siteTitle = "Deliverables";
