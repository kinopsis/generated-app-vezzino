import { Hono, MiddlewareHandler } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { sign, verify } from 'hono/jwt'
import type { Env } from './core-utils';
import { UserEntity, AssemblyEntity, AssemblyStateEntity, VoteEntity, ProxyEntity, AuditLogEntity, TenantEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { User, Assembly, Participant, Vote, Proxy, PollResult, OptionResult, Poll, AuditLog, AuditLogAction, Tenant } from "@shared/types";
import { JwtVariables } from "hono/jwt";
const JWT_SECRET = 'a-very-secret-key-that-should-be-in-env'; // In production, use c.env.JWT_SECRET
type AuthEnv = {
  Variables: {
    user: User & JwtVariables;
  };
  Bindings: Env;
}
// --- SCHEMAS ---
const userSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  coefficient: z.number().min(0),
  role: z.enum(['Admin', 'Moderator', 'Voter', 'Observer', 'SuperAdmin']),
});
const registerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const assemblySchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  scheduled_start: z.number().positive(),
});
const voteSchema = z.object({
  userId: z.string(),
  pollId: z.string(),
  selections: z.array(z.string()).min(1),
});
const proxySchema = z.object({
  delegator_id: z.string(),
  delegate_id: z.string(),
});
const profileUpdateSchema = z.object({
  full_name: z.string().min(2).optional(),
  password_hash: z.string().optional(),
});
const tenantSchema = z.object({
  name: z.string().min(2),
  domain: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});
