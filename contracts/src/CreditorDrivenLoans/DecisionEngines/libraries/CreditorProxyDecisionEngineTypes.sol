pragma solidity 0.4.24;

import "../../../shared/libraries/SignatureTypes.sol";


contract CreditorProxyDecisionEngineTypes {
	struct CreditorEvaluationParams {
		address creditor;
		CommitmentValues commitmentValues;
		SignatureTypes.ECDSASignature creditorSignature;
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
