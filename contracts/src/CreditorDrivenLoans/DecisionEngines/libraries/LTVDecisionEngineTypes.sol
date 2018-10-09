pragma solidity 0.4.24;

import "../../../shared/libraries/SignaturesLibrary.sol";


contract LTVDecisionEngineTypes {
	struct EvaluationParams {
		address creditor;
		address priceFeedOperator;
		// Price feed data.
		Price principalPrice;
		Price collateralPrice;
		// Commitment values.
		CommitmentValues commitmentValues;
		SignaturesLibrary.ECDSASignature creditorSignature;
	}

	struct Price {
		uint price;
		uint timestamp;
		SignaturesLibrary.ECDSASignature operatorSignature;
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
