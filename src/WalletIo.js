import {
    WagmiCore
} from "https://unpkg.com/@web3modal/ethereum@2.6.2";
import { ethers } from "https://cdn.ethers.io/lib/ethers-5.2.esm.min.js";

const {
  getNetwork,
  getWalletClient,
} = WagmiCore;

const contract_address = "0x7ade5fD13638782Af996935c1aC20D8e0A73551f"
const token_address = "0x8f7296E684BD57c5C898FA78043d06D164208c3D"


var WSTFXabi = [
    {
      inputs: [],
      name: "buy_eth",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_amountUSDT",
          type: "uint256",
        },
      ],
      name: "buy_usdt",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

var Erc20abi = [
{
constant: true,
inputs: [],
name: "decimals",
outputs: [
    {
    name: "",
    type: "uint8",
    },
],
payable: false,
stateMutability: "view",
type: "function",
},
{
constant: false,
inputs: [
    {
    name: "_spender",
    type: "address",
    },
    {
    name: "_value",
    type: "uint256",
    },
],
name: "approve",
outputs: [
    {
    name: "",
    type: "bool",
    },
],
payable: false,
stateMutability: "nonpayable",
type: "function",
},
{
constant: false,
inputs: [
    {
    name: "_to",
    type: "address",
    },
    {
    name: "_value",
    type: "uint256",
    },
],
name: "transfer",
outputs: [
    {
    name: "",
    type: "bool",
    },
],
payable: false,
stateMutability: "nonpayable",
type: "function",
},
];

export const WalletIo = async (myPurchaseObject) => {
    const walletClient = await getWalletClient({
        chainId: getNetwork().chain.id,
    });
    const { account, chain, transport} = walletClient;

    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
      };
      const provider = new ethers.providers.Web3Provider(transport, network);
      const signer = provider.getSigner(account.address);

      const contract = new ethers.Contract(
        contract_address,
        WSTFXabi,
        signer
      );

      if( myPurchaseObject.referredByETH ) {
        await contract.buy_eth_referral(myPurchaseObject.referredByETH);
        return;
      }

      if( myPurchaseObject.referredByUSDT ){
        await contract.buy_usdt_referral(ethers.utils.parseUnits(myPurchaseObject.amount, decimal), myPurchaseObject.referredByETH);
        return;
      }

      if (myPurchaseObject.currency == "ETH") {
        await contract.buy_eth({
          value: ethers.utils.parseEther(myPurchaseObject.amount),
        });
        return;
      } 
      if (myPurchaseObject.currency == "USDT"){
        const usdtContract = new ethers.Contract(
          token_address,
          Erc20abi,
          signer
       );
        await usdtContract.approve(
          contract_address,
          myPurchaseObject.amount
        );
        const decimal = await usdtContract.decimals();
        await contract.buy_usdt(
          ethers.utils.parseUnits(myPurchaseObject.amount, ethers.BigNumber.toNumber(decimal))
        );
        return;
    }
}