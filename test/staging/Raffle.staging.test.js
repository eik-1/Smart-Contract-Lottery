const { network, ethers, deployments, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", function () {
          let raffle, raffleContract, raffleEnteranceFee, deployer, interval

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              raffleContract = await ethers.getContract("Raffle")
              raffle = raffleContract.connect(deployer)
              raffleEnteranceFee = await raffle.getEnteranceFee()
          })

          describe("fulfillRandomWords", () => {
              it("works with live chainlink keepers and chainlink vrf", async () => {
                  this.timeout(200000)
                  const [startingTimeStamp, accounts] = await Promise.all([
                      raffle.getLatestTimeStamp(),
                      ethers.getSigners(),
                  ])

                  await new Promise(async (resolve, reject) => {
                      //set up listener before entering raffle
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired")
                          try {
                              const recentWinner = await raffle.getRecenetWinner()
                              const raffleState = await raffle.getRaffleState()
                              const endBal = await accounts[0].getBalance()
                              const winnerEndingBalance = parseFloat(
                                  ethers.utils.formatEther(endBal),
                              )
                              const endingTimeStamp = await raffle.getLatestTimeStamp()

                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState, 0)
                              assert(winnerEndingBalance > winnerStartingBalance)
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      //Entering the raffle
                      await raffle.enterRaffle({ value: raffleEnteranceFee })
                      const startBal = await accounts[0].getBalance()
                      const winnerStartingBalance = parseFloat(ethers.utils.formatEther(startBal))

                      //Code won't continue until the event is fired
                  })
              })
          })
      })
