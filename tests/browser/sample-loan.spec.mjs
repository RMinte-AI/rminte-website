import { test, expect } from "@playwright/test";
import { run, afterURL, setup } from "./helpers.mjs";
import { readFileSync } from "node:fs";

if (run.scope.sampleLoan)
  test("sample loan: public application, approval and machine allocation", async ({
    page,
  }, testInfo) => {
    const server = { url: afterURL },
      errors = [];
    await setup(page, "zh");
    await page.setViewportSize({ width: 1440, height: 900 });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(server.url + "/?lang=zh");
    await page.locator("[data-contact-toggle]").scrollIntoViewIfNeeded();
    await page.locator("[data-contact-toggle]").click();
    await page.locator("[data-sample-loan-open]").click();
    const app = page.locator("[data-sample-loan-host]");
    await app.locator("#application-dialog").waitFor({ state: "visible" });
    await page.evaluate(() => document.fonts.ready);

    await app.locator("#application-form button[type=submit]").click();
    await expect(app.locator("[aria-invalid=true]")).toHaveCount(11);
    for (const [key, value] of Object.entries({
      company: "集成浏览器验证公司",
      contact: "测试联系人",
      phone: "+86 13800000000",
      email: "dealer@example.com",
      registeredAddress: "成都高新区注册地址",
      companyAddress: "成都联系地址",
      receiver: "测试收件人",
      receiverPhone: "+86 13800000000",
      shippingAddress: "成都收货地址",
      days: "15",
    }))
      await app.locator(`[name=${key}]`).fill(value);
    const model = app
      .locator("[name=model]")
      .locator("..")
      .locator(".select-trigger");
    await model.click();
    await app
      .getByRole("option", {
        name: "RM-01 128G T5000 (2070 TFLOPS)",
        exact: true,
      })
      .click();
    await app.locator("[name=days]").fill("10000000000000000");
    await app.locator("#application-form button[type=submit]").click();
    await expect(app.locator("#confirmation-dialog")).toBeVisible();
    await app.locator("#confirm-application").click();
    await expect(app.locator("[name=days]")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await app.locator("[name=days]").fill("15");
    await app.locator("#application-form button[type=submit]").click();
    await expect(app.locator("[aria-invalid=true]")).toHaveCount(0);

    await app.locator("#confirmation-dialog").waitFor({ state: "visible" });
    await app.locator("#confirm-application").click();
    await app.locator("#application-success").waitFor({ state: "visible" });

    const requestNo = await app.locator("#success-id").innerText();
    await app.locator("#application-success [data-close]").click();
    await page.goto(afterURL + "/cases/");
    await page.locator("#access [data-action=login]").click();
    const password = readFileSync(
      process.env.RMINTE_AFTER_FIXTURE +
        "/services/case-access/.local/admin-login.txt",
      "utf8",
    ).match(/密码：(.*)/)[1];
    await page.getByLabel("用户名", { exact: true }).fill("admin");
    await page.getByLabel("密码", { exact: true }).fill(password);
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await expect(
      page.locator('#access a[href="/sample-loan/#admin"]'),
    ).toBeVisible();
    await page.goto(server.url + "/sample-loan/#admin");
    await page.locator("[data-request]").first().waitFor();
    await page.locator("[data-request]").filter({ hasText: requestNo }).click();
    await page.locator("#admin-detail").waitFor({ state: "visible" });

    await expect(page.locator("#approval-form [name=company]")).toHaveValue(
      "集成浏览器验证公司",
    );
    await page.locator("[data-admin-tab=machines]").click();
    await page.locator("#new-machine").click();
    const mf = page.locator("#machine-form");
    const machineNo = "BROWSER-NO-" + crypto.randomUUID();
    await mf.locator("[name=no]").fill(machineNo);
    await mf.locator("[name=sn]").fill("BROWSER-SN-" + crypto.randomUUID());
    await mf.locator("[name=notes]").fill("存储卡、电源与包装齐全");
    await mf
      .locator("[name=model]")
      .locator("..")
      .locator(".select-trigger")
      .click();
    await mf
      .getByRole("option", {
        name: "RM-01 128G T5000 (2070 TFLOPS)",
        exact: true,
      })
      .click();
    await mf.locator("button[type=submit]").click();
    await page.locator("#machine-dialog").waitFor({ state: "hidden" });
    await page.locator("[data-admin-tab=requests]").click();
    await page.locator("[data-request]").filter({ hasText: requestNo }).click();
    await page.locator("#machine-options button").first().waitFor();
    await page
      .locator("#machine-options button")
      .filter({ hasText: machineNo })
      .click();
    const af = page.locator("#approval-form"),
      today = new Date().toISOString().slice(0, 10),
      due = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
    for (const [key, value] of Object.entries({
      identityNotes: "隔离浏览器核验记录",
      start: today + "T12:00",
      end: due,
      value: "50000.00",
      cardSpecs: "测试卡 1TB PCIe",
      cardSerial: "CARD-BROWSER-001",
      defaultAccountInfo: "用户 test\n密码 a | $& <xx> ",
      accessories: "主机、电源、存储卡及包装",
      inspection: "外观无损、功能正常、配件齐全",
      carrier: "顺丰",
      tracking: "BROWSER-TRACK",
      insuranceProof: "BROWSER-INSURED",
      returnName: "样机收件处",
    }))
      await af.locator("[name=" + key + "]").fill(value);
    await af.locator("[name=identityVerified]").check();
    await page.locator("#photo-upload").setInputFiles({
      name: "isolated-photo.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCWQAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await expect(page.locator("#photo-grid img")).toHaveCount(1);
    await expect(page.locator("#photo-upload")).toBeEnabled();
    await page.locator("#complete-approval").click();
    await page.locator("#approval-result").waitFor({ state: "visible" });

    await page.locator("#detail-progress [data-progress=deposit]").click();
    await page.locator("#finance-amount").fill("30000.00");
    const reference = "BROWSER-RECEIPT-" + crypto.randomUUID();
    await page.locator("#finance-reference").fill(reference);
    await page.locator("#progress-form button[type=submit]").click();
    await expect(page.locator("#progress-dialog")).not.toBeVisible();
    await page.locator("[data-finance=deposit]").click();
    await page.locator("#finance-amount").fill("1.00");
    await page.locator("#finance-reference").fill(reference);
    await page.locator("#progress-form button[type=submit]").click();
    await expect(
      page.locator("#progress-dialog [data-command-error]"),
    ).toContainText("记录已被其他操作使用");
    await expect(page.locator("#finance-amount")).toHaveValue("1.00");
    await page
      .locator("#progress-dialog")
      .getByRole("button", { name: "取消", exact: true })
      .click();
    await page.locator("#back-to-list").click();
    await page.locator("[data-filter=approved]").click();
    const requestRow = page
      .locator(".request-row")
      .filter({ hasText: requestNo });
    await expect(requestRow).toContainText("押金已到账");
    await expect(requestRow).not.toContainText("押金待到账");

    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      await testInfo.attach("sample admin " + width, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    }

    if (errors.length) throw new Error(errors.join("\n"));
  });
