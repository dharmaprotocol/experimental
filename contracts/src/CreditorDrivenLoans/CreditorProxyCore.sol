pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

// External libraries
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
// Internal interfaces
import "./interfaces/CreditorProxyCoreInterface.sol";
// Shared interfaces
import "../shared/interfaces/ContractRegistryInterface.sol";


contract CreditorProxyCore is CreditorProxyCoreInterface {

	uint16 constant public EXTERNAL_QUERY_GAS_LIMIT = 8000;

	ContractRegistryInterface public contractRegistry;

	/**
	 * Helper function for transferring a specified amount of tokens between two parties.
	 */
	function transferTokensFrom(
		address _token,
		address _from,
		address _to,
		uint _amount
	)
		internal
		returns (bool _success)
	{
		return ERC20(_token).transferFrom(_from, _to, _amount);
	}

	/**
     * Helper function for querying this contract's allowance for transferring the given token.
     */
	function getAllowance(
		address token,
		address owner,
		address granter
	)
		internal
		view
	returns (uint _allowance)
	{
		// Limit gas to prevent reentrancy.
		return ERC20(token).allowance.gas(EXTERNAL_QUERY_GAS_LIMIT)(
			owner,
			granter
		);
	}

	/**
     * Helper function for approving this address' allowance to Dharma's token transfer proxy.
     */
	function setTokenTransferAllowance(
		address token,
		uint amount
	)
		internal
		returns (bool _success)
	{
		return ERC20(token).approve(
			address(contractRegistry.tokenTransferProxy()),
			amount
		);
	}
}
