import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";

const path = "./data.json";
const git = simpleGit();

async function makeCommits(n = 100) {
  const YEAR = 2025;

  // Start and end dates fixed
  const start = moment(`${YEAR}-08-01T12:00:00`);
  const end = moment(`${YEAR}-09-30T12:00:00`);

  // Total days between Aug 1 and Sep 30
  const maxDays = end.diff(start, "days");

  console.log(`Picking random dates between ${start.format("YYYY-MM-DD")} and ${end.format("YYYY-MM-DD")}`);

  for (let i = 0; i < n; i++) {
    const offset = random.int(0, maxDays);
    const d = start.clone().add(offset, "days");

    const dateStr = d.format("YYYY-MM-DDTHH:mm:ssZ");

    // write data.json with commit date
    await new Promise((res, rej) =>
      jsonfile.writeFile(path, { date: dateStr }, (err) => (err ? rej(err) : res()))
    );

    console.log(`Commit #${i + 1}: ${dateStr}`);

    await git.raw(["add", path]);
    await git.raw(["commit", "--date", dateStr, "-m", "hello"]);
  }

  await git.raw(["push", "-u", "origin", "main"]);
  console.log("✅ All done. Contributions should appear only in Aug–Sep 2025.");
}

makeCommits(5).catch((err) => console.error(err));