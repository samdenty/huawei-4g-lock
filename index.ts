require("dotenv").config();

import * as puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("http://192.168.1.1/html/home.html");

  await page.waitForSelector("#status_img_rat");
  const connectionType = await page.evaluate(
    () => document.querySelector("#status_img_rat")!.textContent
  );

  if (connectionType !== "3G") {
    console.log("not 3g, exiting");
    browser.close();
    return;
  }

  await Promise.all([
    page.evaluate(
      (user, pass) => {
        const settings =
          document.querySelector<HTMLButtonElement>("#settings")!;
        settings.click();

        const username = document.querySelector<HTMLInputElement>("#username")!;
        const password = document.querySelector<HTMLInputElement>("#password")!;
        username.value = user;
        password.value = pass;

        const login = document.querySelector<HTMLInputElement>("#pop_login")!;
        login.click();
      },
      process.env.USERNAME!,
      process.env.PASSWORD!
    ),
    page.waitForNavigation(),
  ]);

  console.log("go to network settings");
  await page.goto("http://192.168.1.1/html/mobilenetworksettings.html", {
    timeout: 60000,
  });

  console.log("wait for network select");
  await page.waitForSelector("#network_select");
  console.log("search for networks");
  await page.evaluate(() => {
    const networkSelect =
      document.querySelector<HTMLButtonElement>("#network_select")!;
    networkSelect.value = "1";

    const apply = document.querySelector<HTMLButtonElement>(
      "#mobilensetting_apply"
    )!;
    apply.click();

    const ok = document.querySelector<HTMLButtonElement>("#pop_confirm")!;
    ok.click();
  });

  console.log("wait for network list");
  await page.waitForSelector("#plmn_list", { timeout: 120000 });

  console.log("select network");
  const changed = await page.evaluate((net) => {
    const networks = [
      ...document.querySelectorAll<HTMLLabelElement>("#plmn_list tr td label"),
    ].map((label) => {
      const separator = label.textContent!.lastIndexOf(" ");
      const name = label.textContent!.substring(0, separator);
      const type = label.textContent!.slice(separator + 1);
      return [name, type, label] as const;
    });

    let network = networks.find(
      ([name, network]) => name.includes(net) && network === "4G"
    );

    if (!network) {
      network = networks.find(
        ([name, network]) => name.includes(net) && network === "3G"
      );
    }

    if (!network) {
      return false;
    }

    network[2].click();

    const ok = document.querySelector<HTMLButtonElement>("#pop_OK")!;
    ok.click();

    return true;
  }, process.env.NETWORK!);

  if (changed) {
    console.log("wait for success");
    await page.waitForXPath(
      "//*[@class='info_content' and contains(., 'Success.')]",
      { timeout: 60000 }
    );
  }

  console.log("done");
  await browser.close();
})();
