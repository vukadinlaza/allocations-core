export type Investment = {
  _id: string;
  user_id: string;
  deal_id: string;
  phase: string;
  dealtracker_record_id: string | null;
  investor_name: string | null;
  investor_email: string;
  committed_amount: number | null;
  transactions: [Transaction] | [];
  investor_type: string | null;
  investor_entity_name: string | null;
  investor_country: string | null;
  investor_state: string | null;
  accredited_investor_type: string | null;
};

type Transaction = {
  _id: string;
  committed_amount: number | null;
  wired_amount: number | null;
  wired_date: string | null;
};
