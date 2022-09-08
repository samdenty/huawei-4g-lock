require("dotenv").config();

import * as puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("http://192.168.1.1/html/home.html");

  await page.waitForSelector("#status_img_rat");
  const connectionType = await page.evaluate(
    () => document.querySelector("#status_img_rat")!.textContent
  );

  if (connectionType !== "3G") {
    return;
  }

  await page.evaluate(() => {
    const settings = document.querySelector<HTMLButtonElement>("#settings")!;
    settings.click();

    const username = document.querySelector<HTMLInputElement>("#username")!;
    const password = document.querySelector<HTMLInputElement>("#password")!;
    username.value = process.env.USERNAME!;
    password.value = process.env.PASSWORD!;

    const login = document.querySelector<HTMLInputElement>("#pop_login")!;
    login.click();
  });

  await browser.close();
})();
