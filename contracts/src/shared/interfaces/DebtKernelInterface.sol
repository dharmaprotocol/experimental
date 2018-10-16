pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

contract DebtKernelInterface {

	enum Errors {
		// Debt has been already been issued
		DEBT_ISSUED,
		// Order has already expired
		ORDER_EXPIRED,
		// Debt issuance associated with order has been cancelled
		ISSUANCE_CANCELLED,
		// Order has been cancelled
		ORDER_CANCELLED,
		// Order parameters specify amount of creditor / debtor fees
		// that is not equivalent to the amount of underwriter / relayer fees
		ORDER_INVALID_INSUFFICIENT_OR_EXCESSIVE_FEES,
		// Order parameters specify insufficient principal amount for
		// debtor to at least be able to meet his fees
		ORDER_INVALID_INSUFFICIENT_PRINCIPAL,
		// Order parameters specify non zero fee for an unspecified recipient
		ORDER_INVALID_UNSPECIFIED_FEE_RECIPIENT,
		// Order signatures are mismatched / malformed
		ORDER_INVALID_NON_CONSENSUAL,
		// Insufficient balance or allowance for principal token transfer
		CREDITOR_BALANCE_OR_ALLOWANCE_INSUFFICIENT
	}

	// solhint-disable-next-line var-name-mixedcase
	address public TOKEN_TRANSFER_PROXY;
	bytes32 constant public NULL_ISSUANCE_HASH = bytes32(0);

	/* NOTE(kayvon): Currently, the `view` keyword does not actually enforce the
	static nature of the method; this will change in the future, but for now, in
	order to prevent reentrancy we'll need to arbitrarily set an upper bound on
	the gas limit allotted for certain method calls. */
	uint16 constant public EXTERNAL_QUERY_GAS_LIMIT = 8000;

	mapping (bytes32 => bool) public issuanceCancelled;
	mapping (bytes32 => bool) public debtOrderCancelled;

	event LogDebtOrderFilled(
		bytes32 indexed _agreementId,
		uint _principal,
		address _principalToken,
		address indexed _underwriter,
		uint _underwriterFee,
		address indexed _relayer,
		uint _relayerFee
	);

	event LogIssuanceCancelled(
		bytes32 indexed _agreementId,
		address indexed _cancelledBy
	);

	event LogDebtOrderCancelled(
		bytes32 indexed _debtOrderHash,
		address indexed _cancelledBy
	);

	event LogError(
		uint8 indexed _errorId,
		bytes32 indexed _orderHash
	);

	struct Issuance {
		address version;
		address debtor;
		address underwriter;
		uint underwriterRiskRating;
		address termsContract;
		bytes32 termsContractParameters;
		uint salt;
		bytes32 agreementId;
	}

	struct DebtOrder {
		Issuance issuance;
		uint underwriterFee;
		uint relayerFee;
		uint principalAmount;
		address principalToken;
		uint creditorFee;
		uint debtorFee;
		address relayer;
		uint expirationTimestampInSec;
		bytes32 debtOrderHash;
	}

    function fillDebtOrder(
        address creditor,
        address[6] orderAddresses,
        uint[8] orderValues,
        bytes32[1] orderBytes32,
        uint8[3] signaturesV,
        bytes32[3] signaturesR,
        bytes32[3] signaturesS
    )
        public
        returns (bytes32 _agreementId);

}
