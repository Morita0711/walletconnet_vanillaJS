import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
  WagmiCore,
  WagmiCoreChains,
  WagmiCoreConnectors,
} from "https://unpkg.com/@web3modal/ethereum@2.6.2";
import "https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js";
import { Web3Modal } from "https://unpkg.com/@web3modal/html@2.6.2";
import "https://javascript.wert.io/wert-4.0.0.js";
import { ethers } from "./etheres-5.2.esm.min.js";

const { getNetwork, getWalletClient } = WagmiCore;

const contract_address = "0x7ade5fD13638782Af996935c1aC20D8e0A73551f";
const token_address = "0x8f7296E684BD57c5C898FA78043d06D164208c3D";

const WSTFXabi = [
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

const Erc20abi = [
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
  const { account, chain, transport } = walletClient;

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new ethers.providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);

  const contract = new ethers.Contract(contract_address, WSTFXabi, signer);
  const usdtContract = new ethers.Contract(token_address, Erc20abi, signer);
  const decimal = await usdtContract.decimals();

  if (myPurchaseObject.referredByETH) {
    await contract.buy_eth_referral(myPurchaseObject.referredByETH, {
      value: ethers.utils.parseEther(myPurchaseObject.amount),
    });
    return;
  }

  if (myPurchaseObject.referredByUSDT) {
    await usdtContract.approve(
      contract_address,
      ethers.utils.parseUnits(myPurchaseObject.amount, decimal)
    );

    await contract.buy_usdt_referral(
      ethers.utils.parseUnits(myPurchaseObject.amount, decimal),
      myPurchaseObject.referredByUSDT
    );
    return;
  }

  if (myPurchaseObject.currency == "ETH") {
    await contract.buy_eth({
      value: ethers.utils.parseEther(myPurchaseObject.amount),
    });
    return;
  }
  if (myPurchaseObject.currency == "USDT") {
    await usdtContract.approve(
      contract_address,
      ethers.utils.parseUnits(myPurchaseObject.amount, decimal)
    );
    await contract.buy_usdt(
      ethers.utils.parseUnits(myPurchaseObject.amount, decimal)
    );
    return;
  }
};

// ----------------------------------
//import { WalletIo } from "./walletio.js"

// Equivalent to importing from @wagmi/core
const {
  configureChains,
  createConfig,
  getAccount,
  watchAccount,
  watchNetwork,
} = WagmiCore;

// Equivalent to importing from @wagmi/core/chains
//const { mainnet, polygon, avalanche, arbitrum } = WagmiCoreChains
//For Test
const { goerli, sepolia, bscTestnet } = WagmiCoreChains;

// Equivalent to importing from @wagmi/core/providers
const { CoinbaseWalletConnector } = WagmiCoreConnectors;

// const chains = [arbitrum, mainnet, polygon]

//For Test
const chains = [goerli, sepolia, bscTestnet];

const projectId = "6a02a0682555cc8fc50aea2c431e0ecb";

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient,
});

var address = "";
var walletConnected = false;
var chain = "ethereum";
var currency = "ETH";
var stageComplete;
var ethBal = 0.0;
var usdtBal = 0.0;
var price;
var ethprice;

$("#pointsSection").hide();

$("#buy-currency-amt").css(
  "background-image",
  "url(../images/widget/ethereum.svg)"
);

const ethereumClient = new EthereumClient(wagmiConfig, chains);
const web3modal = new Web3Modal({ projectId }, ethereumClient);

ajaxStatusUpdate();
var custUpdateTimer;
var statusUpdateTimer = setInterval(function () {
  ajaxStatusUpdate();
}, 60000);

const acc_state = watchAccount((account) => {
  console.log(account.isConnected, account.address);
  if (account.isConnected) {
    console.log("isConnected: " + account.address);
    address = account.address;
    walletConnected = true;

    if ($("#referred-by").val() == "NONE") {
      ajaxPostAddress({ address: address });
    } else {
      var ref = $("#referred-by").val();
      console.log(ref);
      ajaxPostAddressReferral({ address: address, referredBy: ref });
    }

    custUpdateTimer = setInterval(function () {
      ajaxPostAddress({ address: account.address });
    }, 60000);
  } else {
    console.log("Walled Disconnected");
    walletConnected = false;
    $("#pointsSection").hide();
    clearInterval(custUpdateTimer);
  }
});
const net_state = watchNetwork((network) => console.log("network", network));

async function ajaxStatusUpdate() {
  try {
    await $.ajax({
      type: "GET",
      url: "/ajax/sale-info",
      dataType: "json",
      contentType: "application/json",
    }).done(function (result) {
      updateStatus(result);
    });
  } catch (error) {
    console.log("XHR Request failed with:", error);
    return;
  }
}

async function ajaxPostAddress(content) {
  try {
    await $.ajax({
      type: "POST",
      url: "/ajax/address",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(content),
    }).done(function (result) {
      updateUser(result);
    });
  } catch (error) {
    console.log("XHR Request failed with:", error);
    return;
  }
}

