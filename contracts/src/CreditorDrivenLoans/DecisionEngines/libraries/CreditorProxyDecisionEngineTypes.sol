pragma solidity 0.4.24;

import "../../../shared/libraries/SignaturesLibrary.sol";


contract CreditorProxyDecisionEngineTypes {
	struct CreditorEvaluationParams {
		address creditor;
		CommitmentValues commitmentValues;
		SignaturesLibrary.ECDSASignature creditorSignature;
	}

	struct CommitmentValues {
		address creditor;
		address repaymentRouter;
		uint creditorFee;
		address underwriter;
		uint underwriterRiskRating;
		address termsContract;
		bytes32 termsContractParameters;
		uint commitmentExpirationTimestampInSec;
		uint salt;
	}
}
