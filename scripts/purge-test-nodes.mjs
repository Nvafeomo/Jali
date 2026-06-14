#!/usr/bin/env node
/**
 * Remove bulk demo / filler nodes from a family tree (Neo4j cleanup via API).
 *
 * Targets names like "Mamadu Kouyaté 42" from old cousin_fill seeds, plus
 * "Branch member" / "Extended cousin" bios. If the tree still has >= MIN_COUNT
 * people afterward, deletes every deletable person (full tree wipe for test accounts).
 *
 * Usage:
 *   API_URL=https://jali-api.onrender.com DEMO_EMAIL=demo100@gmail.com DEMO_PASSWORD=demo100@ node scripts/purge-test-nodes.mjs
 */

const API_URL = (process.env.API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? 'demo100@gmail.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'demo100@';
const MIN_COUNT = Number(process.env.MIN_PURGE_COUNT ?? 900);

/** Numbered filler: "Mamadu Kouyaté 123" */
const NUMBERED_FILLER = /\sKouyat[ée]\s+\d+$/i;

const FILLER_BIO =
  /extended cousin|extended family member|branch member|diaspora network/i;

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
  const loggedIn = await jsonFetch('/auth/login', {
    method: 'POST',
    body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  });
  return loggedIn.token;
}

async function fetchPeople(token) {
  const data = await gql(
    token,
    `query {
      myTreePersonCount
      myTreePeople {
        uuid
        fullName
        bio
        canDelete
      }
    }`,
  );
  return {
    count: data.myTreePersonCount ?? 0,
    people: data.myTreePeople ?? [],
  };
}

async function deletePerson(token, uuid) {
  await gql(
    token,
    `mutation DeletePerson($uuid: String!) {
      deletePerson(uuid: $uuid)
    }`,
    { uuid },
  );
}

function isFiller(person) {
  if (NUMBERED_FILLER.test(person.fullName)) return true;
  if (person.bio && FILLER_BIO.test(person.bio)) return true;
  return false;
}

async function deleteBatch(token, people, label) {
  let deleted = 0;
  let skipped = 0;
  let failed = 0;

  for (const person of people) {
    if (!person.canDelete) {
      skipped++;
      continue;
    }
    try {
      await deletePerson(token, person.uuid);
      deleted++;
      if (deleted % 50 === 0) process.stdout.write('.');
    } catch (err) {
      failed++;
      if (failed <= 3) {
        console.error(`\n  failed ${person.fullName}: ${err.message}`);
      }
    }
  }

  console.log(`\n${label}: deleted ${deleted}, skipped (grace) ${skipped}, failed ${failed}`);
  return deleted;
}

async function main() {
  console.log(`API: ${API_URL}`);
  console.log(`Account: ${DEMO_EMAIL}`);

  const token = await auth();
  let { count, people } = await fetchPeople(token);
  console.log(`Starting count: ${count}`);

  if (count === 0) {
    console.log('Tree is already empty.');
    return;
  }

  const fillers = people.filter(isFiller);
  console.log(`Filler candidates: ${fillers.length}`);

  if (fillers.length > 0) {
    await deleteBatch(token, fillers, 'Filler purge');
  }

  ({ count, people } = await fetchPeople(token));
  console.log(`Count after filler purge: ${count}`);

  if (count >= MIN_COUNT) {
    console.log(`Still >= ${MIN_COUNT} — wiping all deletable people on this account.`);
    await deleteBatch(token, people, 'Full wipe');
    ({ count } = await fetchPeople(token));
  }

  console.log(`Final count: ${count}`);
}

main().catch(err => {
  console.error('\nPurge failed:', err.message);
  process.exit(1);
});