async function ajaxPostAddressReferral(content) {
  try {
    await $.ajax({
      type: "POST",
      url: "/ajax/referred-address",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(content),
    }).done(function (result) {
      updateUser(result);
    });
  } catch (error) {
    console.log("XHR Request failed with:", error);
    return;
  }
}

async function ajaxPostTelegram(content) {
  try {
    await $.ajax({
      type: "POST",
      url: "/ajax/telegram",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(content),
    }).done(function (result) {
      console.log(result);
    });
  } catch (error) {
    console.log("XHR Request failed with:", error);
    return;
  }
}

async function ajaxPostTwitter(content) {
  try {
    await $.ajax({
      type: "POST",
      url: "/ajax/twitter",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(content),
    }).done(function (result) {
      console.log(result);
    });
  } catch (error) {
    console.log("XHR Request failed with:", error);
    return;
  }
}

async function ajaxPostDiscord(content) {
  try {
    await $.ajax({
      type: "POST",
      url: "/ajax/discord",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(content),
    }).done(function (result) {
      console.log(result);
    });
  } catch (error) {
    console.log("XHR Request failed with:", error);
    return;
  }
}

async function ajaxTwitterPost(content) {
  try {
    await $.ajax({
      type: "POST",
      url: "/ajax/twitter-post",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(content),
    }).done(function (result) {
      console.log(result);
    });
  } catch (error) {
    console.log("XHR Request failed with:", error);
    return;
  }
}

async function ajaxRegisterEmail(content) {
  try {
    await $.ajax({
      type: "POST",
      url: "/ajax/register-email",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(content),
    }).done(function (result) {
      console.log(result);
      return result;
    });
  } catch (error) {
    console.log("XHR Request failed with:", error);
    return;
  }
}

function updateStatus(status) {
  console.log(status);
  price = status.priceUSD;
  ethprice = status.priceETH;

  stageComplete = status.stageCompletion;
  $("#wstfx-price").text("$" + status.priceUSD);
  $("#raised-total").text(status.raised.toLocaleString("en-US"));
  $("#stage-target").text(status.stageGoal.toLocaleString("en-US"));
  $("#next-price").text("$" + status.nextPrice);
}

function updateUser(user) {
  // Purhcased Tokens
  console.log(user);

  if (walletConnected == true) {
    $("#pointsSection").show();
  } else {
    $("#pointsSection").hide();
  }
  ethBal = user.ethBal;
  usdtBal = user.usdt;
  if (currency == "ETH") {
    $("#currency-balance").text(ethBal).toLocaleString("en-US");
    $("#currency-label").text("ETH Balance");
    $("#small-currency").text("ETH");
  }

  if (currency == "USDT") {
    $("#currency-balance").text(usdtBal).toLocaleString("en-US");
    $("#currency-label").text("USDT Balance");
    $("#small-currency").text("USDT");
  }

  if (currency == "USD") {
    $("#currency-balance").html("&nbsp;");
    $("#currency-label").text("");
    $("#small-currency").text("USD");
  }

  $("#total-points").html(user.points);
  $("#total-purchased").text(user.purchased.toLocaleString("en-US"));
  // Referral Link

  $("#referaltext").text(user.referral);
  $("#referrd-by").value = user.referredBy;

  if (user.emailStatus == "NONE") {
    $("#pointsEntireSectionEmail").show();
    $("#emailAddressBtn").show();
  }
  if (user.emailStatus == "UNCONFIRMED") {
    $("#pointsEntireSectionEmail").show();
    $("#emailAddress").val("");
    $("#emailAddressBtn").hide();
    $("#emailAddress").attr("placeholder", "Please Confirm Email Sent");
  }
  if (user.emailStatus == "REGISTERED") {
    $("#pointsEntireSectionEmail").hide();
  }

  if (user.telegram == true) {
    $("#pointsEntireSectionTelegram").hide();
  } else {
    $("#pointsEntireSectionTelegram").show();
    $("#telegramIDBtn").show();
  }

  if (user.twitter == true) {
    $("#pointsEntireSectionTwitter").hide();
  } else {
    $("#pointsEntireSectionTwitter").show();
    $("#twitterHandleBtn").show();
  }

  if (user.discord == true) {
    $("#pointsEntireSectionDiscord").hide();
  } else {
    $("#pointsEntireSectionDiscord").show();
    $("#discordIDBtn").show();
  }

  $("#WSTFX-HashtagBtn").show();
  $("#WSTFX-Hashtag").attr("URL For Twitter Post");
  // Points Earned
}

$("#emailAddressBtn").click(function () {
  var resp = ajaxRegisterEmail({
    address: address,
    email: $("#emailAddress").val(),
  });
  if (resp.status == "OK") {
    $("#emailAddress").val("");
    $("#emailAddressBtn").hide();
    $("#emailAddress").attr("placeholder", "Please Confirm Email Sent");
  }
});

$("#telegramIDBtn").click(function () {
  var resp = ajaxPostTelegram({
    address: address,
    telegramId: $("#telegramID").val(),
  });
  $("#telegramID").val("");
  $("#telegramIDBtn").hide();
  $("#telegramID").attr("placeholder", "Entry Has Been Submitted");
});

