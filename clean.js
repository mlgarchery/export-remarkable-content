import fsPromises from "node:fs/promises";

/**
 * Remove traces for documents for which download has timed out.
 */
const clean408 = async () => {
  const files = await fsPromises.readdir("./documents");
  for (const file of files) {
    const match = file.match(/^(.{36})\.txt$/);

    if (match && match[1]) {
      const filepath = `./documents/${file}`;
      const content = await fsPromises.readFile(filepath, {
        encoding: "utf-8",
      });
      if (content === "Request Failed. Status Code: 408") {
        console.log(filepath);
        await fsPromises.unlink(filepath);
      }
    }
  }
};

clean408();
