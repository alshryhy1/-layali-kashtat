import next from "eslint-config-next";

const config = [
  ...next,
  {
    ignores: ["scripts/**", "test-*.js", "ios/**", "public/uploads/**"],
    rules: {
      "import/no-anonymous-default-export": "off"
    }
  }
];

export default config;
