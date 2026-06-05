package com.jali.neo4j;

public enum EvidenceType {
	DNA_MATCH(0.40),
	HISTORICAL_RECORD(0.25),
	CORROBORATION(0.20),
	ORAL_HISTORY(0.15),
	CULTURAL_CONSISTENCY(0.10),
	AI_NAMING(0.05),
	DISPUTE(-0.15);

	public final double weight;

	EvidenceType(double weight) {
		this.weight = weight;
	}
}
