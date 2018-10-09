pragma solidity 0.4.24;

import "../../../shared/libraries/SignaturesLibrary.sol";
import "../../../shared/libraries/OrderLibrary.sol";


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
		// A DebtOrderData is required to confirm parity with the submitted order.
		OrderLibrary.DebtOrder order;
	}

	struct Price {
		uint value;
		uint timestamp;
		SignaturesLibrary.ECDSASignature operatorSignature;
	}

	struct CreditorCommitment {
		CommitmentValues values;
		SignaturesLibrary.ECDSASignature signature;
	}

	struct CommitmentValues {
		uint maxLTV;
		address principalToken;
		uint principalAmount;
		uint expirationTimestamp;

		// Commenting these out for now, since they are contained in the order.
		//		address creditor;
		//		address repaymentRouter;
		//		uint creditorFee;
		//		address underwriter;
		//		uint underwriterRiskRating;
		//		address termsContract;
		//		bytes32 termsContractParameters;
		//		uint commitmentExpirationTimestampInSec;
		//		uint salt;
	}
}
