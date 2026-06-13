export interface UserProfile {
  uid: string;
  username: string; // custom alias
  displayName: string;
}

export interface Certificate {
  id?: string;
  title: string;
  category: string;
  date: string;
  imageUrl: string;
  fileType?: string;
  credentialUrl?: string;
  description?: string;
  isFeatured?: boolean;
  createdAt?: number;
  userId?: string;
  userName?: string;
  issuingOrganization?: string;
  issueMonth?: string;
  issueYear?: string;
  hasExpiration?: boolean;
  expirationMonth?: string;
  expirationYear?: string;
  credentialId?: string;
  skills?: string;
}

export const CATEGORIES = [
  "Profesional",
  "Kursus & Pelatihan",
  "Magang",
  "Bahasa",
  "Kompetisi",
  "Organisasi",
  "Seminar & Workshop",
  "Akademik"
];
