export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type UserRole = 'SuperAdmin' | 'Admin' | 'Moderator' | 'Voter' | 'Observer';
export type UserStatus = 'Active' | 'Inactive';
export interface User {
  id: string;
  tenant_id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  identification?: string;
  coefficient: number;
  role: UserRole;
  status: UserStatus;
  created_at: number;
}
export type AssemblyStatus = 'Draft' | 'Scheduled' | 'Active' | 'Completed' | 'Cancelled';
export interface Assembly {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  scheduled_start: number;
  scheduled_end?: number;
  status: AssemblyStatus;
  polls: Poll[];
  participant_ids: string[];
  quorum_required: number;
  created_at: number;
}
export type PollType = 'single' | 'multiple';
export type PollStatus = 'draft' | 'visible' | 'open' | 'closed' | 'finalized';
export interface PollOption {
  id: string;
  text: string;
}
export interface Poll {
  id: string;
  assembly_id: string;
  title: string;
  description?: string;
  poll_type: PollType;
  options: PollOption[];
  min_selections: number;
  max_selections: number;
  is_secret?: boolean;
  status: PollStatus;
  created_at: number;
}
export interface Participant {
  id: string;
  full_name: string;
  coefficient: number;
  is_present: boolean;
}
export interface Vote {
  id: string; // composite key poll_id:user_id
  poll_id: string;
  user_id: string;
  tenant_id: string;
  selections: string[]; // array of option IDs
  coefficient_used: number;
  voted_at: number;
}
export interface AssemblyState {
  id: string; // assembly_id
  active_poll_id: string | null;
  participants: Participant[];
  present_coefficient: number;
  total_coefficient: number;
  votes: Record<string, Record<string, string[]>>; // { [pollId]: { [userId]: selection[] } }
}
export interface Proxy {
  id: string;
  assembly_id: string;
  tenant_id: string;
  delegator_id: string; // User who gives the vote
  delegate_id: string; // User who receives the vote
  status: 'active' | 'revoked';
  granted_at: number;
}
export interface OptionResult {
  option_id: string;
  text: string;
  vote_count: number;
  coefficient_total: number;
}
export interface PollResult {
  poll_id: string;
  title: string;
  total_votes: number;
  total_coefficient_voted: number;
  results: OptionResult[];
  is_secret: boolean;
}
export interface AuthStore {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}
export type AuditLogAction =
  | 'USER_LOGIN' | 'USER_REGISTER' | 'USER_CREATE' | 'USER_UPDATE' | 'USER_DELETE' | 'USER_BATCH_IMPORT'
  | 'ASSEMBLY_CREATE' | 'ASSEMBLY_UPDATE' | 'ASSEMBLY_DELETE' | 'ASSEMBLY_START' | 'ASSEMBLY_END'
  | 'POLL_ACTIVATE' | 'POLL_CLOSE'
  | 'PROXY_CREATE' | 'PROXY_DELETE'
  | 'VOTE_CAST';
export interface AuditLog {
  id: string;
  tenant_id: string;
  actor_id: string; // User ID of who performed the action
  actor_name: string; // User name
  action: AuditLogAction;
  target_id: string; // ID of the entity that was affected (e.g., user ID, assembly ID)
  target_type: string; // e.g., 'User', 'Assembly'
  details: Record<string, any>; // Additional context
  timestamp: number;
}
export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  created_at: number;
  status: 'active' | 'inactive';
}