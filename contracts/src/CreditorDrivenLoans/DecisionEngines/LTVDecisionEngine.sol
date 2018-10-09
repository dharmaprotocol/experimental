pragma solidity 0.4.24;

import "./libraries/LTVDecisionEngineTypes.sol";


contract LTVDecisionEngine {
	function evaluateConsent(LTVDecisionEngineTypes.Params params)
		public view returns (bool signatureValid, bytes32 _id)
	{
		// Access the commitment values from the given args.
		LTVDecisionEngineTypes.CommitmentValues commitmentValues = params.commitmentValues;

		// Create a hash of the commitment values.
		bytes32 commitmentHash = keccak256(
			// LTV specific values.
			commitmentValues.maxLTV,
			commitmentValues.principalToken,
			commitmentValues.principalAmount,
			commitmentValues.expirationTimestamp,
			// Order specific values.
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

		return SignaturesLibrary.isValidSignature(
			params.creditor,
			commitmentHash,
			params.creditorSignature
		);
	}

	function evaluateDecision(
		LTVDecisionEngineTypes.Params params
	)
	public view returns (bool _success)
	{
		// The CreditorProxyDecisionEngine is naive, and simply returns true.
		return true;
	}
}
