import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../../contracts/src/CreditorDrivenLoans/NaiveCreditorProxy.sol";

contract TestNaiveCreditorProxy {
	function testCancelDebtOffer() {
		NaiveCreditorProxy proxy = NaiveCreditorProxy(
			DeployedAddresses.NaiveCreditorProxy()
		);
	}
}
