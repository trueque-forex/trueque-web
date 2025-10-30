export interface Recipient {
  name: string;
  email: string;
  country: string;
}

export interface RecipientProfile {
  name: string;
  email: string;
  country: string;
}

export interface Transaction {
  amount: number;
  currency: string;
  recipient: RecipientProfile;
}
