import { parseArgs } from "node:util";
import fs from "fs-extra";

const { values } = parseArgs({
  options: {
    "bitwarden-path": {
      type: "string",
    },
    "1password-path": {
      type: "string",
    },
    "out-path": {
      type: "string"
    },
    "cutoff-date": {
      type: "string",
    }
  },
});

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const convertDate = (dateString) => Math.floor(new Date(dateString).getTime() / 1000);

async function main() {
  if (!values["cutoff-date"]) {
    console.log("warning: no cutoff date provided, will likely fail");
  }

  const cutoff = new Date(values["cutoff-date"]);
  if (!cutoff) {
    return console.log("cutoff date invalid");
  }

  let bwData, opData;
  try {
    bwData = await fs.readJSON(values["bitwarden-path"]);
    opData = await fs.readJSON(values["1password-path"]);
  } catch (e) {
    return console.log("failed to read");
  }

  for (const item of opData.accounts[0].vaults[0].items) {
    const username = item.details.loginFields.find(
      (field) => field.name === "username"
    )?.value;

    const password = item.details.loginFields.find(
      (field) => field.name === "password"
    )?.value;

    let urls = [];
    if (item.overview.urls) {
      urls = item.overview.urls
        .map((url) => url.url?.split("://").at(-1))
        .sort();
    }

    const matches = bwData.items.filter((bwItem) => {
      let bwUrls = [];
      if (bwItem.login?.uris) {
        bwUrls = bwItem.login?.uris
          .map((uri) => uri.uri?.split("://").at(-1))
          .sort();
      }

      return (
        arraysEqual(bwUrls, urls) &&
        bwItem.login?.username == username &&
        bwItem.login?.password == password
      );
    });

    const createdTime = new Date(item.createdAt * 1000);
    const modifiedTime = new Date(item.updatedAt * 1000);
    const newItem = createdTime >= cutoff;
    const modifiedItem = modifiedTime >= cutoff;

    if (matches.length != 1) {
      console.log("failed to match", item.overview.subtitle, "| username/pw:", username, password, urls);

      if (newItem) {
        console.log("\t^ is a new item");
      } else if (modifiedItem) {
        console.log("\t^ is a modified item");
      } else if (urls.every((url) => url.includes("1password.com"))) {
        console.log("\t^ is a 1password item");
      } else {
        console.log("\t ^ actually failed to match. debug");
        return;
      }
    } else {
      const bwItem = matches[0];
      
      // update datetimes
      item.createdAt = convertDate(bwItem.creationDate);
      item.updatedAt = convertDate(bwItem.revisionDate);

      // add password history
      if (bwItem.passwordHistory) {
        for (const historyItem of bwItem.passwordHistory) {
          const newHistoryItem = {
            value: historyItem.password,
            time: convertDate(historyItem.lastUsedDate)
          };
  
          // check if already added to history
          if (item.details.passwordHistory.find((searchItem) => {
            searchItem.value == newHistoryItem.value && searchItem.time == newHistoryItem.time
          }))
  
          item.details.passwordHistory.push(newHistoryItem);
        }
      }
    }
  }

  console.log("done");

  await fs.writeJSON(values["out-path"], opData, {
    spaces: 2
  });
}

main();
