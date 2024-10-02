const puppeteer = require("puppeteer");
const { expect } = await import('chai')
require("../app");
const { seed_db, testUserPassword } = require("../util/seed_db");
const Job = require("../models/Job");

let testUser = null;

let page = null;
let browser = null;
// Launch the browser and open a new blank page
describe("jobs-ejs puppeteer test", function () {
  before(async function () {
    this.timeout(10000);
    //await sleeper(5000)
    browser = await puppeteer.launch({headless: false, slowMo: 100});
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
  });
  after(async function () {
    this.timeout(5000);
    await browser.close();
  });
  describe("got to site", function () {
    it("should have completed a connection", async function () {});
  });
  describe("index page test", function () {
    this.timeout(10000);
    it("finds the index page logon link", async () => {
      this.logonLink = await page.waitForSelector(
        "a ::-p-text(Click this link to logon)",
      );
    });
    it("gets to the logon page", async () => {
      await this.logonLink.click();
      await page.waitForNavigation();
      const email = await page.waitForSelector('input[name="email"]');
    });
  });
  describe("logon page test", function () {
    this.timeout(20000);
    it("resolves all the fields", async () => {
      this.email = await page.waitForSelector('input[name="email"]');
      this.password = await page.waitForSelector('input[name="password"]');
      this.submit = await page.waitForSelector("button ::-p-text(Logon)");
    });
    it("sends the logon", async () => {
      testUser = await seed_db();
      await this.email.type(testUser.email);
      await this.password.type(testUserPassword);
      await this.submit.click();
      await page.waitForNavigation();
      await page.waitForSelector(`p ::-p-text(${testUser.name} is logged on.)`);
      await page.waitForSelector("a ::-p-text(change the secret)");
      await page.waitForSelector('a[href="/secretWord"]');
      const copyr = await page.waitForSelector("p ::-p-text(copyright)");
      const copyrText = await copyr.evaluate((el) => el.textContent);
      console.log("copyright text: ", copyrText);
    });
  });

  describe("Job Functionality Tests", function () {
    this.timeout(20000);
    it(" Jobs page with 20 tr entries", async () => {
        const page = await browser.newPage();
        const jobspage = await page.content("http://localhost:3000/jobs");
        const trCount = await jobspage.evaluate(() => {
            const html = document.documentElement.innerHTML;
            return html.split('<tr').length -1; 
        });
        console.log(`Number of <tr> tags on the page: ${trCount}`);
    });
    it("Click on a job button and add a job comes up", async () => {
        const page = await browser.newPage();
        const homePage = await page.content("http://localhost:3000/");
        const addJobPage = await homePage.evaluate(() => {
            homePage.click('#add-job-anchor')
        });
    });

it('should add a new job entry and verify it in the job list', async () => {
    await Promise.all([
         homePage.click('a#add-job-anchor'),
         homepage.content("http://localhost:3000/jobs/new")
    ]);

    await homepage.type('input[name="company"]', 'Test Company');
    await homepage.type('input[name="position"]', 'Software Engineer');
    await homepage.type('input[name="status"]', 'Active');

    await Promise.all([
        page.waitForNavigation(),
        page.click('a#add-job-anchor'),
    ]);
    const jobEntryFound = await page.evaluate(() => {
        const jobRows = Array.from(document.querySelectorAll('#job-list tr')); // Adjust selector as needed

        // Use .find() to locate the row with the expected company, position, and status
        const newJob = jobRows.find(row => {
            const columns = row.querySelectorAll('td');
            const company = columns[0]?.innerText.trim();
            const position = columns[1]?.innerText.trim();
            const status = columns[2]?.innerText.trim();
            return company === 'Test Company' && position === 'Software Engineer' && status === 'Active';
        });

        return !!newJob; 
    });

    expect(jobEntryFound).to.be.true; 
});

  })

});







