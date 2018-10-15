pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";


contract TokenRegistry is Ownable {
	struct TokenAttributes {
		// The ERC20 contract address.
		address tokenAddress;
		// The index in `tokenSymbolList` where the token's symbol can be found.
		uint tokenIndex;
		// The name of the given token, e.g. "Canonical Wrapped Ether"
		string name;
		// The number of digits that come after the decimal place when displaying token value.
		uint8 numDecimals;
	}

	/**
	 * Maps the given symbol to the given token attributes.
	 */
	function setTokenAttributes(
		string _symbol,
		address _tokenAddress,
		string _tokenName,
		uint8 _numDecimals
	) public;

	/**
	 * Given a symbol, resolves the current address of the token the symbol is mapped to.
	 */
	function getTokenAddressBySymbol(string _symbol) public view returns (address);

	/**
	 * Given the known index of a token within the registry's symbol list,
	 * returns the address of the token mapped to the symbol at that index.
	 *
	 * This is a useful utility for compactly encoding the address of a token into a
	 * TermsContractParameters string -- by encoding a token by its index in a
	 * a 256 slot array, we can represent a token by a 1 byte uint instead of a 20 byte address.
	 */
	function getTokenAddressByIndex(uint _index) public view returns (address);

	/**
	 * Given a symbol, resolves the index of the token the symbol is mapped to within the registry's
	 * symbol list.
	 */
	function getTokenIndexBySymbol(string _symbol) public view returns (uint);

	/**
	 * Given an index, resolves the symbol of the token at that index in the registry's
	 * token symbol list.
	 */
	function getTokenSymbolByIndex(uint _index) public view returns (string);

	/**
	 * Given a symbol, returns the name of the token the symbol is mapped to within the registry's
	 * symbol list.
	 */
	function getTokenNameBySymbol(string _symbol) public view returns (string);

	/**
	 * Given the symbol for a token, returns the number of decimals as provided in
	 * the associated TokensAttribute struct.
	 *
	 * Example:
	 *   getNumDecimalsFromSymbol("REP");
	 *   => 18
	 */
	function getNumDecimalsFromSymbol(string _symbol) public view returns (uint8);

	/**
	 * Given the index for a token in the registry, returns the number of decimals as provided in
	 * the associated TokensAttribute struct.
	 *
	 * Example:
	 *   getNumDecimalsByIndex(1);
	 *   => 18
	 */
	function getNumDecimalsByIndex(uint _index) public view returns (uint8);

	/**
	 * Given the index for a token in the registry, returns the name of the token as provided in
	 * the associated TokensAttribute struct.
	 *
	 * Example:
	 *   getTokenNameByIndex(1);
	 *   => "Canonical Wrapped Ether"
	 */
	function getTokenNameByIndex(uint _index) public view returns (string);

	/**
	 * Given the symbol for a token in the registry, returns a tuple containing the token's address,
	 * the token's index in the registry, the token's name, and the number of decimals.
	 *
	 * Example:
	 *   getTokenAttributesBySymbol("WETH");
	 *   => ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", 1, "Canonical Wrapped Ether", 18]
	 */
	function getTokenAttributesBySymbol(string _symbol)
	public
	view
	returns (
		address,
		uint,
		string,
		uint
	);

	/**
	 * Given the index for a token in the registry, returns a tuple containing the token's address,
	 * the token's symbol, the token's name, and the number of decimals.
	 *
	 * Example:
	 *   getTokenAttributesByIndex(1);
	 *   => ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", "WETH", "Canonical Wrapped Ether", 18]
	 */
	function getTokenAttributesByIndex(uint _index)
	public
	view
	returns (
		address,
		string,
		string,
		uint8
	);
}
