#!/usr/bin/env node
/**
 * Seed a demo family tree via the Jali API.
 *
 * Usage:
 *   node scripts/seed-demo-tree.mjs
 *   API_URL=https://jali-api.onrender.com node scripts/seed-demo-tree.mjs
 *   DEMO_EMAIL=demo@jali.app DEMO_PASSWORD=DemoTree2026! API_URL=https://jali-api.onrender.com node scripts/seed-demo-tree.mjs
 *
 * Registers (or logs in if the email exists), creates 100 people with bios,
 * links relationships, and renames the tree.
 */

import { DEMO_TREE_NAME, DEMO_PERSON_COUNT, PEOPLE, RELATIONSHIPS } from './demo-tree-data.mjs';

const API_URL = (process.env.API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? 'demo@jali.app';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'DemoTree2026!';

async function jsonFetch(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = typeof data === 'object' && data?.message ? data.message : text;
    throw new Error(`${method} ${path} → ${res.status}: ${msg}`);
  }
  return data;
}

async function gql(token, query, variables = {}) {
  const res = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await res.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map(e => e.message).join('; '));
  }
  return payload.data;
}

async function auth() {
  try {
    const created = await jsonFetch('/auth/register', {
      method: 'POST',
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });
    console.log(`Registered ${DEMO_EMAIL}`);
    return created.token;
  } catch (err) {
    if (!String(err.message).includes('409') && !String(err.message).toLowerCase().includes('already')) {
      throw err;
    }
    console.log(`Account exists — logging in as ${DEMO_EMAIL}`);
    const loggedIn = await jsonFetch('/auth/login', {
      method: 'POST',
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });
    return loggedIn.token;
  }
}

async function treeHasPeople(token) {
  const data = await gql(
    token,
    `query { myTree { uuid fullName } }`,
  );
  return data.myTree?.length ?? 0;
}

async function createPerson(token, person) {
  const input = {
    fullName: person.fullName,
    bio: person.bio ?? null,
    birthDate: person.birthDate ?? null,
    deathDate: person.deathDate ?? null,
    birthplace: person.birthplace ?? null,
    ethnicGroup: person.ethnicGroup ?? null,
    biologicalSex: person.biologicalSex ?? null,
  };

  const data = await gql(
    token,
    `mutation CreatePerson($input: CreatePersonInput!) {
      createPerson(input: $input) { uuid fullName }
    }`,
    { input },
  );
  return data.createPerson.uuid;
}

async function link(token, fromUuid, toUuid, relationshipType, parentRole = null) {
  await gql(
    token,
    `mutation CreateRelationship(
      $fromUuid: String!
      $toUuid: String!
      $relationshipType: String!
      $parentRole: String
    ) {
      createRelationship(
        fromUuid: $fromUuid
        toUuid: $toUuid
        relationshipType: $relationshipType
        parentRole: $parentRole
      )
    }`,
    { fromUuid, toUuid, relationshipType, parentRole },
  );
}

async function renameTree(token, name) {
  await jsonFetch('/auth/family-tree', {
    method: 'PATCH',
    token,
    body: { name },
  });
}

async function main() {
  console.log(`API: ${API_URL}`);
  const token = await auth();

  const existing = await treeHasPeople(token);
  if (existing >= DEMO_PERSON_COUNT) {
    console.log(`Tree already has ${existing} people (target ${DEMO_PERSON_COUNT}) — skipping.`);
    console.log(`Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    return;
  }
  if (existing > 0) {
    console.error(
      `Tree has ${existing} people but this script seeds ${DEMO_PERSON_COUNT} on a fresh account.`,
    );
    console.error('Use a new DEMO_EMAIL or delete the existing tree before re-seeding.');
    process.exit(1);
  }

  console.log(`Creating ${PEOPLE.length} people…`);
  const uuidByKey = new Map();

  for (const person of PEOPLE) {
    const uuid = await createPerson(token, person);
    uuidByKey.set(person.key, uuid);
    process.stdout.write('.');
  }
  console.log(' done');

  console.log(`Linking ${RELATIONSHIPS.length} relationships…`);
  const typeOrder = { PARENT_OF: 0, MARRIED_TO: 1, SIBLING_OF: 2 };
  const sortedRels = [...RELATIONSHIPS].sort(
    (a, b) => (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9),
  );

  for (const rel of sortedRels) {
    if (rel.type === 'SIBLING_OF') continue;

    const fromUuid = uuidByKey.get(rel.from);
    const toUuid = uuidByKey.get(rel.to);
    if (!fromUuid || !toUuid) {
      throw new Error(`Missing uuid for ${rel.from} → ${rel.to}`);
    }
    try {
      await link(token, fromUuid, toUuid, rel.type, rel.parentRole ?? null);
    } catch (err) {
      if (!String(err.message).toLowerCase().includes('already exists')) {
        throw err;
      }
    }
    process.stdout.write('.');
  }
  console.log(' done');

  await renameTree(token, DEMO_TREE_NAME);

  console.log('\nDemo tree ready.');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  People:   ${DEMO_PERSON_COUNT}`);
  console.log(`  Tree:     ${DEMO_TREE_NAME}`);
}

main().catch(err => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
