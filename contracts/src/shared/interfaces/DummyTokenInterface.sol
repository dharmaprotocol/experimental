pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


contract DummyToken is MintableToken {
	function setBalance(address _target, uint _value) public;
}
