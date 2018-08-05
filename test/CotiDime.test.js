import chai from 'chai';
import dirtyChai from 'dirty-chai';
import BigNumber from 'bignumber.js';
import expectRevert from './helpers/expectRevert';
import { ethSendTransaction, ethGetBalance } from './helpers/web3';

const { expect } = chai;
chai.use(dirtyChai);

const CotiDime = artifacts.require('../contracts/CotiDime.sol');
const ForceEther = artifacts.require('ForceEther');

contract('CotiDime', async (accounts) => {
  let token;

  const owner = accounts[0];
  const notOwner = accounts[9];

  const userOne = accounts[1];
  const userTwo = accounts[2];
  const userThree = accounts[3];

  const decimals = 18;

  const oneCotiDime = 1 * (10 ** decimals); // 1 COTI-DIME in smallest token unit
  const twentyMillion = 20 * (10 ** 6);
  const totalSupply = new BigNumber(oneCotiDime).multipliedBy(twentyMillion);

  const tokenName = 'COTI-DIME';
  const tokenSymbol = 'CPS';

  describe('after deploy', async () => {
    beforeEach('deploying new CotiDime token', async () => {
      token = await CotiDime.new();
    });

    it('should return correct name after construction', async () => {
      expect(await token.name.call()).to.equal(tokenName);
    });

    it('should return correct symbol after construction', async () => {
      expect(await token.symbol.call()).to.equal(tokenSymbol);
    });

    it('should return correct decimal points after construction', async () => {
      expect(await token.decimals.call()).to.be.bignumber.equal(decimals);
    });

    it('should return correct initial totalSupply 0', async () => {
      expect(await token.totalSupply.call()).to.be.bignumber.equal(0);
    });

    it('should return correct owner', async() => {
      expect(await token.owner.call()).to.equal(owner);
    });

    it('should return minting not finished', async() => {
      expect(await token.mintingFinished.call()).to.be.false();
    });
  });

  describe('token functionalities during minting stage', async() => {
    beforeEach('deploying new CotiDime token and mint COTI-DIMEs', async() => {
      token = await CotiDime.new();
      await token.mint(userOne, oneCotiDime);
    });

    it("can't transfer", async() => {
      await expectRevert(token.transfer(userTwo, oneCotiDime), {
        from: userOne,
      });
    });

    it('can approve', async() => {
      await token.approve(userTwo, oneCotiDime);
    });

    it("can't transfer from", async() => {
      await token.approve(userTwo, oneCotiDime, {
        from: userOne,
      });

      await expectRevert(token.transferFrom(userOne, userTwo, oneCotiDime, {
        from: userTwo,
      }));
    });
  });

  describe('token functionalities after minting stage', async() => {
    beforeEach('deploying new CotiDime token, mint coti-dimes and finish minting stage', async() => {
      token = await CotiDime.new();
      await token.mint(userOne, oneCotiDime);
      await token.finishMinting();
    });

    it('can transfer', async() => {
      await token.transfer(userOne, oneCotiDime, {
        from: userOne,
      });
    });

    it('can approve', async() => {
      await token.approve(userOne, oneCotiDime, {
        from: userOne,
      });
    });

    it('can transfer from', async() => {
      await token.approve(userTwo, oneCotiDime, {
        from: userOne,
      });
      await token.transferFrom(userOne, userTwo, oneCotiDime, {
        from: userTwo,
      });
    });
  });

  describe('token usage', async() => {
    beforeEach('deploying new CotiDime token, mint COTI-DIMEs and finish minting stage', async() => {
      token = await CotiDime.new();
    });

    it('mint, finish minting and transfer', async() => {
      const halfSupply = totalSupply.dividedBy(2);

      await token.mint(userOne, halfSupply.toString(10));
      await token.mint(userTwo, halfSupply.toString(10));
      await token.finishMinting();

      expect(await token.totalSupply.call()).to.be.bignumber.equal(totalSupply);
      expect(await token.balanceOf.call(userOne)).to.be.bignumber.equal(halfSupply);
      expect(await token.balanceOf.call(userTwo)).to.be.bignumber.equal(halfSupply);

      await token.transfer(userThree, oneCotiDime, {
        from: userOne,
      });

      expect(await token.balanceOf.call(userOne)).to.be.bignumber.equal(halfSupply.minus(oneCotiDime));
      expect(await token.balanceOf.call(userThree)).to.be.bignumber.equal(oneCotiDime);
    });
  });

  describe('mintable token', async() => {
    beforeEach('deploying new CotiDime token, mint COTI-DIMEs and finish minting stage', async() => {
      token = await CotiDime.new();
    });

    describe('as a basic mintable token', () => {
      describe('after token creation', () => {
        it('sender should be token owner', async () => {
          const tokenOwner = await token.owner({ from: owner });
          tokenOwner.should.equal(owner);
        });
      });

      describe('minting finished', () => {
        describe('when the token minting is not finished', () => {
          it('returns false', async () => {
            const mintingFinished = await token.mintingFinished();
            expect(mintingFinished).to.be.false();
          });
        });

        describe('when the token is minting finished', () => {
          beforeEach(async () => {
            await token.finishMinting({ from: owner });
          });

          it('returns true', async () => {
            const mintingFinished = await token.mintingFinished();
            expect(mintingFinished).to.be.true();
          });
        });
      });

      describe('finish minting', () => {
        describe('when the sender is the token owner', () => {
          const from = owner;

          describe('when the token minting was not finished', () => {
            it('finishes token minting', async () => {
              await token.finishMinting({ from });

              const mintingFinished = await token.mintingFinished();
              expect(mintingFinished).to.be.true();
            });

            it('emits a mint finished event', async () => {
              const { logs } = await token.finishMinting({ from });

              expect(logs.length).to.to.equal(1);
              expect(logs[0].event).to.to.equal('MintFinished');
            });
          });

          describe('when the token minting was already finished', () => {
            beforeEach(async () => {
              await token.finishMinting({ from });
            });

            it('reverts', async () => {
              await expectRevert(token.finishMinting({ from }));
            });
          });
        });

        describe('when the sender is not the token owner', () => {
          const from = notOwner;

          describe('when the token minting was not finished', () => {
            it('reverts', async () => {
              await expectRevert(token.finishMinting({ from }));
            });
          });

          describe('when the token minting was already finished', () => {
            beforeEach(async () => {
              await token.finishMinting({ from: owner });
            });

            it('reverts', async () => {
              await expectRevert(token.finishMinting({ from }));
            });
          });
        });
      });

      contract('Claimable', () => {
        beforeEach(async () => {
          token = await CotiDime.new();
        });

        it('should have an owner', async () => {
          const curOwner = await token.owner();
          expect(curOwner).to.not.equal(0);
        });

        it('changes pendingOwner after transfer', async () => {
          const newOwner = userOne;
          await token.transferOwnership(newOwner);
          const pendingOwner = await token.pendingOwner();

          expect(pendingOwner).to.equal(newOwner);
        });

        it('should prevent to claimOwnership from no pendingOwner', async () => {
          await expectRevert(token.claimOwnership({ from: userTwo }));
        });

        it('should prevent non-owners from transfering', async () => {
          const other = userTwo;
          const curOwner = await token.owner.call();

          expect(curOwner).to.not.equal(other);
          await expectRevert(token.transferOwnership(other, { from: other }));
        });

        describe('after initiating a transfer', () => {
          const newOwner = userOne;

          beforeEach(async () => {
            await token.transferOwnership(newOwner);
          });

          it('changes allow pending owner to claim ownership', async () => {
            await token.claimOwnership({ from: newOwner });
            const curOwner = await token.owner();

            expect(curOwner).to.equal(newOwner);
          });
        });
      });

      describe('HasNoEther', () => {
        const amount = web3.toWei('1', 'ether');

        it('should be constructorable', async () => {
          await CotiDime.new();
        });

        it('should not accept ether in constructor', async () => {
          await expectRevert(CotiDime.new({ value: amount }));
        });

        it('should not accept ether', async () => {
          token = await CotiDime.new();

          await expectRevert(
            ethSendTransaction({
              from: userOne,
              to: token.address,
              value: amount,
            }),
          );
        });

        it('should allow owner to reclaim ether', async () => {
          // Create contract
          token = await CotiDime.new();
          const startBalance = await ethGetBalance(token.address);
          expect(startBalance.toNumber()).to.equal(0);
          // Force ether into it
          const forceEther = await ForceEther.new({ value: amount });
          await forceEther.destroyAndSend(token.address);
          const forcedBalance = await ethGetBalance(token.address);
          expect(forcedBalance.toString(10)).to.equal(amount);

          // Reclaim
          const ownerStartBalance = await ethGetBalance(owner);
          await token.reclaimEther();
          const ownerFinalBalance = await ethGetBalance(owner);
          const finalBalance = await ethGetBalance(token.address);
          expect(finalBalance.toNumber()).to.equal(0);
          expect(ownerFinalBalance.toNumber()).to.be.above(ownerStartBalance.toNumber());
        });

        it('should allow only owner to reclaim ether', async () => {
          // Create contract
          token = await CotiDime.new({ from: owner });

          // Force ether into it
          const forceEther = await ForceEther.new({ value: amount });
          await forceEther.destroyAndSend(token.address);
          const forcedBalance = await ethGetBalance(token.address);
          expect(forcedBalance.toString((10))).to.equal(amount);

          // Reclaim
          await expectRevert(token.reclaimEther({ from: userOne }));
        });
      });

      describe('Mintable', () => {
        const amount = 100;

        describe('when the sender has the minting permission', () => {
          const from = owner;

          describe('when the token minting is not finished', () => {
            it('mints the requested amount', async () => {
              await token.mint(owner, amount, { from });

              const balance = await token.balanceOf(owner);
              expect(balance.toNumber()).to.equal(amount);
            });

            it('emits a mint and a transfer event', async () => {
              const { logs } = await token.mint(owner, amount, { from });

              expect(logs.length).to.equal(2);
              expect(logs[0].event).to.equal('Mint');
              expect(logs[0].args.to).to.equal(owner);
              expect(logs[0].args.amount.toNumber()).to.equal(amount);
              expect(logs[1].event).to.equal('Transfer');
            });
          });

          describe('when the token minting is finished', () => {
            beforeEach(async () => {
              await token.finishMinting({ from: owner });
            });

            it('reverts', async () => {
              await expectRevert(token.mint(owner, amount, { from }));
            });
          });

          describe('minting functionalities', async() => {
            it('minting is accumulative and personal', async() => {
              const initialBalance = await token.balanceOf.call(userOne);
              expect(initialBalance).to.be.bignumber.equal(0);

              await token.mint(userOne, oneCotiDime);
              await token.mint(userTwo, oneCotiDime);
              await token.mint(userOne, 2 * oneCotiDime);

              const userOneBalance = await token.balanceOf.call(userOne);
              const userTwoBalance = await token.balanceOf.call(userTwo);

              expect(userOneBalance).to.be.bignumber.equal(3 * oneCotiDime);
              expect(userTwoBalance).to.be.bignumber.equal(oneCotiDime);
            });
          });
        });

        describe('when the sender has not the minting permission', () => {
          const from = notOwner;

          describe('when the token minting is not finished', () => {
            it('reverts', async () => {
              await expectRevert(token.mint(owner, amount, { from }));
            });
          });

          describe('when the sender is finish minting', () => {
            it('reverts', async() => {
              await expectRevert(token.finishMinting({
                from: notOwner,
              }));
            });

            describe('when the token minting is already finished', () => {
              beforeEach(async () => {
                await token.finishMinting({ from: owner });
              });

              it('reverts', async () => {
                await expectRevert(token.mint(owner, amount, { from }));
              });
            });
          });
        });
      });
    });
  });
});