export function userRoutes(app: Hono<AuthEnv>) {
  // --- AUDIT LOG HELPER ---
  const logAction = async (env: Env, actor: User, action: AuditLogAction, target_id: string, target_type: string, details: Record<string, any> = {}) => {
    const logEntry: AuditLog = {
      id: crypto.randomUUID(),
      tenant_id: "default_tenant",
      actor_id: actor.id,
      actor_name: actor.full_name,
      action,
      target_id,
      target_type,
      details,
      timestamp: Date.now(),
    };
    await AuditLogEntity.create(env, logEntry);
  };
  // --- AUTH MIDDLEWARE ---
  const authMiddleware: MiddlewareHandler<AuthEnv> = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const token = authHeader.substring(7);
    try {
      const decoded = await verify(token, JWT_SECRET);
      c.set('user', decoded as unknown as User & JwtVariables);
      await next();
    } catch (err) {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }
  };
  const superAdminMiddleware: MiddlewareHandler<AuthEnv> = async (c, next) => {
    const user = c.get('user');
    if (user.role !== 'SuperAdmin') {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }
    await next();
  };
  // --- AUTH API ---
  app.post('/api/auth/register', zValidator('json', registerSchema), async (c) => {
    const data = c.req.valid('json');
    const allUsers = (await UserEntity.list(c.env)).items;
    if (allUsers.some(u => u.email === data.email)) {
      return bad(c, 'User with this email already exists.');
    }
    const password_hash = `hashed_${data.password}`;
    const user: User = {
      id: crypto.randomUUID(),
      tenant_id: "default_tenant",
      full_name: data.full_name,
      email: data.email,
      password_hash,
      coefficient: 1.0,
      role: allUsers.length === 0 ? "SuperAdmin" : "Voter", // First user is SuperAdmin
      status: "Active",
      created_at: Date.now(),
    };
    const createdUser = await UserEntity.create(c.env, user);
    await logAction(c.env, createdUser, 'USER_REGISTER', createdUser.id, 'User', { email: createdUser.email });
    const { password_hash: _, ...userToSign } = createdUser;
    const token = await sign({ ...userToSign, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, JWT_SECRET);
    return ok(c, { user: userToSign, token });
  });
  app.post('/api/auth/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const allUsers = (await UserEntity.list(c.env)).items;
    const user = allUsers.find(u => u.email === email);
    if (!user || user.password_hash !== `hashed_${password}`) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
    await logAction(c.env, user, 'USER_LOGIN', user.id, 'User');
    const { password_hash: _, ...userToSign } = user;
    const token = await sign({ ...userToSign, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, JWT_SECRET);
    return ok(c, { user: userToSign, token });
  });
  // --- PROTECTED ROUTES ---
  app.use('/api/*', authMiddleware);
  // --- SUPER ADMIN ROUTES ---
  app.get('/api/superadmin/tenants', superAdminMiddleware, async (c) => {
    const page = await TenantEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/superadmin/tenants', superAdminMiddleware, zValidator('json', tenantSchema), async (c) => {
    const data = c.req.valid('json');
    const tenant: Tenant = {
      id: crypto.randomUUID(),
      ...data,
      created_at: Date.now(),
    };
    const createdTenant = await TenantEntity.create(c.env, tenant);
    return ok(c, createdTenant);
  });
  app.put('/api/superadmin/tenants/:id', superAdminMiddleware, zValidator('json', tenantSchema.partial()), async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const tenant = new TenantEntity(c.env, id);
    if (!await tenant.exists()) return notFound(c, 'Tenant not found');
    const updatedTenant = await tenant.mutate(s => ({ ...s, ...data }));
    return ok(c, updatedTenant);
  });
  app.delete('/api/superadmin/tenants/:id', superAdminMiddleware, async (c) => {
    const id = c.req.param('id');
    const deleted = await TenantEntity.delete(c.env, id);
    if (!deleted) return notFound(c, 'Tenant not found');
    return ok(c, { id, deleted });
  });
  // --- AUDIT LOGS API ---
  app.get('/api/audit-logs', async (c) => {
    const page = await AuditLogEntity.list(c.env);
    return ok(c, page.items.sort((a, b) => b.timestamp - a.timestamp));
  });
  // --- USERS API ---
  app.get('/api/users', async (c) => {
    const page = await UserEntity.list(c.env);
    return ok(c, page.items.map(({ password_hash, ...u }) => u));
  });
  app.put('/api/users/profile', zValidator('json', profileUpdateSchema), async (c) => {
    const actor = c.get('user');
    const data = c.req.valid('json');
    const user = new UserEntity(c.env, actor.id);
    if (!await user.exists()) return notFound(c, 'User not found');
    const updatedUser = await user.mutate(s => ({ ...s, ...data }));
    await logAction(c.env, actor, 'USER_UPDATE', updatedUser.id, 'User', { changes: Object.keys(data) });
    const { password_hash: _, ...userToReturn } = updatedUser;
    return ok(c, userToReturn);
  });
  app.post('/api/users', zValidator('json', userSchema), async (c) => {
    const actor = c.get('user');
    const data = c.req.valid('json');
    const user: User = {
      id: crypto.randomUUID(),
      tenant_id: "default_tenant",
      ...data,
      status: "Active",
      created_at: Date.now(),
    };
    const createdUser = await UserEntity.create(c.env, user);
    await logAction(c.env, actor, 'USER_CREATE', createdUser.id, 'User', { email: createdUser.email });
    return ok(c, createdUser);
  });
  app.put('/api/users/:id', zValidator('json', userSchema.partial()), async (c) => {
    const actor = c.get('user');
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const user = new UserEntity(c.env, id);
    if (!await user.exists()) return notFound(c, 'User not found');
    const updatedUser = await user.mutate(s => ({ ...s, ...data }));
    await logAction(c.env, actor, 'USER_UPDATE', updatedUser.id, 'User', { changes: Object.keys(data) });
    return ok(c, updatedUser);
  });
  app.delete('/api/users/:id', async (c) => {
    const actor = c.get('user');
    const id = c.req.param('id');
    const deleted = await UserEntity.delete(c.env, id);
    if (!deleted) return notFound(c, 'User not found');
    await logAction(c.env, actor, 'USER_DELETE', id, 'User');
    return ok(c, { id, deleted });
  });
  app.post('/api/users/batch', async (c) => {
    const actor = c.get('user');
    const usersData = await c.req.json();
    const createdUsers = [];
    for (const data of usersData) {
        const user: User = {
            id: crypto.randomUUID(),
            tenant_id: "default_tenant",
            ...data,
            status: "Active",
            created_at: Date.now(),
        };
        createdUsers.push(await UserEntity.create(c.env, user));
    }
    await logAction(c.env, actor, 'USER_BATCH_IMPORT', actor.id, 'System', { count: createdUsers.length });
    return ok(c, createdUsers);
  });
  // --- ASSEMBLIES API ---
  app.get('/api/assemblies', async (c) => {
    const page = await AssemblyEntity.list(c.env);
    return ok(c, page.items);
  });
  app.get('/api/assemblies/:id', async (c) => {
    const id = c.req.param('id');
    const assembly = new AssemblyEntity(c.env, id);
    if (!await assembly.exists()) return notFound(c, 'Assembly not found');
    return ok(c, await assembly.getState());
  });
  app.post('/api/assemblies', zValidator('json', assemblySchema), async (c) => {
    const actor = c.get('user');
    const data = c.req.valid('json');
    const assembly: Assembly = {
      id: crypto.randomUUID(),
      tenant_id: "default_tenant",
      ...data,
      status: "Draft",
      polls: [],
      participant_ids: [],
      quorum_required: 0.5,
      created_at: Date.now(),
    };
    const createdAssembly = await AssemblyEntity.create(c.env, assembly);
    await logAction(c.env, actor, 'ASSEMBLY_CREATE', createdAssembly.id, 'Assembly', { name: createdAssembly.name });
    return ok(c, createdAssembly);
  });
  app.put('/api/assemblies/:id', zValidator('json', assemblySchema.partial().extend({ polls: z.any().optional() })), async (c) => {
    const actor = c.get('user');
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const assembly = new AssemblyEntity(c.env, id);
    if (!await assembly.exists()) return notFound(c, 'Assembly not found');
    const updatedAssembly = await assembly.mutate(s => ({ ...s, ...data }));
    await logAction(c.env, actor, 'ASSEMBLY_UPDATE', updatedAssembly.id, 'Assembly', { changes: Object.keys(data) });
    return ok(c, updatedAssembly);
  });
  app.delete('/api/assemblies/:id', async (c) => {
    const actor = c.get('user');
    const id = c.req.param('id');
    const deleted = await AssemblyEntity.delete(c.env, id);
    if (!deleted) return notFound(c, 'Assembly not found');
    await logAction(c.env, actor, 'ASSEMBLY_DELETE', id, 'Assembly');
    return ok(c, { id, deleted });
  });
  // --- PROXY VOTING API ---
  app.get('/api/assemblies/:id/proxies', async (c) => {
    const assemblyId = c.req.param('id');
    const allProxies = (await ProxyEntity.list(c.env)).items;
    const assemblyProxies = allProxies.filter(p => p.assembly_id === assemblyId);
    return ok(c, assemblyProxies);
  });
  app.post('/api/assemblies/:id/proxies', zValidator('json', proxySchema), async (c) => {
    const actor = c.get('user');
    const assembly_id = c.req.param('id');
    const { delegator_id, delegate_id } = c.req.valid('json');
    if (delegator_id === delegate_id) return bad(c, "User cannot delegate to themselves.");
    const allProxies = (await ProxyEntity.list(c.env)).items;
    const assemblyProxies = allProxies.filter(p => p.assembly_id === assembly_id && p.status === 'active');
    let current = delegate_id;
    const visited = new Set([delegator_id]);
    while (current) {
        if (visited.has(current)) return bad(c, "Circular proxy delegation detected.");
        visited.add(current);
        const nextProxy = assemblyProxies.find(p => p.delegator_id === current);
        current = nextProxy ? nextProxy.delegate_id : '';
    }
    const proxy: Proxy = {
      id: crypto.randomUUID(),
      assembly_id,
      tenant_id: "default_tenant",
      delegator_id,
      delegate_id,
      status: 'active',
      granted_at: Date.now(),
    };
    const createdProxy = await ProxyEntity.create(c.env, proxy);
    await logAction(c.env, actor, 'PROXY_CREATE', createdProxy.id, 'Proxy', { assembly_id, delegator_id, delegate_id });
    return ok(c, createdProxy);
  });
  app.delete('/api/assemblies/:id/proxies/:proxyId', async (c) => {
    const actor = c.get('user');
    const proxyId = c.req.param('proxyId');
    const deleted = await ProxyEntity.delete(c.env, proxyId);
    if (!deleted) return notFound(c, 'Proxy not found');
    await logAction(c.env, actor, 'PROXY_DELETE', proxyId, 'Proxy');
    return ok(c, { id: proxyId, deleted });
  });
  // --- LIVE ASSEMBLY API ---
  app.post('/api/assemblies/:id/start', async (c) => {
    const actor = c.get('user');
    const id = c.req.param('id');
    const assemblyEntity = new AssemblyEntity(c.env, id);
    if (!await assemblyEntity.exists()) return notFound(c, 'Assembly not found');
    const assembly = await assemblyEntity.mutate(s => ({ ...s, status: 'Active' }));
    const allUsers = (await UserEntity.list(c.env)).items;
    const participants: Participant[] = allUsers.map(u => ({
      id: u.id,
      full_name: u.full_name,
      coefficient: u.coefficient,
      is_present: false,
    }));
    const total_coefficient = participants.reduce((sum, p) => sum + p.coefficient, 0);
    const stateEntity = new AssemblyStateEntity(c.env, id);
    await stateEntity.save({
      id,
      active_poll_id: null,
      participants,
      present_coefficient: 0,
      total_coefficient,
      votes: {},
    });
    await logAction(c.env, actor, 'ASSEMBLY_START', id, 'Assembly');
    return ok(c, assembly);
  });
  app.get('/api/assemblies/:id/state', async (c) => {
    const id = c.req.param('id');
    const stateEntity = new AssemblyStateEntity(c.env, id);
    if (!await stateEntity.exists()) return notFound(c, 'Assembly live state not found');
    return ok(c, await stateEntity.getState());
  });
  app.post('/api/assemblies/:id/join', async (c) => {
    const id = c.req.param('id');
    const { userId } = await c.req.json<{ userId: string }>();
    if (!userId) return bad(c, 'userId is required');
    const stateEntity = new AssemblyStateEntity(c.env, id);
    if (!await stateEntity.exists()) return notFound(c, 'Assembly live state not found');
    const allProxies = (await ProxyEntity.list(c.env)).items;
    const assemblyProxies = allProxies.filter(p => p.assembly_id === id && p.status === 'active');
    const proxyMap = new Map(assemblyProxies.map(p => [p.delegator_id, p.delegate_id]));
    const updatedState = await stateEntity.mutate(s => {
      const participant = s.participants.find(p => p.id === userId);
      if (participant && !participant.is_present) {
        if (proxyMap.has(userId)) return s;
        participant.is_present = true;
        let coefficientToAdd = participant.coefficient;
        const delegations = assemblyProxies.filter(p => p.delegate_id === userId);
        for (const delegation of delegations) {
          const delegator = s.participants.find(p => p.id === delegation.delegator_id);
          if (delegator) coefficientToAdd += delegator.coefficient;
        }
        s.present_coefficient += coefficientToAdd;
      }
      return s;
    });
    return ok(c, updatedState);
  });
  app.post('/api/assemblies/:id/polls/:pollId/activate', async (c) => {
    const actor = c.get('user');
    const id = c.req.param('id');
    const pollId = c.req.param('pollId');
    const stateEntity = new AssemblyStateEntity(c.env, id);
    if (!await stateEntity.exists()) return notFound(c, 'Assembly live state not found');
    const updatedState = await stateEntity.mutate(s => ({ ...s, active_poll_id: pollId }));
    await logAction(c.env, actor, 'POLL_ACTIVATE', pollId, 'Poll', { assembly_id: id });
    return ok(c, updatedState);
  });
  app.post('/api/assemblies/:id/polls/:pollId/close', async (c) => {
    const actor = c.get('user');
    const id = c.req.param('id');
    const pollId = c.req.param('pollId');
    const stateEntity = new AssemblyStateEntity(c.env, id);
    if (!await stateEntity.exists()) return notFound(c, 'Assembly live state not found');
    const updatedState = await stateEntity.mutate(s => ({ ...s, active_poll_id: null }));
    await logAction(c.env, actor, 'POLL_CLOSE', pollId, 'Poll', { assembly_id: id });
    return ok(c, updatedState);
  });
  app.post('/api/assemblies/:id/vote', zValidator('json', voteSchema), async (c) => {
    const actor = c.get('user');
    const id = c.req.param('id');
    const { userId, pollId, selections } = c.req.valid('json');
    const assemblyEntity = new AssemblyEntity(c.env, id);
    if (!await assemblyEntity.exists()) return notFound(c, 'Assembly not found');
    const assembly = await assemblyEntity.getState();
    const poll = assembly.polls.find(p => p.id === pollId);
    if (!poll) return notFound(c, 'Poll not found');
    if (selections.length < poll.min_selections || selections.length > poll.max_selections) {
        return bad(c, `You must select between ${poll.min_selections} and ${poll.max_selections} options.`);
    }
    const allProxies = (await ProxyEntity.list(c.env)).items;
    const assemblyProxies = allProxies.filter(p => p.assembly_id === id && p.status === 'active');
    const proxyMap = new Map(assemblyProxies.map(p => [p.delegator_id, p.delegate_id]));
    if (proxyMap.has(userId)) return bad(c, "This user has delegated their vote and cannot vote directly.");
    const userEntity = new UserEntity(c.env, userId);
    if (!await userEntity.exists()) return notFound(c, 'User not found');
    const user = await userEntity.getState();
    const stateEntity = new AssemblyStateEntity(c.env, id);
    if (!await stateEntity.exists()) return notFound(c, 'Assembly live state not found');
    const updatedState = await stateEntity.mutate(s => {
      if (s.active_poll_id !== pollId) throw new Error("This poll is not currently active.");
      if (!s.votes[pollId]) s.votes[pollId] = {};
      s.votes[pollId][userId] = selections;
      return s;
    });
    let coefficientToApply = user.coefficient;
    const delegationsToVoter = assemblyProxies.filter(p => p.delegate_id === userId);
    if (delegationsToVoter.length > 0) {
      const allUsers = (await UserEntity.list(c.env)).items;
      const usersById = new Map(allUsers.map(u => [u.id, u]));
      for (const delegation of delegationsToVoter) {
        const delegator = usersById.get(delegation.delegator_id);
        if (delegator) coefficientToApply += delegator.coefficient;
      }
    }
    const vote: Vote = {
      id: `${pollId}:${userId}`,
      poll_id: pollId,
      user_id: userId,
      tenant_id: "default_tenant",
      selections,
      coefficient_used: coefficientToApply,
      voted_at: Date.now(),
    };
    await VoteEntity.create(c.env, vote);
    await logAction(c.env, actor, 'VOTE_CAST', pollId, 'Poll', { assembly_id: id, selections });
    return ok(c, updatedState);
  });
  app.post('/api/assemblies/:id/end', async (c) => {
    const actor = c.get('user');
    const id = c.req.param('id');
    const assemblyEntity = new AssemblyEntity(c.env, id);
    if (!await assemblyEntity.exists()) return notFound(c, 'Assembly not found');
    const assembly = await assemblyEntity.mutate(s => ({ ...s, status: 'Completed' }));
    await logAction(c.env, actor, 'ASSEMBLY_END', id, 'Assembly');
    return ok(c, assembly);
  });
  app.get('/api/assemblies/:id/polls/:pollId/results', async (c) => {
    const assemblyId = c.req.param('id');
    const pollId = c.req.param('pollId');
    const assemblyEntity = new AssemblyEntity(c.env, assemblyId);
    if (!await assemblyEntity.exists()) return notFound(c, 'Assembly not found');
    const assembly = await assemblyEntity.getState();
    const poll = assembly.polls.find(p => p.id === pollId);
    if (!poll) return notFound(c, 'Poll not found');
    if (poll.is_secret) {
        return ok(c, { poll_id: pollId, title: poll.title, is_secret: true, results: [], total_votes: 0, total_coefficient_voted: 0 });
    }
    const stateEntity = new AssemblyStateEntity(c.env, assemblyId);
    if (!await stateEntity.exists()) return notFound(c, 'Assembly live state not found');
    const state = await stateEntity.getState();
    const votesForPoll = state.votes[pollId] || {};
    const allUsers = (await UserEntity.list(c.env)).items;
    const usersById = new Map(allUsers.map(u => [u.id, u]));
    const allProxies = (await ProxyEntity.list(c.env)).items;
    const assemblyProxies = allProxies.filter(p => p.assembly_id === assemblyId && p.status === 'active');
    const proxyMap = new Map(assemblyProxies.map(p => [p.delegator_id, p.delegate_id]));
    const results: Record<string, OptionResult> = {};
    poll.options.forEach(opt => {
      results[opt.id] = { option_id: opt.id, text: opt.text, vote_count: 0, coefficient_total: 0 };
    });
    let total_votes = 0;
    let total_coefficient_voted = 0;
    for (const voterId in votesForPoll) {
      const voter = usersById.get(voterId);
      if (!voter) continue;
      if (proxyMap.has(voterId)) continue;
      let coefficientToApply = voter.coefficient;
      const delegationsToVoter = assemblyProxies.filter(p => p.delegate_id === voterId);
      for (const delegation of delegationsToVoter) {
        const delegator = usersById.get(delegation.delegator_id);
        if (delegator) coefficientToApply += delegator.coefficient;
      }
      const selections = votesForPoll[voterId];
      total_votes++;
      total_coefficient_voted += coefficientToApply;
      for (const selection of selections) {
        if (results[selection]) {
          results[selection].vote_count++;
          results[selection].coefficient_total += coefficientToApply;
        }
      }
    }
    const pollResult: PollResult = {
      poll_id: pollId,
      title: poll.title,
      total_votes,
      total_coefficient_voted,
      results: Object.values(results),
      is_secret: poll.is_secret || false,
    };
    return ok(c, pollResult);
  });
  app.get('/api/assemblies/:id/export', async (c) => {
    const assemblyId = c.req.param('id');
    const assemblyEntity = new AssemblyEntity(c.env, assemblyId);
    if (!await assemblyEntity.exists()) return notFound(c, 'Assembly not found');
    const assembly = await assemblyEntity.getState();
    const allVotes = (await VoteEntity.list(c.env)).items;
    const assemblyVotes = allVotes.filter(v => assembly.polls.some(p => p.id === v.poll_id));
    const allUsers = (await UserEntity.list(c.env)).items;
    const usersById = new Map(allUsers.map(u => [u.id, u]));
    let csv = 'poll_title,poll_type,voter_name,voter_email,option_text,coefficient_used,voted_at\n';
    for (const vote of assemblyVotes) {
        const poll = assembly.polls.find(p => p.id === vote.poll_id);
        const user = usersById.get(vote.user_id);
        if (!poll || !user) continue;
        if (poll.is_secret) {
            for (const selectionId of vote.selections) {
                const option = poll.options.find(o => o.id === selectionId);
                csv += `"${poll.title}","${poll.poll_type}","ANONYMOUS","ANONYMOUS","${option?.text || 'N/A'}",${vote.coefficient_used},"${new Date(vote.voted_at).toISOString()}"\n`;
            }
        } else {
            for (const selectionId of vote.selections) {
                const option = poll.options.find(o => o.id === selectionId);
                csv += `"${poll.title}","${poll.poll_type}","${user.full_name}","${user.email}","${option?.text || 'N/A'}",${vote.coefficient_used},"${new Date(vote.voted_at).toISOString()}"\n`;
            }
        }
    }
    return new Response(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="assembly_${assemblyId}_export.csv"`,
        },
    });
  });
}