pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

// External dependencies
import "zeppelin-solidity/contracts/math/SafeMath.sol";

// Libraries
import "./libraries/LTVDecisionEngineTypes.sol";
import "../../shared/libraries/SignaturesLibrary.sol";


contract LTVDecisionEngine is
	LTVDecisionEngineTypes,
	SignaturesLibrary
{
	using SafeMath for uint;

	uint public constant PRECISION = 4;

	uint public constant MAX_PRICE_TTL_IN_SECONDS = 600;

	function evaluateConsent(Params params)
		public view returns (bool signatureValid, bytes32 _id)
	{
		OrderLibrary.DebtOrder memory order = params.order;
		CommitmentValues memory commitmentValues = params.creditorCommitment.values;

		bytes32 commitmentHash = hashOrder(commitmentValues, order);

		// Checks that the given creditor values were signed by the creditor.
		bool validCreditorSignature = isValidSignature(
			params.creditor,
			commitmentHash,
			params.creditorCommitment.signature
		);

		// We return early if the creditor values were not signed correctly.
		if (!validCreditorSignature) {
			return (false, commitmentHash);
		}

		// Checks that the given price feed data was signed by the price feed operator.
		return (
			verifyPrices(
				params.priceFeedOperator,
				params.principalPrice,
				params.collateralPrice
			),
			commitmentHash
		);
	}

	// Returns true if the creditor-initiated order has not expired, and the LTV is below the max.
	function evaluateDecision(Params memory params)
		public view returns (bool _success)
	{
		LTVDecisionEngineTypes.Price memory principalTokenPrice = params.principalPrice;
		LTVDecisionEngineTypes.Price memory collateralTokenPrice = params.collateralPrice;

		uint maxLTV = params.creditorCommitment.values.maxLTV;
		OrderLibrary.DebtOrder memory order = params.order;

		uint collateralValue = collateralTokenPrice.value;

		if (isExpired(order.expirationTimestampInSec)) {
			return false;
		}

		if (order.collateralAmount == 0 || collateralValue == 0) {
			return false;
		}

		uint ltv = computeLTV(
			principalTokenPrice.value,
			collateralTokenPrice.value,
			order.principalAmount,
			order.collateralAmount
		);

		uint maxLTVWithPrecision = maxLTV.mul(10 ** (PRECISION.sub(2)));

		return ltv <= maxLTVWithPrecision;
	}

	function hashOrder(CommitmentValues commitmentValues, OrderLibrary.DebtOrder order)
		returns (bytes32)
	{
		return keccak256(
			// LTV specific values.
			commitmentValues.maxLTV,
			// Order specific values.
			order.principalToken,
			order.principalAmount,
			order.creditor,
			order.issuanceVersion,
			order.kernelVersion,
			order.creditorFee,
			order.underwriter,
			order.underwriterRiskRating,
			order.termsContract,
			order.expirationTimestampInSec,
			order.salt
		);
	}

	function verifyPrices(
		address priceFeedOperator,
		LTVDecisionEngineTypes.Price principalPrice,
		LTVDecisionEngineTypes.Price collateralPrice
	)
		internal view returns (bool)
	{
		uint minPriceTimestamp = block.timestamp - MAX_PRICE_TTL_IN_SECONDS;

		if (principalPrice.timestamp < minPriceTimestamp ||
			collateralPrice.timestamp < minPriceTimestamp) {
			return false;
		}

		bytes32 principalPriceHash = keccak256(
			principalPrice.value,
			principalPrice.tokenAddress,
			principalPrice.timestamp
		);

		bytes32 collateralPriceHash = keccak256(
			collateralPrice.value,
			collateralPrice.tokenAddress,
			collateralPrice.timestamp
		);

		bool principalPriceValid = isValidSignature(
			priceFeedOperator,
			principalPriceHash,
			principalPrice.signature
		);

		// We return early if the principal price information was not signed correctly.
		if (!principalPriceValid) {
			return false;
		}

		return isValidSignature(
			priceFeedOperator,
			collateralPriceHash,
			collateralPrice.signature
		);
	}

	function computeLTV(
		uint principalTokenPrice,
		uint collateralTokenPrice,
		uint principalAmount,
		uint collateralAmount
	)
		internal constant returns (uint)
	{
		uint principalValue = principalTokenPrice.mul(principalAmount).mul(10 ** PRECISION);
		uint collateralValue = collateralTokenPrice.mul(collateralAmount);

		return principalValue.div(collateralValue);
	}

	function isExpired(uint expirationTimestampInSec)
		internal view returns (bool expired)
	{
		return expirationTimestampInSec < block.timestamp;
	}
}
