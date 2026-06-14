/**
 * Quick Neo4j Aura connectivity check. Usage:
 *   $env:NEO4J_URI="neo4j+s://....databases.neo4j.io"
 *   $env:NEO4J_USERNAME="neo4j"
 *   $env:NEO4J_PASSWORD="your-password"
 *   node scripts/test-neo4j-connect.mjs
 */
const neo4j = require('neo4j-driver');

async function main() {
	const uri = process.env.NEO4J_URI;
	const username = process.env.NEO4J_USERNAME ?? 'neo4j';
	const password = process.env.NEO4J_PASSWORD;
	const database = process.env.NEO4J_DATABASE ?? 'neo4j';

	if (!uri || !password) {
		console.error('Set NEO4J_URI and NEO4J_PASSWORD');
		process.exit(1);
	}

	const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

	try {
		await driver.verifyConnectivity();
		console.log('verifyConnectivity: OK');

		const session = driver.session({ database });
		try {
			const result = await session.run('RETURN 1 AS n');
			console.log('query RETURN 1:', result.records[0]?.get('n')?.toString());
			console.log('SUCCESS — Neo4j is reachable with these credentials');
		} finally {
			await session.close();
		}
	} catch (err) {
		console.error('FAILED:', err.message ?? err);
		process.exit(1);
	} finally {
		await driver.close();
	}
}

main();
