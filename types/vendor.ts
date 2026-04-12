export interface Vendor {
  id: string;
  user_id: string;
  category: string;
  name: string;
  planned_cost: number;
  actual_cost: number;
  downpayment: number;
  created_at?: string;
}
