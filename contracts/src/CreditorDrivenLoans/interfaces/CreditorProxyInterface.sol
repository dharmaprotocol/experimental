pragma solidity ^0.4.25;

import "./CreditorProxyCoreInterface.sol";
import "./LTVCreditorProxyInterface.sol";


contract CreditorProxyInterface is
	CreditorProxyCoreInterface,
	LTVCreditorProxyInterface
{}
