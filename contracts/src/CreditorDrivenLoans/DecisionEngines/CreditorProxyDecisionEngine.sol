pragma solidity 0.4.24;

import "./libraries/CreditorProxyDecisionEngineTypes.sol";


contract CreditorProxyDecisionEngine {
	bytes constant internal COMMITMENT_HASH_PREFIX = "\x19Ethereum Signed Message:\n32";

	function evaluateConsent(
		CreditorProxyDecisionEngineTypes.CreditorEvaluationParams params
	)
		public view returns (bool signatureValid, bytes32 _id)
	{
		// Access the commitment values from the given args.
		CreditorProxyDecisionEngineTypes.CommitmentValues commitmentValues = params.commitmentValues;
		// Access the signature of the creditor for the commitment values.
		SignatureTypes.ECDSASignature signature = params.creditorSignature;

		// Create a hash of the commitment values.
		bytes32 commitmentHash = keccak256(
			commitmentValues.creditor,
			commitmentValues.repaymentRouter,
			commitmentValues.creditorFee,
			commitmentValues.underwriter,
			commitmentValues.underwriterRiskRating,
			commitmentValues.termsContract,
			commitmentValues.termsContractParameters,
			commitmentValues.commitmentExpirationTimestampInSec,
			commitmentValues.salt
		);

		// Prefix the hash with a given commitment hash constant.
		bytes32 prefixedHash = keccak256(COMMITMENT_HASH_PREFIX, hash);

		// Check if the hash recovers the creditor's address.
		return ecrecover(
			prefixedHash,
			creditorSignature.v,
			creditorSignature.r,
			creditorSignature.s
		) == params.creditor;
	}

	function evaluateDecision(DecisionEngineTypes.EvaluationParams params)
		public view returns (bool _success)
	{
		// STUB.
	}
}
