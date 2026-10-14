const { scripts } = require("@app/package.json");

describe("Local Android native QA scripts", () => {
  it("prebuilds Android alone and provides an optimized release build without store submission", () => {
    expect({
      prebuild: scripts["prebuild:android"],
      release: scripts["android:release"],
    }).toEqual({
      prebuild: "expo prebuild --platform android --no-install",
      release: "expo run:android --variant release",
    });
  });
});
