const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")

const VRF_SUB_FUND_AMT = ethers.utils.parseEther("2")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainID = network.config.chainId
    let VRFCoordinatorV2Address, subscriptionId

    log("Deploying Contract...")
    if (developmentChains.includes(network.name)) {
        const VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        VRFCoordinatorV2Address = VRFCoordinatorV2Mock.address
        const txResponse = await VRFCoordinatorV2Mock.createSubscription()
        const txReceipt = await txResponse.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
        // Funding the subscription
        await VRFCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMT)
    } else {
        VRFCoordinatorV2Address = networkConfig[chainID]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainID]["subId"]
    }

    const gasLane = networkConfig[chainID]["gasLane"]
    const entranceFee = networkConfig[chainID]["entranceFee"]
    const callbackGasLimit = networkConfig[chainID]["callbackGasLimit"]
    const interval = networkConfig[chainID]["interval"]
    const args = [
        VRFCoordinatorV2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log("Contract deployed to:", raffle.address)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API) {
        log("Verifying contract...")
        await verify(raffle.address, args)
    }
    log("----------------------------------------------------")
}

module.exports.tags = ["all", "raffle"]