$("#twitterHandleBtn").click(function () {
  var resp = ajaxPostTwitter({
    address: address,
    twitterId: $("#twitterHandle").val(),
  });
  $("#twitterHandle").val("");
  $("#twitterHandleBtn").hide();
  $("#twitterHandle").attr("placeholder", "Entry Has Been Submitted");
});

$("#discordIDBtn").click(function () {
  var resp = ajaxPostDiscord({
    address: address,
    discordId: $("#discordID").val(),
  });
  $("#discordID").val("");
  $("#discordIDBtn").hide();
  $("#discordID").attr("placeholder", "Entry Has Been Submitted");
});

$("#WSTFX-HashtagBtn").click(function () {
  var resp = ajaxTwitterPost({
    address: address,
    postUrl: $("#WSTFX-Hashtag").val(),
  });
  $("#WSTFX-Hashtag").val("");
  $("#WSTFX-HashtagBtn").hide();
  $("#WSTFX-Hashtag").attr("placeholder", "Entry Has Been Submitted");
});
var amt = 0.0;
$("#buy-currency-amt").on("input", function () {
  if (chain == "ethereum" && currency == "ETH") {
    console.log("procesing");
    amt = $("#buy-currency-amt").val();
    $("#buy-token-amt").val((amt / ethprice).toFixed());
  }

  if (chain == "ethereum" && currency == "USDT") {
    console.log("procesing");
    amt = $("#buy-currency-amt").val();
    $("#buy-token-amt").val((amt / price).toFixed());
  }

  if (currency == "USD") {
    console.log("procesing");
    amt = $("#buy-currency-amt").val();
    $("#buy-token-amt").val((amt / price).toFixed());
  }
});

$("#buy-token-amt").on("input", function () {
  if (chain == "ethereum" && currency == "ETH") {
    console.log("procesing");
    amt = $("#buy-token-amt").val();
    $("#buy-currency-amt").val((amt * ethprice).toFixed(4));
  }

  if (chain == "ethereum" && currency == "USDT") {
    console.log("procesing");
    amt = $("#buy-token-amt").val();
    $("#buy-currency-amt").val((amt * price).toFixed(2));
  }

  if (currency == "USD") {
    console.log("procesing");
    amt = $("#buy-token-amt").val();
    $("#buy-currency-amt").val((amt * price).toFixed(2));
  }
});

$("#eth").change(function () {
  currency = "ETH";
  $("#buy-currency-amt").val(0);
  $("#buy-currency-amt").css(
    "background-image",
    "url(../images/widget/ethereum.svg)"
  );
  if (walletConnected) {
    ajaxPostAddress({ address: address });
  }
});

$("#usdt").change(function () {
  currency = "USDT";
  $("#buy-currency-amt").val(0);
  $("#buy-currency-amt").css(
    "background-image",
    "url(../images/widget/tether-usdt.svg)"
  );
  if (walletConnected) {
    ajaxPostAddress({ address: address });
  }
});

$("#card").change(function () {
  currency = "USD";
  $("#buy-currency-amt").val(0);
  $("#buy-currency-amt").css(
    "background-image",
    "url(../images/widget/card1.svg)"
  );
  if (walletConnected) {
    ajaxPostAddress({ address: address });
  }
});

$("#buy-now").click(function () {
  var purchaseCurrencyAmount = $("buy-currencyu-amt").val();
  if (currency == "USD") {
    console.log("Fired Buy Button - USD");
    ajaxBuy({ address: address, fiatAmount: $("#buy-currency-amt").val() });
  }

  if (currency == "ETH") {
    console.log("Fired Buy Button - ETH");
    ajaxBuyCrypto({
      address: address,
      amount: $("#buy-currency-amt").val(),
      currency: currency,
    });
  }

  if (currency == "USDT") {
    console.log("Fired Buy Button - USDT");
    ajaxBuyCrypto({
      address: address,
      amount: $("#buy-currency-amt").val(),
      currency: currency,
    });
  }
  //Here we go...
});

async function ajaxBuy(content) {
  try {
    await $.ajax({
      type: "POST",
      url: "/ajax/buy-fiat",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(content),
    }).done(function (result) {
      console.log(result.payload);
      const wertWidget = new WertWidget({
        address: result.payload.address,
        click_id: result.payload.click_id,
        commodity: result.payload.commodity,
        commodity_amount: result.payload.commodity_amount,
        network: result.payload.network,
        origin: result.payload.origin,
        partner_id: result.payload.partner_id,
        sc_address: result.payload.sc_address,
        sc_input_data: result.payload.sc_input_data,
        signature: result.payload.signature,
      });

      wertWidget.mount();
    });
  } catch (error) {
    console.log("XHR Request failed with:", error);
    return;
  }
}

async function ajaxBuyCrypto(content) {
  try {
    await $.ajax({
      type: "POST",
      url: "/ajax/buy",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(content),
    }).done(function (result) {
      console.log(result);
      WalletIo(result);
      //Call to sign goes here!!!
    });
  } catch (error) {
    console.log("XHR Request failed with:", error);
    return;
  }
}

export { stageComplete };
