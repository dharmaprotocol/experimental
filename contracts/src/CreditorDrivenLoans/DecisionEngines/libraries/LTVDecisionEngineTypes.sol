pragma solidity 0.4.24;

import "../../../shared/libraries/SignaturesLibrary.sol";


contract LTVDecisionEngineTypes {
	// The parameters used during the consent and decision evaluations.
	struct Params {
		address creditor;
		address priceFeedOperator;
		// The values and signature for hte creditor commitment hash.
		CreditorCommitment creditorCommitment;
		// Price feed data.
		Price principalPrice;
		Price collateralPrice;
	}

	struct Price {
		uint price;
		uint timestamp;
		SignaturesLibrary.ECDSASignature operatorSignature;
	}

	struct CreditorCommitment {
		CommitmentValues values;
		SignaturesLibrary.ECDSASignature signature;
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
