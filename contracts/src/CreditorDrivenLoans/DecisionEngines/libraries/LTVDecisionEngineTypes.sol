pragma solidity 0.4.24;

import "../../../shared/libraries/SignaturesLibrary.sol";
import "../../../shared/libraries/OrderLibrary.sol";


contract LTVDecisionEngineTypes {
	// The parameters used during the consent and decision evaluations.
	struct Params {
		address creditor;
		address priceFeedOperator;
		// The values and signature for the creditor commitment hash.
		CreditorCommitment creditorCommitment;
		uint maxLTV;
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
		address principalToken;
		uint principalAmount;
		uint expirationTimestamp;
	}
}
