pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

// Internal interfaces
import "../shared/interfaces/ContractRegistryInterface.sol";
// Internal mixins
import "./DecisionEngines/LTVDecisionEngine.sol";
import "./CreditorProxyCore.sol";


contract LTVCreditorProxy is CreditorProxyCore, LTVDecisionEngine {

	mapping (bytes32 => bool) public debtOfferCancelled;
	mapping (bytes32 => bool) public debtOfferFilled;

	bytes32 constant internal NULL_ISSUANCE_HASH = bytes32(0);

//	function LTVCreditorProxy(address _contractRegistry) LTVDecisionEngine(_contractRegistry) {}

	function LTVCreditorProxy(address _contractRegistry) LTVDecisionEngine(_contractRegistry)
		public
	{
		contractRegistry = ContractRegistryInterface(_contractRegistry);
	}

	function fillDebtOffer(LTVDecisionEngineTypes.Params params)
		public returns (bytes32 agreementId)
	{
		OrderLibrary.DebtOrder memory order = params.order;
		CommitmentValues memory commitmentValues = params.creditorCommitment.values;

		bytes32 creditorCommitmentHash = hashCreditorCommitmentForOrder(commitmentValues, order);

		if (!evaluateConsent(params, creditorCommitmentHash)) {
			emit CreditorProxyError(uint8(Errors.DEBT_OFFER_NON_CONSENSUAL), order.creditor, creditorCommitmentHash);
			return NULL_ISSUANCE_HASH;
		}

		if (debtOfferFilled[creditorCommitmentHash]) {
			emit CreditorProxyError(uint8(Errors.DEBT_OFFER_ALREADY_FILLED), order.creditor, creditorCommitmentHash);
			return NULL_ISSUANCE_HASH;
		}

		if (debtOfferCancelled[creditorCommitmentHash]) {
			emit CreditorProxyError(uint8(Errors.DEBT_OFFER_CANCELLED), order.creditor, creditorCommitmentHash);
			return NULL_ISSUANCE_HASH;
		}

		if (!evaluateDecision(params)) {
			emit CreditorProxyError(
				uint8(Errors.DEBT_OFFER_CRITERIA_NOT_MET),
				order.creditor,
				creditorCommitmentHash
			);
			return NULL_ISSUANCE_HASH;
		}

		address principalToken = order.principalToken;

		// The allowance that the token transfer proxy has for this contract's tokens.
		uint tokenTransferAllowance = getAllowance(
			principalToken,
			address(this),
			contractRegistry.tokenTransferProxy()
		);

		uint totalCreditorPayment = order.principalAmount.add(order.creditorFee);

		// Ensure the token transfer proxy can transfer tokens from the creditor proxy
		if (tokenTransferAllowance < totalCreditorPayment) {
			require(setTokenTransferAllowance(principalToken, totalCreditorPayment));
		}

		// Transfer principal from creditor to CreditorProxy
		if (totalCreditorPayment > 0) {
			require(
				transferTokensFrom(
					principalToken,
					order.creditor,
					address(this),
					totalCreditorPayment
				)
			);
		}

		agreementId = sendOrderToKernel(order);

		require(agreementId != NULL_ISSUANCE_HASH);

		debtOfferFilled[creditorCommitmentHash] = true;

		contractRegistry.debtToken().transfer(order.creditor, uint256(agreementId));

		emit DebtOfferFilled(order.creditor, creditorCommitmentHash, agreementId);

		return agreementId;
	}

	function sendOrderToKernel(DebtOrder memory order) internal returns (bytes32 id)
	{
		address[6] memory orderAddresses;
		uint[8] memory orderValues;
		bytes32[1] memory orderBytes32;
		uint8[3] memory signaturesV;
		bytes32[3] memory signaturesR;
		bytes32[3] memory signaturesS;

		(orderAddresses, orderValues, orderBytes32, signaturesV, signaturesR, signaturesS) = unpackDebtOrder(order);

		return contractRegistry.debtKernel().fillDebtOrder(
			address(this),
			orderAddresses,
			orderValues,
			orderBytes32,
			signaturesV,
			signaturesR,
			signaturesS
		);
	}

	function cancelDebtOffer(LTVDecisionEngineTypes.Params params) public returns (bool) {
		// sender must be the creditor.
		require(msg.sender == order.creditor);

		LTVDecisionEngineTypes.CommitmentValues memory commitmentValues = params.creditorCommitment.values;
		OrderLibrary.DebtOrder memory order = params.order;

		bytes32 creditorCommitmentHash = hashCreditorCommitmentForOrder(commitmentValues, order);

		// debt offer must not already be filled.
		require(!debtOfferFilled[creditorCommitmentHash]);

		debtOfferCancelled[creditorCommitmentHash] = true;

		return true;
	}
}
