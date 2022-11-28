const { expect } = require("chai");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

const toBytes32 = (bn) => {
  return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
};

const setStorageAt = async (address, index, value) => {
  await ethers.provider.send("hardhat_setStorageAt", [address, index, value]);
  await ethers.provider.send("evm_mine", []); // Just mines to the next block
};

describe("USDTAirdrop contract", function () {
  async function deployUSDTAirdropFixture() {
    const RDS = await ethers.getContractAt(
      "GTToken",
      "0xc06a9758d89289d72e09e412bB51913206A183fE"
    );

    const USDTBank = await ethers.getContractAt(
      "ERC20TokenBank",
      "0x21A3dbeE594a3419D6037D6D8Cee0B1E10Bf345C"
    );

    const trustList = await ethers.getContractAt(
      "TrustList",
      "0xB6C835d93ffCcdcb22ca2C7c1ec1822F29D3d0bC"
    );

    const USDTAirdrop = await ethers.getContractFactory("USDTAirdrop");
    const totalAward = 15000;
    const startAt = 60;
    const endAt = 300;
    const usdtAirdrop = await USDTAirdrop.deploy(
      RDS.address,
      USDTBank.address,
      totalAward,
      startAt,
      endAt
    );
    await usdtAirdrop.deployed();

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    return {
      RDS,
      USDTBank,
      USDTAirdrop,
      usdtAirdrop,
      trustList,
      totalAward,
      owner,
      addr1,
      addr2,
      addr3,
    };
  }

  it("Should claim airdrop if have RDS token", async () => {
    // load fixtrue
    const { RDS, USDTBank, usdtAirdrop, trustList, totalAward } =
      await loadFixture(deployUSDTAirdropFixture);

    // get a valid holder on token tracker
    const holder1 = "0x57955d7aa271dbdde92d67e0ef52d90c6e4089ca";
    const impersonateSigner = await ethers.getImpersonatedSigner(holder1);

    // get information on the contract and holder
    const _creationBlock = await usdtAirdrop.creationBlock();
    const _totalAward = await usdtAirdrop.totalAward();
    await expect(_totalAward).to.equal(totalAward * 10 ** 6);
    const balanceOfImpersonteSigner = await RDS.balanceOfAt(
      impersonateSigner.address,
      _creationBlock
    );

    // get award amount
    const totalSupply = await RDS.totalSupplyAt(_creationBlock);
    const awardAmount = ethers.BigNumber.from(balanceOfImpersonteSigner)
      .mul(totalAward)
      .mul(10 ** 6)
      .div(totalSupply);
    console.log("User balance is:", balanceOfImpersonteSigner.toString());
    console.log("Total balance is:", totalSupply.toString());
    console.log("Award amount is:", awardAmount.toString());
    const [usdtAddr] = await USDTBank.token();
    const usdt = await ethers.getContractAt("IERC20", usdtAddr);
    await time.increase(60);

    // give usdtAirdrop permission to call issue() function
    await expect(await trustList.is_trusted(usdtAirdrop.address)).to.equal(
      false
    );
    const index = ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [usdtAirdrop.address, 0] // key, slot
    );
    await setStorageAt(
      trustList.address,
      index,
      toBytes32(ethers.BigNumber.from("1")).toString()
    );
    await expect(await trustList.is_trusted(usdtAirdrop.address)).to.equal(
      true
    );

    // claim airdrop
    await expect(
      usdtAirdrop.connect(impersonateSigner).claim()
    ).to.changeTokenBalances(
      usdt,
      [USDTBank, impersonateSigner],
      [-awardAmount, awardAmount]
    );
  });
});
