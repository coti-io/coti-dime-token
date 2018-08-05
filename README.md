# COTI-DIME Token

This is the repository for the COTI-DIME smart contract.

## Contracts

Please see the [contracts/](contracts) directory.

The contracts are written in [Solidity](https://solidity.readthedocs.io/en/develop/) and tested using [Truffle](http://truffleframework.com/) and [ganache](https://github.com/trufflesuite/ganache). It also uses  [solidity-coverage](https://github.com/sc-forks/solidity-coverage) for ensuring 100% tests code coverage.

### Dependencies

Installing the dependencies using [yarn][https://yarnpkg.com/]

> $ yarn install

### Test

In order to run the tests, please execute the `scripts/test.sh` script.

> $ ./scripts/test.sh

### Code Coverage

In order to run the test coverage, please execute the `scripts/coverage.sh` script.

> $ ./scripts/coverage.sh


### Unify token contracts

In order to unify the token and its dependencies to one file, please execute the `scripts/unify.sh` script. The result will be saved `Unify.sol`.

> $ ./scripts/unify.sh
