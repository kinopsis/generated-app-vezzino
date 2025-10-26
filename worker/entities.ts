import { IndexedEntity, Entity } from "./core-utils";
import type { User, Assembly, AssemblyState, Vote, Proxy, AuditLog, Tenant } from "@shared/types";
// TENANT ENTITY
export class TenantEntity extends IndexedEntity<Tenant> {
  static readonly entityName = "tenant";
  static readonly indexName = "tenants";
  static readonly initialState: Tenant = {
    id: "",
    name: "",
    status: "active",
    created_at: 0,
  };
}
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = {
    id: "",
    tenant_id: "default_tenant",
    email: "",
    full_name: "",
    password_hash: "",
    coefficient: 1.0,
    role: "Voter",
    status: "Active",
    created_at: 0,
  };
  static readonly seedData: ReadonlyArray<User> = [
    {
      id: "superadmin-seed-user",
      tenant_id: "default_tenant",
      email: "superadmin@agora.edge",
      full_name: "Super Admin",
      password_hash: "hashed_password123",
      coefficient: 1.0,
      role: "SuperAdmin",
      status: "Active",
      created_at: Date.now(),
    }
  ];
}
// ASSEMBLY ENTITY
export class AssemblyEntity extends IndexedEntity<Assembly> {
  static readonly entityName = "assembly";
  static readonly indexName = "assemblies";
  static readonly initialState: Assembly = {
    id: "",
    tenant_id: "default_tenant",
    name: "",
    scheduled_start: 0,
    status: "Draft",
    polls: [],
    participant_ids: [],
    quorum_required: 0.5, // Default 50%
    created_at: 0,
  };
}
// VOTE ENTITY
export class VoteEntity extends IndexedEntity<Vote> {
  static readonly entityName = "vote";
  static readonly indexName = "votes";
  static readonly initialState: Vote = {
    id: "",
    poll_id: "",
    user_id: "",
    tenant_id: "default_tenant",
    selections: [],
    coefficient_used: 0,
    voted_at: 0,
  };
}
// PROXY ENTITY
export class ProxyEntity extends IndexedEntity<Proxy> {
  static readonly entityName = "proxy";
  static readonly indexName = "proxies";
  static readonly initialState: Proxy = {
    id: "",
    assembly_id: "",
    tenant_id: "default_tenant",
    delegator_id: "",
    delegate_id: "",
    status: "active",
    granted_at: 0,
  };
}
// ASSEMBLY STATE ENTITY (Live State)
export class AssemblyStateEntity extends Entity<AssemblyState> {
  static readonly entityName = "assembly_state";
  static readonly initialState: AssemblyState = {
    id: "",
    active_poll_id: null,
    participants: [],
    present_coefficient: 0,
    total_coefficient: 0,
    votes: {},
  };
}
// AUDIT LOG ENTITY
export class AuditLogEntity extends IndexedEntity<AuditLog> {
  static readonly entityName = "audit_log";
  static readonly indexName = "audit_logs";
  static readonly initialState: AuditLog = {
    id: "",
    tenant_id: "default_tenant",
    actor_id: "",
    actor_name: "",
    action: "USER_LOGIN",
    target_id: "",
    target_type: "",
    details: {},
    timestamp: 0,
  };
}